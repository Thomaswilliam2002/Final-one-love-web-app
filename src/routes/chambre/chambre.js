const { where } = require('sequelize')
const {Chambre, MaisonColse, Occupent, ChambreJournal, sequelize} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

allChambre = (app) => {
    app.get('/allChambre', (req, res) => {
        Chambre.findAll({
            where: {is_active: true},
            order:[['id_chambre', 'DESC']]
        })
            .then(chambres => {
                const msg = "Liste recuperer avec succes"
                res.json({msg, data: chambres})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

oneChambre = (app) => {
    app.get('/oneChambre/:id/:id_mc', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {

            const { id, id_mc } = req.params;

            const [maisonColse, chambre, occupent, chambreJournals] = await Promise.all([

                MaisonColse.findByPk(id_mc),

                Chambre.findByPk(id),

                Occupent.findAll({
                    where: {
                        id_chambre: id,
                        id_mclose: id_mc,
                        is_active: true
                    }
                }),

                ChambreJournal.findAll({
                    where: {
                        id_mclose: id_mc,
                        id_chambre: id,
                        is_active: true
                    }
                })

            ]);

            res.status(200).render('chambre-detail', {
                chambre,
                maisonColse,
                occupent,
                chambreJournals,
                msg: req.query.msg,
                tc: req.query.tc
            });

        } catch (e) {
            console.error(e);
            res.redirect('/notFound');
            return;
        }
    });
}

addChambre = (app) => {
    app.post('/addChambre', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        const {nom, montant, dispo, mclose, desc} = req.body

        const exist = await Chambre.findOne({
            where: {
                nom: nom,
                id_mclose: mclose,
                is_active: true
            }
        })
        if (exist) {
            return res.redirect('/Add?msg=Une chambre portant ce nom au sein de cette maison Colse existe deja.Pour eviter toute confusion, veuillez choisir un autre nom&tc=alert-warning');
        }
        
        Chambre.create({
            nom: nom,
            loyer: montant,
            disponibiliter: dispo,
            description: desc,
            id_mclose: mclose
        })
            .then(chambre => {
                // const msg = "la chambre " + req.body.nom + "a ete ajouter avec succes"
                // res.json({msg, data: chambre})
                res.redirect('/allMClose?msg=Chambre ajouter avec succes&tc=alert-success')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

updateChambre = (app) => {
    app.put('/updateChambre/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        const {nom, loyer, dispo, desc} = req.body
        Chambre.update({
            nom: nom,
            loyer: loyer,
            disponibiliter: dispo,
            description: desc,
        }, {
            where: {id_chambre: req.params.id}
        })
            .then(_ => {
                // const msg = "Modification de la chambre avec succes"
                // res.json({msg})
                res.redirect('/allMClose?msg=Modification de la chambre avec succes&tc=alert-success')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteChambre = (app) => {
    app.delete('/deleteChambre/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const t = await sequelize.transaction();
            await Chambre.update({is_active: false}, {where: {id_chambre: req.params.id}, transaction: t});
            await ChambreJournal.update({is_active: false}, {where: {id_chambre: req.params.id, is_active: true}, transaction: t});
            await Occupent.update({is_active: false}, {where: {id_chambre: req.params.id, is_active: true}, transaction: t});
            await t.commit();
            res.redirect('/allMClose?msg=Suppression de la chambre avec succes&tc=alert-success');
        }
        catch(_){
            console.error(_);
            await t.rollback();
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

module.exports = {
    allChambre,
    oneChambre,
    addChambre,
    updateChambre,
    deleteChambre
}