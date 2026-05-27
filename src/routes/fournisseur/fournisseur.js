const {Fournisseur, sequelize} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const {Op} = require('sequelize');

allFournisseur = (app) => {
    app.get('/allFournisseur', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'gerant', 'caissier central'), (req, res) => {
        Fournisseur.findAll({
            where: {is_active: true},
            order:[['id_fournisseur', 'DESC']]
        })
            .then(fournisseurs => {
                const msg = "Liste recuperer avec succes"
                res.status(200).render('fournisseur', {fournisseurs: fournisseurs, msg: req.query.msg, tc: req.query.tc});
            })
            .catch(_ => {
                console.log('erreure de selection all')
                res.redirect('/notFound');
            })
    })
}

addFournisseur = (app) => {
    app.post('/addFournisseur', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        const {nom, pseudo, numero1, numero2, email, adresse, cmt} = req.body;

        const exist = await Fournisseur.findOne({
            where: {
                is_active: true,
                [Op.or]:[
                    {nom: nom},
                    {pseudo: pseudo}
                ]
            }
        })

        if (exist) {
            return res.redirect('/allFournisseur?msg=Un Fournisseur portant ce nom ou ce pseudo existe déjà.Pour eviter toute confusion, veuillez choisir un autre nom ou pseudo&tc=alert-warning');
        }

        Fournisseur.create({
            nom: nom,
            pseudo: pseudo,
            numero1: numero1,
            numero2: numero2,
            email: email,
            adresse: adresse,
            commantaire: cmt,
        })
            .then(fournisseur => {
                res.redirect(`/allFournisseur?msg=Fournisseur ${req.body.nom} a ete ajouter avec succes`);
            })
            .catch(_ => {
                console.log('erreure de ajout au niveau du fournisseur', _)
                res.redirect('/notFound');
            })
    })
}

updateFournisseur = (app) => {
    app.put('/updateFournisseur/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, pseudo, numero1, numero2, email, adresse, cmt} = req.body;
        Fournisseur.update({
            nom: nom,
            pseudo: pseudo,
            numero1: numero1,
            numero2: numero2,
            email: email,
            adresse: adresse,
            commantaire: cmt,
        }, 
        {
            where: {id_fournisseur: req.params.id}
        })
            .then(_ => {
                res.redirect('/allFournisseur?msg=Les information du fournisseur on été modifier avec succès&tc=alert-warning');
            })
            .catch(_ => {
                console.log('erreure de modification du fournisseur' , _);
                 res.redirect('/notFound');})
    })
}

deleteFournisseur = (app) => {
    app.delete('/deleteFournisseur/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {

        try{
            const [sup] = await Fournisseur.update(
                { is_active: false },
                { where: { id_fournisseur: req.params.id} }
            )
        
            if (sup > 0) {
                return res.redirect('/allFournisseur?msg=Fournisseur supprimé avec succès&tc=alert-danger')
            } else {
                return res.redirect('/allFournisseur?msg=Fournisseur introuvable&tc=alert-warning')
            }
        
        }
        catch(e){
            console.error(e);
            res.redirect('/notFound');
            return;
        }
    })
}

module.exports = {
    allFournisseur,
    addFournisseur,
    updateFournisseur,
    deleteFournisseur,
}