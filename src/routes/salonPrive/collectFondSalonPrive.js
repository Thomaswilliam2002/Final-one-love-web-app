const { where } = require('sequelize')
const {CollectFondSalonPrive, SalonPrive} = require('../../db/sequelize')

allSPJournal = (app) => {
    app.get('/allSPJournal', (req, res) => {
        CollectFondSalonPrive.findAll({
            include:[
                {
                    model: SalonPrive,
                    required: true,
                    where: {is_active: true}
                }
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
            .then(salonJournals => {
                res.status(200).render('allJournal', {Journals: salonJournals, type: 'sp', msg: req.query.msg, indice: req.query.indice, tc: req.query.tc})
            })
            .catch(_ => res.redirect('/notFound'))
    })
}

addSPJournal = (app) => {
    app.post('/addSPJournal', async (req, res) => {
        try{
            const {salonp, montant, date, manquant, commentaire} = req.body;
            const salonJournal = await CollectFondSalonPrive.create({
                recette: montant,
                date: date,
                id_salon: salonp,
                manquant: manquant,
                commentaire: commentaire
            })
            if(salonJournal){
                return res.redirect('/formFondBarClub?msg=Fond ajouter avec succes&type=bc&tc=alert-success')
            }else{
                return res.res.redirect('/formFondBarClub?msg=Une erreur s\'est produite. Le fond n\'a pas pu etre ajouter. Veillez reessayer&type=sp&tc=alert-danger')
            }
        }
        catch(e){
            console.error(e);
            res.redirect('/notFound')
            return
        }
    })
}

deleteSPJournal = (app) => {
    app.delete('/deleteSPJournal/:id', async (req, res) => {
        try{
            // update retourne un tableau.
            const [logicDel] = await CollectFondSalonPrive.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            )
            
            if (logicDel > 0) {
                return res.redirect('/allSPJournal?msg=Journal supprimé avec succès&tc=alert-danger')
            } else {
                return res.redirect('/allSPJournal?msg=Une erreur s\'est produite. Le journal n\'a pas pu etre supprimé. Veuillez réessayer&tc=alert-danger')
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
    allSPJournal,
    addSPJournal,
    deleteSPJournal
}