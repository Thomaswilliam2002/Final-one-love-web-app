const { where, literal, Op, fn, col, } = require('sequelize');
const {Produit,Caisse, HistSortie, Emballage, HistCaisse, Personnel, sequelize} = require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

statsRecetteMoris = (app) => {
    app.get(
        [
            '/stats/recette',
            '/stats/recette/:annee',
            '/stats/recette/:annee/:mois',
            '/stats/recette/:annee/:mois/:semaine'
        ],
        protrctionRoot,
        authorise('admin', 'comptable', 'caissier central'),

        async (req, res) => {

            try {

                // const { annee, mois, semaine } = req.params;
                const annee = req.params.annee ? parseInt(req.params.annee) : null;
                const mois = req.params.mois ? parseInt(req.params.mois) : null;
                const semaine = req.params.semaine ? parseInt(req.params.semaine) : null;

                let groupFormat;
                let whereClause = {};

                // --------------------------------------------------
                // 1️⃣ RECUPERATION DES ANNEES POUR LE MENU
                // --------------------------------------------------

                const distinctYears = await HistCaisse.findAll({

                    attributes: [
                        [fn('DISTINCT', literal('EXTRACT(YEAR FROM "created")')), 'annee']
                    ],

                    order: [
                        [literal('EXTRACT(YEAR FROM "created")'), 'DESC']
                    ],

                    raw: true,
                    where:{is_active: true}
                });


                // --------------------------------------------------
                // 2️⃣ LOGIQUE DE NAVIGATION (DRILL DOWN)
                // --------------------------------------------------

                if (!annee) {

                    // VUE GLOBALE : PAR ANNEE
                    groupFormat = 'YYYY';

                } else if (!mois) {

                    // VUE D'UNE ANNEE : PAR MOIS
                    groupFormat = 'YYYY-MM';

                    whereClause = {
                        is_active: true,
                        [Op.and]: [
                            where(
                                literal('EXTRACT(YEAR FROM "created")'),
                                annee
                            )
                        ]
                    };

                } else if (!semaine) {

                    // VUE PAR SEMAINE
                    groupFormat = 'IW';

                    whereClause = {
                        is_active: true,
                        [Op.and]: [

                            where(
                                literal('EXTRACT(YEAR FROM "created")'),
                                annee
                            ),

                            where(
                                literal('EXTRACT(MONTH FROM "created")'),
                                mois
                            )

                        ]
                    };

                } else {

                    // DETAIL D'UNE SEMAINE : PAR JOUR
                    groupFormat = 'YYYY-MM-DD';

                    whereClause = {
                        is_active: true,
                        [Op.and]: [

                            where(
                                literal('EXTRACT(YEAR FROM "created")'),
                                annee
                            ),

                            where(
                                literal('EXTRACT(MONTH FROM "created")'),
                                mois
                            ),

                            where(
                                literal('EXTRACT(WEEK FROM "created")'),
                                semaine
                            )

                        ]
                    };

                }


                // --------------------------------------------------
                // 3️⃣ RECUPERATION DES DONNEES
                // --------------------------------------------------

                const rawStats = await HistCaisse.findAll({

                    attributes: [

                        [
                            fn('TO_CHAR', col('created'), groupFormat),
                            'periode'
                        ],

                        [
                            fn(
                                'SUM',
                                literal('quantiter * prix_unit')
                            ),
                            'total'
                        ],

                        'id_caisse'

                    ],

                    where: whereClause,

                    group: [

                        fn(
                            'TO_CHAR',
                            col('created'),
                            groupFormat
                        ),

                        'id_caisse'

                    ],

                    order: [

                        [
                            fn(
                                'TO_CHAR',
                                col('created'),
                                groupFormat
                            ),
                            'ASC'
                        ]

                    ],

                    raw: true

                });


                // --------------------------------------------------
                // 4️⃣ RECUPERATION DES CAISSES
                // --------------------------------------------------

                const caissesMapData = await Caisse.findAll({
                    raw: true
                });

                const caisseMap = {};

                caissesMapData.forEach(c => {

                    caisseMap[c.id_caisse] = c.nom;

                });


                // --------------------------------------------------
                // 5️⃣ FORMATAGE POUR MORRIS.JS
                // --------------------------------------------------

                const formattedData = {};
                const caissesSet = new Set();

                let niveau;

                if (!annee) niveau = 'annee';
                else if (!mois) niveau = 'mois';
                else if (!semaine) niveau = 'semaine';
                else niveau = 'jour';


                function getWeekDates(week, year) {

                    const simple = new Date(year, 0, 1 + (week - 1) * 7);

                    const dayOfWeek = simple.getDay();
                    const ISOweekStart = new Date(simple);

                    if (dayOfWeek <= 4)
                        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
                    else
                        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

                    const start = new Date(ISOweekStart);
                    const end = new Date(ISOweekStart);

                    end.setDate(start.getDate() + 6);

                    return { start, end };
                }

                rawStats.forEach(stat => {

                    let periode = stat.periode;

                    if (niveau === 'semaine') {

                        const dates = getWeekDates(parseInt(periode), parseInt(annee));

                        const start = dates.start.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                        });

                        const end = dates.end.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                        });

                        periode = `Sem ${periode} (${start} - ${end})`;
                    }

                    if (!formattedData[periode]) {
                        formattedData[periode] = { y: periode };
                    }

                    const nomCaisse =
                        caisseMap[stat.id_caisse] ||
                        `Caisse ${stat.id_caisse}`;

                    formattedData[periode][nomCaisse] = parseFloat(stat.total);

                    caissesSet.add(nomCaisse);

                });


                res.render('stats-recette', {

                    chartData: Object.values(formattedData),

                    caisses: Array.from(caissesSet),

                    annees: distinctYears,

                    niveau: niveau,

                    params: req.params

                });


            } catch (error) {

                console.error("Erreur statsRecette:", error);

                res.redirect('/notFound');

            }

        }
    );
};

allProduitCaisse = (app) => {
    app.get('/allProduitCaisse/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {

        try {

            const personnelId = req.params.id;

            // ================================
            // 1️⃣ Récupérer le personnel + ses caisses
            // ================================
            const personnel = await Personnel.findByPk(personnelId, {
                include: [{
                    model: Caisse,
                    required: false,
                    where: { is_active: true },
                    through: { attributes: [] }
                }]
            });

            if (!personnel) {
                return res.redirect('/notFound');
            }

            // ================================
            // 2️⃣ Traiter chaque caisse
            // ================================
            const caissesAvecInventaire = await Promise.all(

                personnel.Caisses.map(async (caisse) => {

                    const idLieu = caisse.id_lieu;
                    const typeLieu = caisse.type_lieu;
                    const idCaisse = caisse.id_caisse;

                    // ====================================================
                    // Fonction qui récupère l'inventaire (produit ou emballage)
                    // ====================================================
                    const recupererInventaire = async (modelType) => {
                        // ====================================================
                        // A️⃣ TOTAL REÇU DANS LA CAISSE
                        // ====================================================
                        const mouvements = await HistSortie.findAll({
                            where: {
                                type: modelType,
                                receveur: idLieu,
                                type_lieu_receveur: typeLieu,
                                id_caisse: idCaisse,
                                is_active: true
                            },
                            attributes: [
                                'id_probal',
                                [sequelize.fn('SUM', sequelize.col('quantiter')), 'total_recu']
                            ],
                            group: ['id_probal'],
                            raw: true
                        });

                        // ⭐ AJOUT
                        // ====================================================
                        // B️⃣ TOTAL VENDU PAR LA CAISSE (HistCaisse)
                        // ====================================================
                        const ventes = await HistCaisse.findAll({
                            where: {
                                type: modelType,
                                id_caisse: caisse.id_caisse,
                                is_active: true
                            },
                            attributes: [
                                'id_probal',
                                [sequelize.fn('SUM', sequelize.col('quantiter')), 'total_vendu']
                            ],
                            group: ['id_probal'],
                            raw: true
                        });

                        // ⭐ AJOUT
                        // Transformer les ventes en objet pour accès rapide
                        const ventesMap = {};

                        ventes.forEach(v => {
                            ventesMap[v.id_probal] = parseFloat(v.total_vendu);
                        });

                        // ====================================================
                        // C️⃣ Construire l'inventaire final
                        // ====================================================
                        return await Promise.all(

                            mouvements.map(async (mouv) => {

                                // ✏️ MODIFICATION
                                // récupération info article
                                let infoArticle;

                                if (modelType === 'produit') {
                                    infoArticle = await Produit.findByPk(mouv.id_probal);
                                } else {
                                    infoArticle = await Emballage.findByPk(mouv.id_probal);
                                }

                                // récupérer dernier prix
                                const dernierPrix = await HistSortie.findOne({
                                    where: {
                                        id_probal: mouv.id_probal,
                                        type: modelType,
                                        receveur: idLieu,
                                        type_lieu_receveur: typeLieu,
                                        id_caisse: idCaisse,
                                        is_active: true
                                    },
                                    order: [['created', 'DESC']],
                                    attributes: ['prix_unit'],
                                    raw: true
                                });

                                // ====================================================
                                // ✏️ MODIFICATION : CALCUL STOCK REEL
                                // ====================================================

                                const totalRecu = parseFloat(mouv.total_recu || 0);

                                // ⭐ AJOUT
                                const totalVendu = ventesMap[mouv.id_probal] || 0;

                                // ⭐ AJOUT
                                const stockReel = totalRecu - totalVendu;

                                return {
                                    id: mouv.id_probal,
                                    nom: infoArticle ? (infoArticle.nom || infoArticle.nom_produit) : "Inconnu",

                                    // ✏️ MODIFICATION
                                    quantite_disponible: stockReel,

                                    prix_unitaire: dernierPrix ? dernierPrix.prix_unit : 0,
                                    type: modelType
                                };
                            })
                        );
                    };

                    // ====================================================
                    // 3️⃣ Récupérer produits et emballages
                    // ====================================================
                    const [listeProduits, listeEmballages] = await Promise.all([
                        recupererInventaire('produit'),
                        recupererInventaire('emballage')
                    ]);

                    // ====================================================
                    // 4️⃣ Construire l'objet caisse
                    // ====================================================
                    return {
                        id_caisse: caisse.id_caisse,
                        nom_caisse: caisse.nom,
                        sous_departement: caisse.nom_lieu,
                        departement: typeLieu,
                        inventaire: {
                            produits: listeProduits,
                            emballages: listeEmballages
                        }
                    };

                })
            );
            // ================================
            // 5️⃣ Envoyer vers la vue
            // ================================
            res.render('produitCaisse', {
                caisses: caissesAvecInventaire,
                personnel: personnel,
                msg: req.query.msg,
                tc: req.query.tc
            });

        } catch (error) {

            console.error("Erreur critique dans allProduitCaisse:", error);

            if (!res.headersSent) {
                res.redirect('/notFound');
            }

        }
    });
};

allCaisseArticle = (app) => {
    app.get('/allCaisseArticle/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {

        try {

            const caisseId = req.params.id;

            // ================================
            // 1️⃣ Récupérer la caisse directement
            // ================================
            const caisse = await Caisse.findByPk(caisseId);

            if (!caisse) {
                return res.redirect('/notFound');
            }

            // On transforme en tableau pour garder exactement la même logique
            const caisses = [caisse];

            // ================================
            // 2️⃣ Traiter la caisse
            // ================================
            const caissesAvecInventaire = await Promise.all(

                caisses.map(async (caisse) => {

                    const idLieu = caisse.id_lieu;
                    const typeLieu = caisse.type_lieu;
                    const idCaisse = caisse.id_caisse;

                    const recupererInventaire = async (modelType) => {

                        const mouvements = await HistSortie.findAll({
                            where: {
                                type: modelType,
                                receveur: idLieu,
                                type_lieu_receveur: typeLieu,
                                id_caisse: idCaisse,
                                is_active: true
                            },
                            attributes: [
                                'id_probal',
                                [sequelize.fn('SUM', sequelize.col('quantiter')), 'total_recu']
                            ],
                            group: ['id_probal'],
                            raw: true
                        });

                        const ventes = await HistCaisse.findAll({
                            where: {
                                type: modelType,
                                id_caisse: caisse.id_caisse,
                                is_active: true
                            },
                            attributes: [
                                'id_probal',
                                [sequelize.fn('SUM', sequelize.col('quantiter')), 'total_vendu']
                            ],
                            group: ['id_probal'],
                            raw: true
                        });

                        const ventesMap = {};

                        ventes.forEach(v => {
                            ventesMap[v.id_probal] = parseFloat(v.total_vendu);
                        });

                        return await Promise.all(

                            mouvements.map(async (mouv) => {

                                let infoArticle;

                                if (modelType === 'produit') {
                                    infoArticle = await Produit.findByPk(mouv.id_probal, {
                                        where: { is_active: true }
                                    });
                                } else {
                                    infoArticle = await Emballage.findByPk(mouv.id_probal, {
                                        where: { is_active: true }
                                    });
                                }

                                const dernierPrix = await HistSortie.findOne({
                                    where: {
                                        id_probal: mouv.id_probal,
                                        type: modelType,
                                        receveur: idLieu,
                                        type_lieu_receveur: typeLieu,
                                        id_caisse: idCaisse,
                                        is_active: true
                                    },
                                    order: [['created', 'DESC']],
                                    attributes: ['prix_unit'],
                                    raw: true
                                });

                                const totalRecu = parseFloat(mouv.total_recu || 0);
                                const totalVendu = ventesMap[mouv.id_probal] || 0;
                                const stockReel = totalRecu - totalVendu;

                                return {
                                    id: mouv.id_probal,
                                    nom: infoArticle ? (infoArticle.nom || infoArticle.nom_produit) : "Inconnu",
                                    quantite_disponible: stockReel,
                                    prix_unitaire: dernierPrix ? dernierPrix.prix_unit : 0,
                                    type: modelType
                                };
                            })
                        );
                    };

                    const [listeProduits, listeEmballages] = await Promise.all([
                        recupererInventaire('produit'),
                        recupererInventaire('emballage')
                    ]);

                    return {
                        id_caisse: caisse.id_caisse,
                        nom_caisse: caisse.nom,
                        sous_departement: caisse.nom_lieu,
                        departement: typeLieu,
                        inventaire: {
                            produits: listeProduits,
                            emballages: listeEmballages
                        }
                    };

                })
            );

            res.render('produitCaisse', {
                caisses: caissesAvecInventaire,
                personnel: null,
                msg: req.query.msg,
                tc: req.query.tc
            });

        } catch (error) {

            console.error("Erreur critique dans allCaisseArticle:", error);

            if (!res.headersSent) {
                res.redirect('/notFound');
            }

        }
    });
};

allCaisseContent = (app) => {
    app.get(
        '/allCaisseContent',
        protrctionRoot,
        authorise('admin', 'comptable', 'caissier central'),
        async (req, res) => {

            try {

                // ================================
                // 1️⃣ Récupérer toutes les caisses actives
                // ================================
                const caisses = await Caisse.findAll({
                    where: { is_active: true },
                    include: [{
                        model: Personnel,
                        attributes: ['id_personnel', 'nom', 'prenom', 'numero'],
                        through: { attributes: [] },
                        required: false,
                        where: { is_active: true }
                    }]
                });

                // ================================
                // 2️⃣ Traiter chaque caisse
                // ================================
                const caissesAvecInventaire = await Promise.all(

                    caisses.map(async (caisse) => {

                        const idLieu = caisse.id_lieu;
                        const typeLieu = caisse.type_lieu;
                        const idCaisse = caisse.id_caisse;

                        // ============================================
                        // Fonction récupération inventaire
                        // ============================================
                        const recupererInventaire = async (modelType) => {

                            const mouvements = await HistSortie.findAll({
                                where: {
                                    type: modelType,
                                    receveur: idLieu,
                                    type_lieu_receveur: typeLieu,
                                    id_caisse: idCaisse,
                                    is_active: true
                                },
                                attributes: [
                                    'id_probal',
                                    [sequelize.fn('SUM', sequelize.col('quantiter')), 'total_recu']
                                ],
                                group: ['id_probal'],
                                raw: true
                            });

                            const ventes = await HistCaisse.findAll({
                                where: {
                                    type: modelType,
                                    id_caisse: idCaisse,
                                    is_active: true
                                },
                                attributes: [
                                    'id_probal',
                                    [sequelize.fn('SUM', sequelize.col('quantiter')), 'total_vendu']
                                ],
                                group: ['id_probal'],
                                raw: true
                            });

                            const ventesMap = {};

                            ventes.forEach(v => {
                                ventesMap[v.id_probal] = parseFloat(v.total_vendu);
                            });

                            return await Promise.all(

                                mouvements.map(async (mouv) => {

                                    let infoArticle;

                                    if (modelType === 'produit') {
                                        infoArticle = await Produit.findByPk(mouv.id_probal);
                                    } else {
                                        infoArticle = await Emballage.findByPk(mouv.id_probal);
                                    }

                                    const dernierPrix = await HistSortie.findOne({
                                        where: {
                                            id_probal: mouv.id_probal,
                                            type: modelType,
                                            receveur: idLieu,
                                            type_lieu_receveur: typeLieu,
                                            id_caisse: idCaisse,
                                            is_active: true
                                        },
                                        order: [['created', 'DESC']],
                                        attributes: ['prix_unit'],
                                        raw: true
                                    });

                                    const totalRecu = parseFloat(mouv.total_recu || 0);
                                    const totalVendu = ventesMap[mouv.id_probal] || 0;
                                    const stockReel = totalRecu - totalVendu;

                                    return {
                                        id: mouv.id_probal,
                                        nom: infoArticle ? (infoArticle.nom || infoArticle.nom_produit) : "Inconnu",
                                        quantite_disponible: stockReel,
                                        prix_unitaire: dernierPrix ? dernierPrix.prix_unit : 0,
                                        type: modelType
                                    };

                                })
                            );
                        };

                        // ============================================
                        // 3️⃣ Récupérer produits et emballages
                        // ============================================
                        const [listeProduits, listeEmballages] = await Promise.all([
                            recupererInventaire('produit'),
                            recupererInventaire('emballage')
                        ]);

                        // ============================================
                        // 4️⃣ Liste des caissiers
                        // ============================================
                        const caissiers = caisse.Personnels.map(p => ({
                            id: p.id_personnel,
                            nom: p.nom,
                            prenom: p.prenom,
                            numero: p.numero
                        }));

                        // ============================================
                        // 5️⃣ Objet final
                        // ============================================
                        return {
                            id_caisse: caisse.id_caisse,
                            nom_caisse: caisse.nom,
                            sous_departement: caisse.nom_lieu,
                            departement: caisse.type_lieu,

                            caissiers: caissiers,

                            inventaire: {
                                produits: listeProduits,
                                emballages: listeEmballages
                            }
                        };

                    })
                );

                // ================================
                // 6️⃣ Envoyer vers la vue
                // ================================
                res.render('allCaisseContent', {
                    caisses: caissesAvecInventaire,
                    personnel: null,
                    msg: req.query.msg,
                    tc: req.query.tc
                });

            } catch (error) {

                console.error("Erreur critique dans allCaisseContent:", error);

                if (!res.headersSent) {
                    res.redirect('/notFound');
                }

            }

        }
    );
};

addHistCaisse = (app) => {
    app.post('/addHistCaisse', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) =>{
        const {qte, prix, type, idpro, caisse, caissier, date} = req.body;
        console.log(req.body)
        try{
            const ajoutHist = await HistCaisse.create({
                quantiter: qte,
                prix_unit: prix,
                type: type,
                id_probal: idpro,
                id_caisse: caisse,
                id_caissier: caissier,
                date: date
            })
            if(req.query.src && req.query.src === 'caissier'){
                res.redirect(`/allProduitCaisse/${caissier}?msg=Nouvelle vente ajoutée !&tc=alert-success`);
            }else{
                res.redirect(`/allCaisseArticle/${caisse}?msg=Nouvelle vente ajoutée !&tc=alert-success`);
            }
        }catch (e){
            console.error(e);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
        
    }
)}

allHistCaisse = (app) => {
    app.get(['/allHistCaisse/:id', '/allHistCaisse'], protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try {
            let hists;

            // 1. RÉCUPÉRATION DE L'HISTORIQUE BRUT
            if (req.params.id) {
                // Cas Caissier : on cherche d'abord les IDs de ses caisses via la table pivot
                const personnelInfos = await Personnel.findByPk(req.params.id, {
                    include: [{ model: Caisse, through: { attributes: [] }, where: { is_active: true }, required: false }],
                });

                if (!personnelInfos || !personnelInfos.Caisses || personnelInfos.Caisses.length === 0) {
                    hists = [];
                } else {
                    const idsMesCaisses = personnelInfos.Caisses.map(c => c.id_caisse);
                    // On récupère l'historique de toutes ces caisses
                    hists = await HistCaisse.findAll({
                        where: { id_caisse: idsMesCaisses, is_active: true },
                        order: [['created', 'DESC']]
                    });
                }
            } else {
                // Cas Admin : tout l'historique
                hists = await HistCaisse.findAll({ order: [['created', 'DESC']], where: { is_active: true } });
            }

            // 2. JOINTURES MANUELLES POUR CHAQUE LIGNE
            const histsEnrichi = await Promise.all(hists.map(async (h) => {
                
                // Jointure manuelle Personnel (id_caissier)
                const vendeur = await Personnel.findOne({
                    where: { id_personnel: h.id_caissier, is_active: true }
                });

                // Jointure manuelle Caisse (id_caisse)
                const caisseInfos = await Caisse.findOne({
                    where: { id_caisse: h.id_caisse, is_active: true }
                });

                // Jointure manuelle Article (id_probal + type)
                let article;
                if (h.type === 'produit') {
                    article = await Produit.findByPk(h.id_probal);
                } else {
                    article = await Emballage.findByPk(h.id_probal);
                }

                // Retour de l'objet combiné
                return {
                    ...h.get({ plain: true }),
                    nom_caissier: vendeur ? `${vendeur.nom} ${vendeur.prenom}` : "Inconnu",
                    nom_caisse: caisseInfos ? caisseInfos.nom : "Inconnue",
                    nom_article: article ? (article.nom || article.nom_produit) : "Article supprimé"
                };
            }));

            res.status(200).render('allHistCaisse', {
                hists: histsEnrichi,
                msg: req.query.msg,
                tc: req.query.tc
            });

        } catch (e) {
            console.error("Erreur dans allHistCaisse :", e);
            res.redirect('/notFound');
        }
    });
};

deleteHistCaisse = (app) => {
    app.delete('/deleteHistCaisse/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try {
            // 1. Trouver l'enregistrement de vente
            const histDel = await HistCaisse.findByPk(req.params.id);
            if (!histDel) return res.redirect('/notFound');

            // 2. Désactivation logique de la vente
            // En passant is_active à false, cette vente ne sera plus 
            // prise en compte dans le calcul (Total Reçu - Total Vendu)

            // await HistCaisse.update(
            //     { is_active: false }, 
            //     { where: { id_hist: histDel.id_hist } }
            // );

            await histDel.update({ is_active:false });

            // 3. Redirection
            // Le calcul dynamique dans 'allProduitCaisse' affichera 
            // désormais la quantité correcte automatiquement.
            if(req.query.ns && req.query.ns === 'ns'){
                return res.redirect(`/allHistCaisse?msg=Vente annulée, le stock de la caisse n'a pas éte mis à jour.&tc=alert-warning`);
            }
            else if(req.query.is){
                return res.redirect(`/allHistCaisse/${req.query.is}?msg=Vente annulée, le stock de la caisse a été mis à jour.&tc=alert-warning`);
            }

            // sécurité : toujours renvoyer une réponse
            return res.redirect('/allHistCaisse');

        } catch (error) {
            console.error("Erreur deleteHistCaisse:", error);
            if (!res.headersSent) return res.redirect('/notFound');
        }
    });
};

module.exports = {
    allProduitCaisse,
    addHistCaisse,
    allHistCaisse,
    deleteHistCaisse,
    statsRecetteMoris,
    allCaisseArticle,
    allCaisseContent
}