const { where } = require('sequelize');
const { Consomation, Personnel, Occupe, Poste, BarSimple, BarVip, CrazyClub, Appartement,  MaisonColse, Cuisine} = require('../../db/sequelize'); 
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const express = require('express');
const router = express.Router();
// CREATE - Enregistrer une nouvelle consommation
addConsommation = (app) => {
    app.post('/addConsommation', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try {
            const consommation = await Consomation.create(req.body);
            res.redirect(`/allConsommation?msg=La Consommation a ete ajouter avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// READ ALL - Liste de toutes les consommations actives
allConsommation = (app) => {
    app.get('/allConsommation', async (req, res) => {
        try {
            const allPersonnels = await Occupe.findAll({
                include: [
                    {model: Personnel, where: {is_active: true}, required: false},
                    {model: Poste, where: {is_active: true}, required: false}
                ],
                where: {is_active: true},
                order:[['id_occupe', 'DESC']]
            })

            const [allBs, allBv, allCc, allAp, allMc, allCuis] = await Promise.all([
                BarSimple.findAll({where: {is_active: true},attributes:['nom']}),
                BarVip.findAll({where: {is_active: true},attributes:['nom']}),
                CrazyClub.findAll({where: {is_active: true},attributes:['nom']}),
                Appartement.findAll({where: {is_active: true},attributes:['nom_appart']}),
                MaisonColse.findAll({where: {is_active: true},attributes:['nom']}),
                Cuisine.findAll({where: {is_active: true},attributes:['nom_cuisine']}),
            ])

            const consommations = await Consomation.findAll({
                where: { is_active: true },
                include: [
                    {
                        model: Personnel,
                        as: 'detailsConsommateur', // L'alias défini dans vos associations
                        attributes: ['id_personnel', 'nom', 'prenom'] // Sélectionnez les champs voulus
                    },
                    {
                        model: Personnel,
                        as: 'detailsMarqueur', // L'alias pour celui qui a enregistré
                        attributes: ['id_personnel', 'nom', 'prenom']
                    }
                ]
            });
            res.render('consommation', { 
                consommations, 
                msg: req.query.msg, 
                tc: req.query.tc, 
                personnels: allPersonnels,
                allBs,
                allCc,
                allAp,
                allBv,
                allMc,
                allCuis
             });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// READ ONE - Détails d'une consommation par ID ou Slug
router.get('/:id', async (req, res) => {
    try {
        const consommation = await Consomation.findOne({
            where: { 
                id_conso: req.params.id, 
                is_active: true 
            }
        });
        if (!consommation) return res.status(404).json({ message: "Consommation non trouvée" });
        res.json(consommation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE - Modifier une consommation
updateConsommation = (app) => {
    app.put('/updateConsommation/:id', async (req, res) => {
        try {
            const consommation = await Consomation.findOne({
                where: { 
                    id_conso: req.params.id, 
                    is_active: true 
                }
            });
            if (!consommation) return res.redirect(`/allConsommation?msg=Consommation non trouvée&tc=alart-danger`);
            const upd = consommation.update(req.body)
            if(upd){
                return res.redirect(`/allConsommation?msg=La Consommation a ete mise à jour avec succès&tc=alart-success`);
            }else{
                return res.redirect(`/allConsommation?msg=La Consommation n'a pas pu etre mise à jour&tc=alart-success`);
            }
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// DELETE (LOGIQUE) - Désactiver une consommation
deleteConsommation = (app) => {
    app.delete('/deleteConsommation/:id', async (req, res) => {
        try {
            const result = await Consomation.update(
                { is_active: false },
                { where: { id_conso: req.params.id } }
            );
            
            if (result[0] > 0) {
                res.redirect(`/allConsommation?msg=La Consommation a ete desactiver avec successe&tc=alert-success`);
            } else {
                res.redirect(`/allConsommation?msg=La Consommation n'a pas pu etre desactiver&tc=alert-danger`);
            }
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

module.exports = {
    addConsommation,
    allConsommation,
    deleteConsommation,
    updateConsommation
}