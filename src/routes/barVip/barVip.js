const {BarVip, sequelize, BarVipJournal} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

allBarV = (app) => {
    app.get('/allBarV', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        BarVip.findAll({
            order:[['id_barVip', 'DESC']]
        })
            .then(barVs => {
                const msg = "Liste recuperer avec succes"
                res.json({msg, data: barVs})

            })
            .catch(_ => res.redirect('/notFound'))
    })
}

oneBarV = (app) => {
    app.get('/oneBarV/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        BarVip.findByPk(req.params.id)
            .then(barV => {
                const msg = "Bar recuperer avec succes"
                res.json({msg, data: barV})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

addBarV = (app) => {
    app.post('/addBarV', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        const {nom, adresse} = req.body;
        const exist = await BarVip.findOne({
            where: {
                nom: nom,
                is_active: true
            }
        })
        if (exist) {
            return res.redirect('/Add?msg=Un bar portant ce nom existe deja.Pour eviter toute confusion, veuillez choisir un autre nom&tc=alert-warning');
        }
        
        BarVip.create({
            nom: nom,
            adresse: adresse,
        })
            .then(barS => {
                const msg = "le Bar  VIP" + req.body.name + "a ete ajouter avec succes"
                //res.json({msg, data: barS})
                res.redirect('/allBarClub?type=barv&msg=Bar VIP ajouter avec succes&tc=alert-success')
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

updateBarV = (app) => {
    app.put('/updateBarV/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, adresse} = req.body;
        BarVip.update({
            nom: nom,
            adresse: adresse
        }, {
            where: {id_barVip: req.params.id}
        })
            .then(_ => {
                // const msg = "Modification du bar avec succes"
                // res.json({msg})
                res.redirect('/allBarClub?type=barv&msg=modif')
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

deleteBarV = (app) => {
    app.delete('/deleteBarV/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try{
            const t = await sequelize.transaction();
        
            // update retourne un tableau
            const [logicDel] = await BarVip.update(
                { is_active: false },
                { where: { id_barVip: req.params.id}, transaction: t }
            )
        
            // desactiver toute l'historique du bar
            await BarVipJournal.update(
                { is_active: false },
                { where: { id_barVip: req.params.id, is_active: true  }, transaction: t }
            )
        
            await t.commit();
        
            if (logicDel > 0) {
                return res.redirect('/allBarClub?type=bars&msg=Bar supprimé avec succès&tc=alert-danger')
            } else {
                return res.redirect('/allBarClub?type=bars&msg=Bar introuvable&tc=alert-warning')
            }
        
        }
        catch(e){
            console.error(e);
            await t.rollback();
            res.redirect('/notFound');
            return;
        }

    })
}

module.exports = {
    allBarV,
    oneBarV,
    addBarV,
    updateBarV,
    deleteBarV
}