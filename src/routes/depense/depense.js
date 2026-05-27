const {CategorieDepense, Depense} = require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const {fn, col, where} = require('sequelize');
const formAddDepense = (app) => {
    app.get('/formAddDepense', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const categories = await CategorieDepense.findAll()
            if(categories){
                res.redirect('/index');
            }else{
                console.error(_);
                res.redirect('/index');
                return; // On stoppe tout ici !
            }
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

const depenceTest = (app) => {
    app.get('/depenceTest', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try{
            res.json({"ok": "ok"});
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

const allDepense = (app) => {
    app.get('/allDepense', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const depenses = await Depense.findAll({
                include:[
                    {model:CategorieDepense, where:{is_active: true}, required: true}
                ],
                where:{is_active: true},
                order:[['id_depense', 'DESC']]
            })
            const categories = await CategorieDepense.findAll({where:{is_active: true}});
            //Utilise literal pour garantir que PostgreSQL comprenne l'expression de groupe
            const sum_depenses = await Depense.findAll({
                attributes: [
                    [fn('TO_CHAR', col('date'), 'YYYY-MM'), 'mois'],
                    [fn('SUM', col('montant')), 'total_montant']
                ],
                group: [fn('TO_CHAR', col('date'), 'YYYY-MM')], 
                raw: true
            });

            if(depenses && categories){
                res.status(200).render('depense', {depenses: depenses, msg: req.query.msg, categories: categories, text_color: req.query.tc, sum_depenses: sum_depenses});
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

const addDepense = (app) => {
    app.post('/addDepense', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const {nom, montant, desc, date, categ} = req.body;
            const depense = await Depense.create({
                nom: nom,
                montant: montant,
                date: date,
                description: desc,
                id_categ: categ
            })
            let msg = ""
            if(depense){
                msg = "Dépense ajouter avec succès"
            }else{
                msg = "Une erreur s'est produite. La dépense n'a pas pu être ajouter. Veillez réessayer !"
            }
            res.redirect(`/allDepense?msg=${msg}&tc=text-success`);
            return
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

const updateDepense = (app) => {
    app.put('/updateDepense/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{
            const {nom, montant, desc, date, categ} = req.body;

            const depense = await Depense.update({
                nom: nom,
                montant: montant,
                date: date,
                description: desc,
                id_categ: categ
            },{
                where:{id_depense: req.params.id}
            })
            let msg = ""
            if(depense){
                msg = "Dépense mise a jour avec succès"
            }else{
                msg = "Une erreur s'est produite. La dépense n'a pas pu être mise a jour. Veillez réessayer !"
            }
            res.redirect(`/allDepense?msg=${msg}&tc=text-warning`);
            return
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

const deleteDepense = (app) => {
    app.delete('/deleteDepense/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try{

            const [depense] = await Depense.update({
                is_active: false
            },{
                where:{id_depense: req.params.id}
            })
            let msg = ""
            if(depense > 0){
                msg = "Dépense supprimer avec succès"
            }else{
                msg = "Une erreur s'est produite. La dépense n'a pas pu être supprimer. Veillez réessayer !"
            }
            res.redirect(`/allDepense?msg=${msg}&tc=text-danger`);
            return
        }catch(_){
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

module.exports = {
    formAddDepense,
    allDepense,
    updateDepense,
    deleteDepense,
    addDepense,
    depenceTest
}