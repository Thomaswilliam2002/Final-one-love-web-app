const { where } = require('sequelize')
const {BarSimpleJournal, BarSimple} = require('../../db/sequelize')

allBSJournal = (app) => {
    app.get('/allBSJournal', (req, res) => {
        BarSimpleJournal.findAll({
            include:[
                {
                    model: BarSimple,
                    required: true,
                    where: {is_active: true}
                }
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
            .then(barSimpleJournals => {
                res.status(200).render('allJournal', {Journals: barSimpleJournals, type: 'simple', msg: req.query.msg, indice: req.query.indice, tc: req.query.tc})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

oneBSJournal = (app) => {
    app.get('/oneBSJournal/:id', (req, res) => {
        BarSimpleJournal.findByPk(req.params.id)
            .then(barSimpleJournal => {
                const msg = "Journal recuperer avec succes"
                res.json({msg, data: barSimpleJournal})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

addBSJournal = (app) => {
    app.post('/addBSJournal', async (req, res) => {
        try{
            const {barClub, montant, date, manquant, commentaire} = req.body;
            const barSimpleJournal = await BarSimpleJournal.create({
                recette: montant,
                date: date,
                id_barSimple: parseInt(barClub.split(' ')[0]),
                manquant: manquant,
                commentaire: commentaire
            })
            if(barSimpleJournal){
                return res.redirect('/formFondBarClub?msg=Fond ajouter avec succes&type=bc&tc=alert-success')
            }else{
                return res.res.redirect('/formFondBarClub?msg=Une erreur s\'est produite. Le fond n\'a pas pu etre ajouter. Veillez reessayer&type=bc&tc=alert-danger')
            }
        }
        catch(e){
            res.redirect('/notFound')
            return
        }
    })
}

updateBSJournal = (app) => {
    app.put('/updateBSJournal/:id', (req, res) => {
        BarSimpleJournal.update(req.body, {
            where: {id: req.params.id}
        })
            .then(_ => {
                const msg = "Modification du journal avec succes"
                res.json({msg})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

deleteBSJournal = (app) => {
    app.delete('/deleteBSJournal/:id', async (req, res) => {
        try{
            // update retourne un tableau.
            const [logicDel] = await BarSimpleJournal.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            )
            
            if (logicDel > 0) {
                return res.redirect('/allBSJournal?msg=Journal supprimé avec succès&tc=alert-danger')
            } else {
                return res.redirect('/allBSJournal?msg=Une erreur s\'est produite. Le journal n\'a pas pu etre supprimé. Veuillez réessayer&tc=alert-danger')
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
    allBSJournal,
    oneBSJournal,
    addBSJournal,
    updateBSJournal,
    deleteBSJournal
}