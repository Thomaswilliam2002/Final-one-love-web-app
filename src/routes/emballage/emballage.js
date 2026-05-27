const {Emballage, Caisse} = require('../../db/sequelize');
const {Categorie, HistCaisse} = require('../../db/sequelize');
const {HistEntrer} = require('../../db/sequelize');
const {HistSortie, Fournisseur} = require('../../db/sequelize');
const {fn, col, literal, Op, where} = require('sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const { sequelize } = require('../../db/sequelize'); 

allEmballage = (app) => {
    app.get('/allEmballage', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            // On lance toutes les requêtes en parallèle
            const [emballages, categories, caisses, fournisseurs] = await Promise.all([
                Emballage.findAll({ where: { is_active: true }, order: [['id_emballage', 'DESC']] }),
                Categorie.findAll({ where: { is_active: true } }),
                Caisse.findAll({ where: { is_active: true } }),
                Fournisseur.findAll({ where: { is_active: true } })
            ]);

            // On renvoie la vue avec toutes les données
            res.status(200).render('emballage', {
                emballages: emballages,
                categories: categories,
                caisses,
                fournisseurs,
                msg: req.query.msg,
                tc: req.query.tc
            });

        } catch (err) {
            console.error(err);
            res.redirect('/notFound');
        }
    });
}

formAddEmballage = (app) => {
    app.get('/formAddEmballage', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        Categorie.findAll({ where: { is_active: true } })
            .then(categories => {
                //const msg = "Liste recuperer avec succes"
                res.status(200).render('add-emballage', {categories: categories});
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

oneEmballage = (app) => {
    app.get('/oneEmballage/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {

        try {

            const emballage = await Emballage.findByPk(req.params.id);

            if (!emballage) return res.redirect('/notFound');

            // 1. Historique groupé des entrées
            const pEntreeGrouped = HistEntrer.findAll({
                attributes: [
                    [fn('TO_CHAR', col('created'), 'YYYY-MM'), 'mois'],
                    'id_probal',
                    [fn('SUM', literal('quantiter * prix_unit')), 'recette']
                ],
                where: { 
                    id_probal: emballage.id_emballage, 
                    type: 'emballage', 
                    is_active: true 
                },
                group: [
                    fn('TO_CHAR', col('created'), 'YYYY-MM'),
                    'id_probal',
                    'id_hist'
                ],
                order: [[fn('TO_CHAR', col('created'), 'YYYY-MM'), 'ASC']],
                raw: true
            });

            // 2. Historique groupé des sorties
            const pSortieGrouped = HistSortie.findAll({
                attributes: [
                    [fn('TO_CHAR', col('created'), 'YYYY-MM'), 'mois'],
                    'id_probal',
                    [fn('SUM', literal('quantiter * prix_unit')), 'recette']
                ],
                where: { 
                    id_probal: emballage.id_emballage, 
                    type: 'emballage', 
                    is_active: true 
                },
                group: [
                    fn('TO_CHAR', col('created'), 'YYYY-MM'),
                    'id_probal',
                    'id_hist'
                ],
                order: [[fn('TO_CHAR', col('created'), 'YYYY-MM'), 'ASC']],
                raw: true
            });

            // 3. Historiques détaillés
            const pEntreeDetail = HistEntrer.findAll({
                where: { 
                    id_probal: emballage.id_emballage, 
                    type: 'emballage', 
                    is_active: true 
                },
                order: [['created', 'DESC']],
                include: [
                    {
                        model: Fournisseur,
                    }
                ]
            });

            const pSortieDetail = HistSortie.findAll({
                where: { 
                    id_probal: emballage.id_emballage, 
                    type: 'emballage', 
                    is_active: true 
                }
            });

            const [hr, hs, hachats, hventesRaw] = await Promise.all([
                pEntreeGrouped,
                pSortieGrouped,
                pEntreeDetail,
                pSortieDetail
            ]);

            // récupérer les id de caisse
            const idsCaisses = [...new Set(hventesRaw.map(h => h.id_caisse))];

            // récupérer les caisses
            const caisses = await Caisse.findAll({
                where: {
                    id_caisse: idsCaisses,
                    is_active: true
                }
            });

            // map rapide
            const caisseMap = new Map(caisses.map(c => [c.id_caisse, c]));

            // enrichir les ventes
            const hventes = hventesRaw.map(h => ({
                ...h.toJSON(),
                caisse: caisseMap.get(h.id_caisse) || null
            }));

            res.status(200).render('emballage-detail', {
                histe: hr,
                hists: hs,
                emballage: emballage,
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
}

addEmballage = (app) => {
    app.post('/addEmballage', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        const {nom, categ, qt, seuil, desc, prix} = req.body;
        Emballage.create({
            nom: nom,
            quantiter: qt,
            seuil: seuil,
            description: desc,
            id_categ: categ
        })
            .then(emballage => {
                HistEntrer.create({
                    quantiter: qt,
                    prix_unit: prix,
                    type: 'emballage',
                    id_probal: emballage.id_emballage,
                    donneur: 'One Love'
                })
                    .then(hist => {
                        res.redirect('/allEmballage?type=article&msg=Ajout de l\'emballage avec succes&tc=alert-success')
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

updateEmballage = (app) => {
    app.put('/updateEmballage/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        const {nom, categ, seuil, desc} = req.body;
        Emballage.update({
            nom: nom,
            seuil: seuil,
            description: desc,
            id_categ: categ
        },{
            where:{id_emballage: req.params.id}
        })
            .then(_ => {
                // const msg = "Modification du bar avec succes"
                // res.json({msg})
                res.redirect('/allEmballage?type=article&msg=Modification de l\'emballage avec succes&tc=alert-success')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteEmballage = (app) => {
    app.delete('/deleteEmballage/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        // Import de sequelize pour gérer la transaction
        const t = await sequelize.transaction();
        
        try {
            const emballageId = req.params.id;
            
            // 1. Vérifier si l'emballage existe
            const emballage = await Emballage.findByPk(emballageId, { transaction: t });

            if (!emballage) {
                await t.rollback();
                return res.redirect('/notFound');
            }

            // 2. Nettoyer l'historique des mouvements de stock (Entrées/Sorties)
            // On précise le type 'emballage' pour être précis dans HistSortie
            await HistSortie.update({ 
                is_active: false 
            }, { 
                where: { id_probal: emballageId, type: 'emballage' }, 
                transaction: t 
            });

            // Si vous avez une table d'historique des entrées spécifique aux emballages
            // Adaptez le nom de la table si nécessaire (ex: HistEntrerEmballage)
            if (typeof HistEntrer !== 'undefined') {
                await HistEntrer.update({ 
                    is_active: false 
                }, { 
                    where: { id_probal: emballageId, type: 'emballage' }, // Vérifiez si le champ est id_produit ou id_emballage
                    transaction: t 
                });
            }

            // 3. IMPORTANT : Supprimer les traces de ventes en caisse
            // Dans HistCaisse, les emballages sont identifiés par id_probal + type 'emballage'
            await HistCaisse.update({ is_active: false }, { 
                where: { id_probal: emballageId, type: 'emballage' }, 
                transaction: t 
            });

            // 4. Supprimer l'emballage lui-même
            await Emballage.update({ is_active: false }, { 
                where: { id_emballage: emballageId }, 
                transaction: t 
            });

            // Validation de toutes les opérations
            await t.commit();
            
            // Redirection avec message de succès (type=emballage pour filtrer la vue)
            res.redirect('/allEmballage?type=article&msg=Suppression de l\'emballage avec succes&tc=alert-success');

        } catch (err) {
            // Annulation de tous les changements en cas d'erreur
            if (t) await t.rollback();
            console.error("Erreur lors de la suppression de l'emballage:", err);
            res.redirect('/notFound');
        }
    });
};

module.exports = {
    allEmballage,
    formAddEmballage,
    addEmballage,
    deleteEmballage,
    updateEmballage,
    oneEmballage
}