const { where } = require('sequelize');
const {CategorieDepense, Depense, sequelize} = require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
formAddCategorieDepense = (app) => {
    app.get('/formAddCategorieDepense', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            res.redirect('/index');
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

allCategorieDepense = (app) => {
    app.get('/allCategorieDepense', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const categories = await CategorieDepense.findAll({where: {is_active: true},order:[['id_categ', 'DESC']]});
            if(categories){
                res.status(200).render('categorieDepense', {categories: categories, msg: req.query.msg , text_color: req.query.tc});
            }else{
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            }
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

addCategorieDepense = (app) => {
    app.post('/addCategorieDepense', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const {nom, desc} = req.body;

            const categorie = await CategorieDepense.create({
                nom: nom,
                description: desc
            })
            let msg = ""
            if(categorie){
                msg = "Categorie ajouter avec succès"
            }else{
                msg = "Une erreur s'est produite. La categorie n'a pas pu être ajouter. Veillez réessayer !"
            }
            res.redirect(`/allCategorieDepense?msg=${msg}&tc=alert-success`);
            return
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

updateCategorieDepense = (app) => {
    app.put('/updateCategorieDepense/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const {nom, desc} = req.body;

            const categorie = await CategorieDepense.update({
                nom: nom,
                description: desc
            },{
                where:{id_categ: req.params.id}
            })
            let msg = ""
            if(categorie){
                msg = "Categorie mise a jour avec succès"
            }else{
                msg = "Une erreur s'est produite. La Categorie n'a pas pu être mise a jour. Veillez réessayer !"
            }
            res.redirect(`/allCategorieDepense?msg=${msg}&tc=alert-warning`);
            return
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

deleteCategorieDepense = (app) =>{
    app.delete('/deleteCategorieDepense/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {

        const t = await sequelize.transaction();

        try{

            await Depense.update(
                {is_active: false},
                {where: {id_categ: req.params.id}, transaction: t}
            );

            const categorie = await CategorieDepense.update(
                {is_active: false},
                {where: {id_categ: req.params.id}, transaction: t}
            );

            await t.commit();

            let msg = "";

            if(categorie[0] > 0){
                msg = "Categorie supprimée avec succès";
            }else{
                msg = "La categorie n'existe pas ou est déjà supprimée.";
            }

            res.redirect(`/allCategorieDepense?msg=${msg}&tc=text-danger`);

        }catch(err){

            await t.rollback();
            console.error(err);
            res.redirect('/notFound');

        }

    });
}
module.exports = {
    formAddCategorieDepense,
    allCategorieDepense,
    updateCategorieDepense,
    deleteCategorieDepense,
    addCategorieDepense
}