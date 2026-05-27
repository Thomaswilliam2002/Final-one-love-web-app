const { SalonPrive, JournalSalonPrive, sequelize } = require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const express = require('express');
const router = express.Router();

// CREATE - Ajouter une entrée au journal
addSalonJournal = (app) => {
    app.post('/addSalonJournal', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try {
            // Optionnel: Vérifier si le salon est actif avant d'ajouter un journal
            const salon = await SalonPrive.findByPk(req.body.id_salon);
            if (!salon || !salon.is_active) {
                return res.redirect(`/allSalon?msg=Salon inexistant ou inactif&tc=alert-danger`);
            }

            const journal = await JournalSalonPrive.create(req.body);
            return res.redirect(`/allSalon?msg=Journal créer avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// READ ALL - Tous les journaux actifs

router.get('/', async (req, res) => {
    try {
        const journaux = await JournalSalonPrive.findAll({
            where: { is_active: true },
            include: [SalonPrive]
        });
        res.json(journaux);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE - Modifier une entrée
router.put('/:id', async (req, res) => {
    try {
        const [updated] = await JournalSalonPrive.update(req.body, {
            where: { id_journal: req.params.id }
        });
        if (!updated) return res.status(404).json({ message: "Entrée non trouvée" });
        res.json({ message: "Journal mis à jour" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE (LOGIQUE) - Désactiver une entrée spécifique
deleteSalonJournal = (app) => {
    app.delete('/deleteSalonJournal/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try {
            const result = await JournalSalonPrive.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            );
            if (result[0] > 0) {
                return res.redirect(`/allSalon?msg=Journal desactiver avec successe&tc=alert-success`);
            } else {
                return res.redirect(`/allSalon?msg=Journal n'a pas pu etre desactiver&tc=alert-danger`);
            }
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

module.exports = {
    addSalonJournal,
    deleteSalonJournal
}