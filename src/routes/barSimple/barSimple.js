const {BarSimple, sequelize, BarSimpleJournal} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

allBarS = (app) => {
    app.get('/allBarS', protrctionRoot, authorise('admin', 'caissier central', 'comptable'), (req, res) => {
        BarSimple.findAll({
            order:[['id_barSimple', 'DESC']]
        })
            .then(barSs => {
                const msg = "Liste recuperer avec succes"
                res.json({msg, data: barSs})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

oneBarS = (app) => {
    app.get('/oneBarS/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        BarSimple.findByPk(req.params.id)
            .then(barS => {
                const msg = "Bar recuperer avec succes"
                res.json({msg, data: barS})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

addBarS = (app) => {
    app.post('/addBarS', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        const {nom, adresse } = req.body;
        const exist = await BarSimple.findOne({
            where: {
                nom: nom,
                is_active: true
            }
        })
        if (exist) {
            return res.redirect('/Add?msg=Un bar portant ce nom existe deja.Pour eviter toute confusion, veuillez choisir un autre nom&tc=alert-warning');
        }
        BarSimple.create({
            nom: nom,
            adresse: adresse,
        })
            .then(barS => {
                const msg = "le Bar " + req.body.nom + "a ete ajouter avec succes"
                //res.json({msg, data: barS})
                res.redirect('/allBarClub?type=bars&msg=Bar Simple ajouter avec succes&tc=alert-success')
            })
            .catch(err => res.redirect('/notFound'))
    })
}

updateBarS = (app) => {
    app.put('/updateBarS/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, adresse} = req.body;
        BarSimple.update({
            nom: nom,
            adresse: adresse
        },{
            where:{id_barSimple: req.params.id}
        })
            .then(_ => {
                res.redirect('/allBarClub?type=bars&msg=modif')
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

deleteBarS = (app) => {
    app.delete('/deleteBarS/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try{
            const t = await sequelize.transaction();
        
            // update retourne un tableau
            const [logicDel] = await BarSimple.update(
                { is_active: false },
                { where: { id_barSimple: req.params.id}, transaction: t }
            )
        
            // desactiver toute l'historique du bar
            await BarSimpleJournal.update(
                { is_active: false },
                { where: { id_barSimple: req.params.id, is_active: true  }, transaction: t }
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
    allBarS,
    oneBarS,
    addBarS,
    updateBarS,
    deleteBarS
}