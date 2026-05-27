const express = require('express');
const router = express.Router();
const { JournalSalaire, Personnel, Poste } = require('../models');

// 1. CREATE - Enregistrer un paiement de salaire
router.post('/', async (req, res) => {
    try {
        const nouveauJournal = await JournalSalaire.create(req.body);
        res.status(201).json(nouveauJournal);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 2. READ ALL - Liste des salaires payés (avec détails personnel et poste)
router.get('/', async (req, res) => {
    try {
        const journaux = await JournalSalaire.findAll({
            where: { is_active: true },
            include: [
                {
                    model: Personnel,
                    as: 'employe',
                    attributes: ['nom', 'prenom', 'id_personnel']
                },
                {
                    model: Poste,
                    as: 'posteDetails',
                    attributes: ['nom_poste', 'salaire']
                }
            ],
            order: [['created', 'DESC']] // Plus récent en premier
        });
        res.json(journaux);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. READ ONE - Détails d'un enregistrement spécifique
router.get('/:id', async (req, res) => {
    try {
        const journal = await JournalSalaire.findOne({
            where: { 
                id_journal: req.params.id, 
                is_active: true 
            },
            include: [
                { model: Personnel, as: 'employe' },
                { model: Poste, as: 'posteDetails' }
            ]
        });
        if (!journal) return res.status(404).json({ message: "Enregistrement non trouvé" });
        res.json(journal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. UPDATE - Modifier un enregistrement de salaire
router.put('/:id', async (req, res) => {
    try {
        const [updated] = await JournalSalaire.update(req.body, {
            where: { id_journal: req.params.id }
        });
        if (!updated) return res.status(404).json({ message: "Journal non trouvé" });
        res.json({ message: "Journal des salaires mis à jour avec succès" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 5. DELETE - Suppression Logique
router.delete('/:id', async (req, res) => {
    try {
        const result = await JournalSalaire.update(
            { is_active: false },
            { where: { id_journal: req.params.id } }
        );
        
        if (result[0] > 0) {
            res.json({ message: "L'enregistrement a été désactivé (suppression logique)." });
        } else {
            res.status(404).json({ message: "Enregistrement non trouvé." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;