const { where } = require('sequelize')
const {Sanction, Occupe, Personnel} = require('../../db/sequelize')
const occupe = require('../../models/occupe')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

allSanction = (app) => {
    app.get('/allSanction/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        Sanction.findAll({
            order:[['id_sanction', 'DESC']]
        })
            .then(sanctions => {
                const msg = "Liste recuperer avec succes"
                res.json({msg, data: sanctions})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

formAddSamction = (app) =>{
    app.get('/formAddSamction/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) =>{
        try{
            res.status(200).render('add-sanction', {id: req.params.id})
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    })
}

oneSanction = (app) => {
    app.get('/oneSanction/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        Sanction.findByPk(req.params.id)
            .then(sanction => {
                const msg = "sanction recuperer avec succes"
                res.json({msg, data: sanction})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addSanction = (app) => {
    app.post('/addSanction/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {motif, desc, montant, date} = req.body;
        Personnel.findOne({
            where: {id_personnel: req.params.id}
        })
            .then(personnel => {
                Occupe.findOne({
                    where:{id_personnel: personnel.id_personnel}
                })
                    .then(occupe => {
                        Sanction.create({
                            motif: motif,
                            description: desc,
                            montan_defalquer: montant,
                            date: date,
                            id_occupe: occupe.id_occupe
                        })
                            .then(sanction => {
                                res.redirect('/allPersonnel?allType=pas_admin');
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
        

        
    })
}

updateSanction = (app) => {
    app.put('/updateSanction/:id/:id_p', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {motif, desc, montant} = req.body;
        Sanction.update({
            motif: motif,
            description: desc,
            montan_defalquer: montant
        }, {
            where: {id_sanction: req.params.id}
        })
            .then(_ => {
                res.redirect(`/onePersonnel/${req.params.id_p}?&msg=Modification de la sanction avec succes&tc=alert-success`);
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteSanction = (app) => {
    app.delete('/deleteSanction/:id/:id_p', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        Sanction.update({is_active: false},{where: {id_sanction: req.params.id}})
            .then(_ => {
                res.redirect(`/onePersonnel/${req.params.id_p}?&msg=Suppression de la sanction avec succes&tc=alert-success`);
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

module.exports = {
    allSanction,
    oneSanction,
    addSanction,
    updateSanction,
    deleteSanction,
    formAddSamction
}