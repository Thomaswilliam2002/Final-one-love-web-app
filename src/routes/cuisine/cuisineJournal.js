const { Model } = require('sequelize')
const {CuisineJournal, Cuisine} = require('../../db/sequelize')

allCuJournal = (app) => {
    app.get('/allCuJournal', (req, res) => {
        Cuisine.findAll({
            include:[
                {model: CuisineJournal, where: {is_active: true}, required: true}
            ],
            where: {is_active: true},
            order:[['id_cuisine', 'DESC']]
        })
            .then(jcuisines => {
                res.status(200).render('cuisineJournal', {jcuisines: jcuisines, msg: req.query.msg, indice: req.query.indice, tc:req.query.tc})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

oneCuJournal = (app) => {
    app.get('/oneCuJournal/:id', (req, res) => {
        CuisineJournal.findByPk(req.params.id)
            .then(cuisine => {
                const msg = "chambre Journal recuperer avec succes"
                res.json({msg, data: cuisine})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addCuJournal = (app) => {
    app.post('/addCuJournal', (req, res) => {
        const {cuisine, montant, date, comentaire, manquant} = req.body
        CuisineJournal.create({
            montant_verser: montant,
            date: date,
            comentaire: comentaire,
            id_cuisine: cuisine,
            manquant: manquant
        })
            .then(journal => {
                msg = 'Journal ajouter avec succes'
                res.redirect(`/formFondBarClub?type=cuisine&msg=${msg}&tc=alert-success`)
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

updateCuJournal = (app) => {
    app.put('/updateCuJournal/:id', (req, res) => {
        CuisineJournal.update(req.body, {
            where: {id: req.params.id}
        })
            .then(_ => {
                const msg = "Modification de cuisine Journal avec succes"
                res.json({msg})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteCuJournal = (app) => {
    app.delete('/deleteCuJournal/:id', async (req, res) => {
       try{
           await CuisineJournal.update({is_active: false}, {where: {id_journal: req.params.id}});
           res.redirect('/allCuJournal?msg=Journal supprime avec succes&tc=alert-success&indice' + req.query.indice)
       }
       catch(_){
           console.error(_);
           res.redirect('/notFound');
           return; // On stoppe tout ici !
       }
    })
}

module.exports = {
    allCuJournal,
    oneCuJournal,
    addCuJournal,
    updateCuJournal,
    deleteCuJournal
}