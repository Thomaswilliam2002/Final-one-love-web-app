const {CrazyClubJournal, CrazyClub, Caisse, CC} = require('../../db/sequelize')

allCCJournal = (app) => {
    app.get('/allCCJournal', (req, res) => {
        CrazyClubJournal.findAll({
            include:[
                {model: CrazyClub, required: true, where: {is_active: true}}
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
            .then(ccJournals => {
                res.status(200).render('allJournal', {Journals: ccJournals, type: 'cc', msg: req.query.msg, indice: req.query.indice})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

oneCCJournal = (app) => {
    app.post('/oneCCJournal/:id', (req, res) => {
        CrazyClubJournal.findByPk(req.params.id)
            .then(ccJournal => {
                const msg = "Journal recuperer avec succes"
                res.json({msg, data: ccJournal})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addCCJournal = (app) => {
    app.post('/addCCJournal', async(req, res) => {
        try{
            const {montant, manquant, date, commentaire, barClub} = req.body
            const ccJournal = CrazyClubJournal.create({
                recette: montant,
                date: date,
                id_cclub: parseInt(barClub.split(' ')[0]),
                manquant: manquant,
                commentaire: commentaire
            })
            res.redirect('/formFondBarClub?msg=Journal ajouter avec succes&type=bc&tc=alert-success' )
        }catch(e){
            console.error(e);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

updateCCJournal = (app) => {
    app.put('/updateBVJournal/:id', (req, res) => {
        CrazyClub.update(req.body, {
            where: {id: req.params.id}
        })
            .then(_ => {
                const msg = "Modification du journal avec succes"
                res.json({msg})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteCCJournal = (app) => {
    app.delete('/deleteCCJournal/:id', async (req, res) => {
        try{
            // update retourne un tableau.
            const [logicDel] = await CrazyClubJournal.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            )
            
            if (logicDel > 0) {
                return res.redirect('/allCCJournal?msg=Journal supprimé avec succès&tc=alert-danger')
            } else {
                return res.redirect('/allCCJournal?msg=Une erreur s\'est produite. Le journal n\'a pas pu etre supprimé. Veuillez réessayer&tc=alert-danger')
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
    allCCJournal,
    oneCCJournal,
    addCCJournal,
    updateCCJournal,
    deleteCCJournal
}