const {AppartJournal,AppartFondJournal, Appartement, sequelize} = require('../../db/sequelize')

allJournal = (app) => {
    app.get('/allJournal', (req, res) => {
        AppartJournal.findAll({
            include:[
                {
                    model: Appartement,
                    required: true,
                    where: {is_active: true}
                }
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
            .then(journals => {
                res.status(200).render('appartJournal', {journals: journals, msg: req.query.msg, indice: req.query.indice, tc: req.query.tc})
            })
            .catch(_ => {
                console.log('erreure de selection all', _)
                res.redirect('/notFound');
            })
    })
}

appartFondJournal = (app) => {
    app.get('/appartFondJournal', async (req, res) =>{
        const hfond = await AppartFondJournal.findAll({
            include:[
                {
                    model: Appartement,
                    required: true,
                    where: {is_active: true}
                }
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
        if(hfond){
            res.status(200).render('appartJournal', {hfonds: hfond, msg: req.query.msg, indice: req.query.indice, tc: req.query.tc})
            return
        }else{
            console.log('erreure de selection all', _)
            res.redirect('/notFound');
            return
        }
    })
    
} 

oneJournal = (app) => {
    app.get('/oneJournal/:id', (req, res) => {
        AppartJournal.findByPk(req.params.id)
            .then(journal => {
                const msg = "Journal recuperer avec succes"
                res.json({msg, data: journal})
            })
            .catch(_ => {
                console.log('erreure de selection');
                res.redirect('/notFound');
            })
    })
}

addJournal = (app) => {
    app.post('/addJournal', (req, res) => {
        const {appart, montant, depense, date} = req.body
        AppartFondJournal.create({
            id_appart: appart,
            recette:montant,
            depense: depense,
            date:date
        })
            .then(journal => {
                res.redirect('/formFondBarClub?msg=Appartement ajouter avec succès&type=appart&tc=alert-success')
            })
            .catch(_ => {
                //console.log('erreure de ajout', _)
                res.redirect('/notFound');
                return
            })
    })
}

updateJournal = (app) => {
    app.put('/updateJournal/:id', (req, res) => {
        AppartJournal.update(req.body, {
            where: {id: req.params.id}
        })
            .then(_ => {
                const msg = "Modification du journal avec succes"
                res.json({msg})
            })
            .catch(_ => {
                console.log('erreure de modification')
                res.redirect('/notFound');
            })
    })
}

deleteFondJournal = (app) => {
    app.delete('/deleteFondJournal/:id', async (req, res) => {
        try{
            // update retourne un tableau.
            const [logicDel] = await AppartFondJournal.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            )
            
            if (logicDel > 0) {
                res.redirect('/appartFondJournal?msg=Journal supprimer avec succès&tc=alert-danger')
            } else {
                res.redirect('/appartFondJournal?msg=Une erreur s\'est produite. Le journal n\'a pas pu etre supprimé. Veuillez réessayer&tc=alert-danger')
            }
        }
        catch(e){
            console.error(e);
            res.redirect('/notFound')
            return
        }
    })
}

deleteJournal = (app) => {
    app.delete('/deleteJournal/:id', async (req, res) => {
        try{
            // update retourne un tableau.
            const [logicDel] = await AppartJournal.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            )
            
            if (logicDel > 0) {
                res.redirect('/appartJournal?msg=Journal supprimer avec succès&tc=alert-danger')
            } else {
                res.redirect('/appartJournal?msg=Une erreur s\'est produite. Le journal n\'a pas pu etre supprimé. Veuillez réessayer&tc=alert-danger')
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
    allJournal,
    oneJournal,
    addJournal,
    updateJournal,
    deleteJournal,
    appartFondJournal,
    deleteFondJournal
}