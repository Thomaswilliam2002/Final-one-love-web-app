const { where, Op } = require('sequelize')
const {MaisonColse} = require('../../db/sequelize')
const {Chambre, sequelize, ChambreJournal, Occupent} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

// formAddAdmin = (app) =>{
//     app.get('/formAddAdmin', (req, res) => {
//         res.status(200).render('add-admin')
//     })
// }

allMClose = (app) => {
    app.get('/allMClose', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        MaisonColse.findAll({
            where:{is_active: true},
            order:[['id_mclose', 'ASC']]
        })
            .then(maisonColses => {
                Chambre.findAll({
                    include:[
                        {model: ChambreJournal, where: {is_active: true}, required: false},
                        {model:MaisonColse, where: {is_active: true}, required: false}
                    ],
                    where:{is_active: true},
                    order:[['id_chambre', 'ASC']]
                })
                    .then(chambres => {
                        //res.json(maisonColses)
                        console.log(JSON.parse(JSON.stringify(chambres)))
                        res.status(200).render('mclose',{maisonColses: maisonColses, chambres: chambres, msg: req.query.msg, tc: req.query.tc})
                    })
                //const msg = "Liste recuperer avec succes"
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

oneMClose = (app) => {
    app.get('/oneMClose/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        MaisonColse.findByPk(req.params.id)
            .then(maisonColse => {
                Chambre.findOne({
                    where: {id_mclose: maisonColse.id_mclose, is_active: true}
                })
                    .then(chambres => {
                        //res.json(maisonColses)
                        res.status(200).render('mclose-detail',{maisonColse: maisonColse, chambres: chambres})
                    })
                //res.status(200).render('mclose-detail')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addMClose = (app) => {
    app.post('/addMClose', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        const {nom, adresse, nbr} = req.body

        const exist = await MaisonColse.findOne({
            where: {
                nom: nom,
                is_active: true
            }
        })
        if (exist) {
            return res.redirect('/Add?msg=Une maison Colse portant ce nom existe deja.Pour eviter toute confusion, veuillez choisir un autre nom&tc=alert-warning');
        }
        
        MaisonColse.create({
            nom: nom,
            adresse: adresse,
            nb_chambre: nbr
        })
            .then(maisonColse => {
                // const msg = "la maisonColse " + req.body.nom + "a ete ajouter avec succes"
                // res.json({msg, data: maisonColse})
                res.redirect('/allMClose?msg=Maison Colse ajouter avec succes&tc=alert-success')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

updateMClose = (app) => {
    app.put('/updateMClose/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, adresse, nb} = req.body
        MaisonColse.update({
            nom: nom,
            adresse: adresse,
            nb_chambre: nb
        }, {
            where: {id_mclose: req.params.id}
        })
            .then(_ => {
                // const msg = "Modification de la maisonColse avec succes"
                // res.json({msg})
                res.redirect('/allMClose')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteMClose = (app) => {
    app.delete('/deleteMClose/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        let t;
        try {
            t = await sequelize.transaction();

            const appartDel = await MaisonColse.findByPk(req.params.id, { transaction: t });

            if (!appartDel) {
                await t.rollback();
                return res.redirect('/notFound');
            }

            // récupérer les IDs des chambres actives
            const appartDelChambres = await Chambre.findAll({
                where: { id_mclose: appartDel.id_mclose, is_active: true },
                attributes: ['id_chambre'],
                transaction: t
            });
            const appartDelChambresId = appartDelChambres.map(ch => ch.id_chambre);

            // Supprimer d'abord les dépendances
            await Promise.all([
                ChambreJournal.update(
                    { is_active: false },
                    { where: { id_mclose: appartDel.id_mclose, is_active: true }, transaction: t }
                ),
                Chambre.update(
                    { is_active: false },
                    { where: { id_mclose: appartDel.id_mclose, is_active: true }, transaction: t }
                ),
            ]);

            // Supprimer les occupants
            if (appartDelChambresId.length > 0) {
                await Occupent.update(
                    { is_active: false },
                    { where: { id_chambre: { [Op.in]: appartDelChambresId }, is_active: true }, transaction: t }
                );
            }

            // Supprimer la maison
            await MaisonColse.update(
                { is_active: false },
                { where: { id_mclose: appartDel.id_mclose }, transaction: t }
            );

            await t.commit();
            res.redirect('/allMClose?msg=Suppression de la maisonColse avec succes&tc=alert-success');
        } catch (err) {
            console.error(err);
            if (t) await t.rollback();
            res.redirect('/notFound');
        }
    });
}



module.exports = {
    allMClose,
    oneMClose,
    addMClose,
    updateMClose,
    deleteMClose
}