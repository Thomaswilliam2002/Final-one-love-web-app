const {Cuisine, CaisseJournal, sequelize} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

allCuisine = (app) => {
    app.get('/allCuisine', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        Cuisine.findAll({
            where: { is_active: true },
            order:[['id_cuisine', 'DESC']]
        })
            .then(cuisines => {
                const msg = "Liste recuperer avec succes"
                // res.json({msg, data: cuisines})
                res.status(200).render('all-cuisine',{cuisines: cuisines, msg: req.query.msg, tc:req.query.tc})
            })
            .catch(err => {
                console.error(err);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

formAddCuisine = (app) =>{
    app.get('/formAddCuisine', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        res.status(200).render('add-cuisine')
    })
}

formEditCuisine = (app) =>{
    app.get('/formEditCuisine/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        Cuisine.findByPk(req.params.id)
            .then(cuisine => {
                res.status(200).render('edit-cuisine', {cuisine: cuisine})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

oneCuisine = (app) => {
    app.get('/oneCuisine/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        Cuisine.findByPk(req.params.id)
            .then(cuisine => {
                const msg = "cuisine recuperer avec succes"
                res.json({msg, data: cuisine})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addCuisine = (app) => {
    app.post('/addCuisine', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, nom_lo, prenom, numero, adresse, email, desc} = req.body
        Cuisine.create({
            nom_cuisine: nom,
            nom_locataire: nom_lo,
            prenom_locataire: prenom,
            adresse_locataire:adresse,
            email_locataire: email,
            numero_locataire: numero,
            description: desc
        })
            .then(cuisine => {
                const msg = "la cuisine " + nom + "a ete ajouter avec succes"
                res.redirect('/allCuisine?msg='+msg)
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

updateCuisine = (app) => {
    app.put('/updateCuisine/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, nom_lo, prenom, numero, email, adresse, desc} = req.body;
        Cuisine.update({
            nom_cuisine: nom,
            nom_locataire: nom_lo,
            prenom_locataire: prenom,
            adresse_locataire:adresse,
            email_locataire: email,
            numero_locataire: numero,
            description: desc
        }, {
            where: {id_cuisine: req.params.id}
        })
            .then(_ => {
                res.redirect('/allCuisine?msg=Modification de la Cuisine avec succes&tc=alert-success')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteCuisine = (app) => {
    app.delete('/deleteCuisine/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try{
            const t = sequelize.transaction();
            await Cuisine.update({is_active: false}, {where: {id_cuisine: req.params.id}, transaction: t});
            await CaisseJournal.update({is_active: false}, {where: {id_cuisine: req.params.id, is_active: true}, transaction: t});

            await t.commit();
            res.redirect('/allCuisine?msg=Suppression de la Cuisine avec succes&tc=alert-success');
        }
        catch(_){
            console.error(_);
            await t.rollback();
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

module.exports = {
    allCuisine,
    oneCuisine,
    addCuisine,
    updateCuisine,
    deleteCuisine,
    formAddCuisine,
    formEditCuisine
}