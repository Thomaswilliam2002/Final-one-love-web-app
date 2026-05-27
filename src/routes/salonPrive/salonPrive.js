const { Op } = require('sequelize');
const { SalonPrive, JournalSalonPrive, sequelize, Personnel, Occupe, Poste } = require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

// CREATE - Créer un salon
addSalon = (app) => {
    app.post('/addSalon', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const salon = await SalonPrive.create(req.body);
            msg = "Salon créer avec successe";
            res.redirect(`/allSalon?msg=${msg}&tc=alert-success`);
        } catch (error) {
            console.error(error);
            return res.redirect('/allSalon?msg=Le salon n\'a pas pu étre créer&tc=alert-danger');
           console.error(error);
           res.redirect('/notFound');
        }
    });
}

// READ ALL - Récupérer tous les salons actifs
allSalon = (app) => {
    app.get('/allSalon', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try {

            const [salons, salonsJournals, danseuses] = await Promise.all([
                SalonPrive.findAll({
                    where: { is_active: true },
                    // include: [{ model: JournalSalonPrive, where: { is_active: true }, required: false, order: [['id_journal', 'DESC']] }]
                }),

                JournalSalonPrive.findAll(
                    {
                        where: { is_active: true },
                        include: [
                            {
                                model: Personnel,
                                as: 'detailsDanseuse', // L'alias défini dans vos associations
                                attributes: ['id_personnel', 'nom', 'prenom'] // Sélectionnez les champs voulus
                            },
                            {
                                model: Personnel,
                                as: 'detailsMarqueur', // L'alias pour celui qui a enregistré
                                attributes: ['id_personnel', 'nom', 'prenom']
                            },
                            {
                                model:SalonPrive,
                                attributes: ['nom']
                            }
                        ]
                    }
                ),

                Occupe.findAll({
                    include: [
                        {model: Personnel, where: {is_active: true}, required: false},
                        {model: Poste, where: {is_active: true, nom_poste: {[Op.in]:['Danseuse Club', 'Danseuse', 'danseuse']}}, required: false}
                    ],
                    where: {is_active: true},
                    order:[['id_occupe', 'DESC']]
                }),

            ])

            res.render('salonPriver', {msg: req.query.msg, tc: req.query.tc, salons: salons, salonsJournals, danseuses});
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// READ ONE - Récupérer un salon par son ID ou Slug
oneSalon = (app) => {
    app.get('/oneSalon/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const salon = await SalonPrive.findOne({
                where: { 
                    id_salon: req.params.id, // ou slug_id: req.params.id
                    is_active: true 
                },
                include: [JournalSalonPrive]
            });
            if (!salon) return res.status(404).json({ message: "Salon non trouvé" });
            res.json(salon);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// UPDATE - Mettre à jour un salon
updateSalon = (app) => {
    app.put('/updateSalon/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const [updated] = await SalonPrive.update(req.body, {
                where: { id_salon: req.params.id }
            });
            if (!updated) return res.redirect(`/allSalon?msg=Salon non trouvé&tc=alert-danger`);
            res.redirect(`/allSalon?msg=Salon mis à jour avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// DELETE (LOGIQUE) - Désactiver un salon et ses journaux
deleteSalon = (app) => {
    app.delete('/deleteSalon/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const t = await sequelize.transaction();
            const id_salon = req.params.id;

            // 1. Désactiver le Salon
            const updatedSalon = await SalonPrive.update(
                { is_active: false },
                { where: { id_salon: id_salon } },
                { transaction: t }
            );

            if (updatedSalon[0] > 0) {
                // 2. Cascade : Désactiver tous les journaux liés à ce salon
                await JournalSalonPrive.update(
                    { is_active: false },
                    { where: { id_salon: id_salon } },
                    { transaction: t }
                );

                await t.commit();
                res.redirect(`/allSalon?msg=Le Salon et ses journaux associés ont été Suppimer avec successe&tc=alert-success`);
            } else {
                await t.rollback();
                res.redirect(`/allSalon?msg=Le Salon n'a pas pu étre Supprimer&tc=alert-danger`);
            }
        } catch (error) {
            if (t) await t.rollback();
            console.error("Erreur suppression salon:", error);
            res.status(500).redirect('/notFound');
        }
    });
}

module.exports = {
    addSalon,
    allSalon,
    oneSalon,
    updateSalon,
    deleteSalon}