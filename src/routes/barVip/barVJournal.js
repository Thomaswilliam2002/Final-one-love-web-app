const {BarVipJournal, BarVip, Caisse} = require('../../db/sequelize')

allBVJournal = (app) => {
    app.get('/allBVJournal', (req, res) => {
        BarVipJournal.findAll({
            include:[
                {
                    model: BarVip,
                    required: true,
                    where: {is_active: true}
                }
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
            .then(barVipJournals => {
                // const msg = "Liste recuperer avec succes"
                // res.json({msg, data: barVipJournals})
                res.status(200).render('allJournal', {Journals: barVipJournals, type: 'vip', msg: req.query.msg, indice: req.query.indice})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

oneBVJournal = (app) => {
    app.post('/oneBVJournal/:id', (req, res) => {
        BarVipJournal.findByPk(req.params.id)
            .then(barVipJournal => {
                const msg = "Journal recuperer avec succes"
                res.json({msg, data: barVipJournal})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

addBVJournal = (app) => {
    app.post('/addBVJournal', async(req, res) => {
        try{
            const {barClub, montant, date, commentaire, manquant} = req.body;
            const barVipJournal = await BarVipJournal.create({
                recette: montant,
                date: date,
                id_barVip: parseInt(barClub.split(' ')[0]),
                manquant: manquant,
                commentaire: commentaire
            })

            if(barVipJournal){
                return res.redirect('/formFondBarClub?msg=Fond ajouter avec succes&type=bc&tc=alert-success')
            }else{
                return res.res.redirect('/formFondBarClub?msg=Une erreur s\'est produite. Le fond n\'a pas pu etre ajouter. Veillez reessayer&type=bc&tc=alert-danger')
            }
        }catch(e){
            console.log(e)
            res.redirect('/notFound')
            return
        }
    })
}

updateBVJournal = (app) => {
    app.put('/updateBVJournal/:id', (req, res) => {
        BarVipJournal.update(req.body, {
            where: {id: req.params.id}
        })
            .then(_ => {
                const msg = "Modification du journal avec succes"
                res.json({msg})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

deleteBVJournal = (app) => {
    app.delete('/deleteBVJournal/:id', async (req, res) => {
        try{
            // update retourne un tableau.
            const [logicDel] = await BarVipJournal.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            )
            
            if (logicDel > 0) {
                return res.redirect('/allBVJournal?msg=Journal supprimé avec succès&tc=alert-danger')
            } else {
                return res.redirect('/allBVJournal?msg=Une erreur s\'est produite. Le journal n\'a pas pu etre supprimé. Veuillez réessayer&tc=alert-danger')
            }
        }
        catch(e){
            console.error(e);
            res.redirect('/notFound')
            return
        }
    })
}

module.exports = {
    allBVJournal,
    oneBVJournal,
    addBVJournal,
    updateBVJournal,
    deleteBVJournal
}