const { where } = require('sequelize');
const {HistEntrer} = require('../../db/sequelize')
const {Produit, Emballage, sequelize} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

allHEntrer = (app) => {
    app.get('/allHEntrer', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        HistEntrer.findAll({
            order:[['id_hist', 'DESC']]
        })
            .then(harticles => {
                res.status(200).render('')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addHEntrer = (app) => {
    app.post('/addHEntrer/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nb, prix, type, idpro, fournisseur} = req.body;
        if(req.query.art === 'produit'){
            Produit.findByPk(req.params.id)
                .then(produit => {
                    const q = produit.quantiter
                    HistEntrer.create({
                        quantiter: nb,
                        prix_unit: prix,
                        type: type,
                        id_probal: idpro,
                        id_fournisseur: fournisseur
                    })
                        .then(hentrer => {
                            Produit.update({
                                quantiter: parseInt(q) + parseInt(nb)
                            },{
                                where: {id_produit: produit.id_produit}
                            })
                                .then(prod => {
                                    res.redirect('/allProduit?type=achat&msg=Produit ajouter avec succes&tc=alert-success')
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
                .catch(_ => {
                    console.error(_);
                    res.redirect('/notFound');
                    return; // On stoppe tout ici !
                })
        }
        else if(req.query.art === 'emballage'){
            Emballage.findByPk(req.params.id)
                .then(emballage => {
                    const q = emballage.quantiter
                    HistEntrer.create({
                        quantiter: nb,
                        prix_unit: prix,
                        type: type,
                        id_probal: idpro,
                        id_fournisseur: fournisseur
                    })
                        .then(hentrer => {
                            Emballage.update({
                                quantiter: parseInt(q) + parseInt(nb)
                            },{
                                where: {id_emballage: emballage.id_emballage}
                            })
                                .then(prod => {
                                    res.redirect('/allEmballage?type=achat&msg=Emballage ajouter avec succes&tc=alert-success')
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
                .catch(_ => {
                    console.error(_);
                    res.redirect('/notFound');
                    return; // On stoppe tout ici !
                })
        }
        
    })
}

updateHEntrer = (app) => {
    app.put('/updateHEntrer/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        const t = await sequelize.transaction();

        try {
            const { nbr, prix, type, idpro } = req.body;

            if (!['produit', 'emballage'].includes(type)) {
                return res.redirect('/notFound');
            }

            const Model = type === 'produit' ? Produit : Emballage;
            const field = type === 'produit' ? 'id_produit' : 'id_emballage';
            const redirectUrl = type === 'produit' ? '/oneProduit/' : '/oneEmballage/';

            const exist = await HistEntrer.findOne({
                where: { id_hist: req.params.id, type, id_probal: idpro },
                transaction: t
            });

            if (!exist) {
                return res.redirect(`${redirectUrl}${idpro}?msg=Historique introuvable&tc=alert-danger`);
            }

            const article = await Model.findByPk(idpro, { transaction: t });
            if (!article) {
                return res.redirect('/notFound');
            }

            const oldQte = parseInt(exist.quantiter) || 0;
            const newQte = parseInt(nbr) || 0;
            const stock = parseInt(article.quantiter) || 0;

            const newStock = stock - oldQte + newQte;

            if (newStock < 0) {
                return res.redirect(`${redirectUrl}${idpro}?msg=Stock invalide&tc=alert-danger`);
            }

            await Model.update({
                quantiter: newStock
            }, {
                where: { [field]: idpro },
                transaction: t
            });

            await HistEntrer.update({
                quantiter: newQte,
                prix_unit: prix,
            }, {
                where: { id_hist: req.params.id, type, id_probal: idpro },
                transaction: t
            });

            await t.commit();

            res.redirect(`${redirectUrl}${idpro}?msg=Modification réussie&tc=alert-success`);

        } catch (error) {
            await t.rollback();
            console.error(error);
            res.redirect('/notFound');
        }
    });
};

deleteHEntrer = (app) => {
    app.delete('/deleteHEntrer/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {

        try{
            // 1. Trouver l'historique
            const hapro = await HistEntrer.findByPk(req.params.id);
                
            if (!hapro) {
                return res.redirect('/notFound');
            }

            // 2. Mise à jour du stock selon le type
            if (hapro.type === 'produit') {
                const produit = await Produit.findByPk(hapro.id_probal);
                if (produit) {
                    await Produit.update(
                        { quantiter: produit.quantiter - hapro.quantiter },
                        { where: { id_produit: produit.id_produit } }
                    );
                }
            } else if (hapro.type === 'emballage') {
                const emballage = await Emballage.findByPk(hapro.id_probal);
                if (emballage) {
                    await Emballage.update(
                        { quantiter: emballage.quantiter - hapro.quantiter },
                        { where: { id_emballage: emballage.id_emballage } }
                    );
                }
            }

            // 3. Supprimer l'historique après la mise à jour du stock
            await HistEntrer.update({ is_active: false }, { where: { id_hist: hapro.id_hist } });

            // 4. Redirection finale
            if (hapro.type === 'produit') {
                return res.redirect(`/oneProduit/${req.query.id}?msg=Historique supprimer avec succes&tc=alert-success&type=vente`);
            } else {
                return res.redirect(`/oneEmballage/${req.query.id}?msg=Historique supprimer avec succes&tc=alert-success&type=vente`);
            }
        }
        catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
        
    })
}

module.exports = {
    allHEntrer,
    addHEntrer,
    deleteHEntrer,
    updateHEntrer
}