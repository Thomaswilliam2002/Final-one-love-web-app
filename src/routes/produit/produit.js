const {Produit, Caisse} = require('../../db/sequelize');
const {Categorie, HistCaisse} = require('../../db/sequelize');
const {HistEntrer} = require('../../db/sequelize');
const {HistSortie, Fournisseur} = require('../../db/sequelize');
const {fn, col, literal, Op, where} = require('sequelize');
const { sequelize } = require('../../db/sequelize'); 
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

allProduit = (app) => {
    app.get('/allProduit', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {

            const [
                produits,
                categories,
                sumhe,
                caisses,
                fournisseurs
            ] = await Promise.all([

                Produit.findAll({
                    where: {
                        is_active: true
                    },
                    order: [['id_produit', 'DESC']]
                }),

                Categorie.findAll({
                    where: {
                        is_active: true
                    }
                }),

                HistEntrer.findAll({
                    attributes: [
                        [literal("TO_CHAR(\"HistEntrer\".\"created\", 'YYYY-MM')"), "mois"],
                        'id_probal',
                        'type',
                        [literal("SUM(\"quantiter\" * \"prix_unit\")"), 'total_recette'],
                        [literal('(SELECT "nom" FROM "Produits" WHERE "Produits"."id_produit" = "HistEntrer"."id_probal")'), 'nom']
                    ],
                    where: {
                        type: { [Op.in]: ["produit"] },
                        is_active: true
                    },
                    group: [
                        "id_probal",
                        "type",
                        "HistEntrer.id_hist",
                        literal("TO_CHAR(\"HistEntrer\".\"created\", 'YYYY-MM')")
                    ],
                    order: [
                        ["type"],
                        [literal("mois"), "ASC"]
                    ],
                    raw: true
                }),

                Caisse.findAll({where: {is_active: true}}),

                Fournisseur.findAll({where: {is_active: true}})

            ]);

            res.status(200).render('produit', {
                produits,
                sumhes: sumhe,
                categories,
                caisses,
                fournisseurs: fournisseurs,
                msg: req.query.msg,
                tc: req.query.tc
            });

        } catch (err) {
            console.error(err);
            res.redirect('/notFound');
        }
    });
};

formAddProduit = (app) => {
    app.get('/formAddProduit', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        Categorie.findAll()
            .then(categories => {
                //const msg = "Liste recuperer avec succes"
                res.status(200).render('add-produit', {categories: categories});
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

oneProduit = (app) => {
    app.get('/oneProduit/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {

            const produit = await Produit.findByPk(req.params.id);

            if (!produit) {
                return res.redirect('/notFound');
            }

            const [hachats, hventesRaw, hr, hs] = await Promise.all([

                HistEntrer.findAll({
                    where: { id_probal: produit.id_produit, type: 'produit', is_active: true }, order: [['created', 'DESC']],
                    
                    include: [
                        {
                            model: Fournisseur,
                        }
                    ]
                }),

                HistSortie.findAll({
                    where: { id_probal: produit.id_produit, type: 'produit', is_active: true }, order: [['created', 'DESC']]
                }),

                HistEntrer.findAll({
                    attributes: [
                        [literal("TO_CHAR(\"HistEntrer\".\"created\", 'YYYY-MM')"), "mois"],
                        'id_probal',
                        'type',
                        [literal("SUM(\"quantiter\" * \"prix_unit\")"), 'recette'],
                        [literal('(SELECT "nom" FROM "Produits" WHERE "Produits"."id_produit" = "HistEntrer"."id_probal")'), 'nom']
                    ],
                    where: {
                        type: { [Op.in]: ["produit"] }, is_active: true, id_probal: req.params.id
                    },
                    group: [
                        "id_probal",
                        "type",
                        "HistEntrer.id_hist",
                        literal("TO_CHAR(\"HistEntrer\".\"created\", 'YYYY-MM')")
                    ],
                    order: [
                        ["type"],
                        [literal("mois"), "ASC"]
                    ],
                    raw: true
                }),

                HistSortie.findAll({
                    attributes: [
                        [fn('TO_CHAR', col('created'), 'YYYY-MM'), 'mois'],
                        'id_probal',
                        [fn('SUM', literal('quantiter * prix_unit')), 'recette']
                    ],
                    where: { id_probal: req.params.id, type: 'produit', is_active: true },
                    group: [
                        fn('TO_CHAR', col('created'), 'YYYY-MM'),
                        'id_probal',
                        'id_hist'
                    ],
                    raw: true
                })

            ]);

            // récupérer les caisses
            const idsCaisses = hventesRaw.map(h => h.id_caisse);

            const caisses = await Caisse.findAll({
                where: {
                    id_caisse: idsCaisses,
                    is_active: true
                }
            });

            // enrichir
            const hventes = hventesRaw.map(h => {
                const caisse = caisses.find(c => c.id_caisse === h.id_caisse);

                return {
                    ...h.toJSON(),
                    caisse: caisse || null
                };
            });

            res.status(200).render('produit-detail', {
                histe: hr,
                hists: hs,
                produit: produit,
                hachats: hachats,
                hventes: hventes,
                msg: req.query.msg,
                type: req.query.type,
                tc: req.query.tc
            });

        } catch (err) {
            console.error(err);
            res.redirect('/notFound');
        }
    });
};

addProduit = (app) => {
    app.post('/addProduit', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        const {nom, categ, qt, seuil, desc, prix} = req.body;
        Produit.create({
            nom: nom,
            quantiter: qt,
            seuil: seuil,
            description: desc,
            id_categ: categ
        })
            .then(produit => {
                HistEntrer.create({
                    quantiter: qt,
                    prix_unit: prix,
                    type: 'produit',
                    id_probal: produit.id_produit,
                    donneur: 'One Love'
                })
                    .then(hist => {
                        res.redirect('/allProduit?type=article&msg=Ajout du produit avec succes&tc=alert-success')
                    })
                    .catch(_ => {
                        console.error(_);
                        res.redirect('/notFound');
                        return; // On stoppe tout ici !
                    })
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

updateProduit = (app) => {
    app.put('/updateProduit/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        const {nom, categ, seuil, desc} = req.body;
        Produit.update({
            nom: nom, 
            seuil: seuil,
            description: desc,
            id_categ: categ
        },{
            where:{id_produit: req.params.id}
        })
            .then(_ => {
                res.redirect('/allProduit?type=article&msg=Modification du produit avec succes&tc=alert-success')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteProduit = (app) => {
    app.delete('/deleteProduit/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        // Import de sequelize pour la transaction si non global
        // const t = await sequelize.transaction();
        let t;
        try {
            t = await sequelize.transaction();
            const produitId = req.params.id;
            const produit = await Produit.findByPk(produitId, { transaction: t });
            if (!produit) {
                await t.rollback();
                return res.redirect('/notFound');
            }

            // 1. Supprimer l'historique des mouvements de stock (Entrées/Sorties)
            await HistSortie.update({ is_active: false }, { where: { id_probal: produitId, type: 'produit' }, transaction: t });
            // Note: Vérifiez si votre table s'appelle HistEntrer ou HistEntree
            if (typeof HistEntrer !== 'undefined') {
                await HistEntrer.update({ is_active: false }, { where: { id_probal: produitId, type: 'produit' }, transaction: t });
            }

            // 2. IMPORTANT : Gérer l'historique des ventes en caisse
            // On supprime les traces de vente pour ce produit spécifique
            await HistCaisse.update({ 
                is_active: false 
            }, { 
                where: { id_probal: produitId, type: 'produit' }, 
                transaction: t 
            });

            // 3. Supprimer le produit lui-même
            await Produit.update({ is_active: false }, { where: { id_produit: produitId }, transaction: t });
            await t.commit();
            res.redirect('/allProduit?type=article&msg=Suppression du produit avec succes&tc=alert-success');

        } catch (err) {
            // Annulation impérative de la transaction en cas d'échec
            if (t) await t.rollback();
            console.error("Erreur lors de la suppression du produit:", err);
            res.redirect('/notFound');
        }
    });
};
module.exports = {
    allProduit,
    formAddProduit,
    addProduit,
    deleteProduit,
    updateProduit,
    oneProduit
}