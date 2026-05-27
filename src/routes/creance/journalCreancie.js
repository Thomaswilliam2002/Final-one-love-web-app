const express = require('express');
const router = express.Router();
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const { JournalCreancier, Creancier, JournalEmprunt } = require('../../db/sequelize');

// CREATE - Ajouter une ligne de créance au journal
addCreanceJournal = (app) => {
    app.post('/addCreanceJournal', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            // Vérification si le créancier existe et est actif
            const creancier = await Creancier.findByPk(req.body.id_creancier);
            if (!creancier || !creancier.is_active) {
                return res.redirect(`allCreancier?msg=Créancier inexistant ou inactif&tc=alert-danger`);
            }

            const journal = await JournalCreancier.create(req.body);
            return res.redirect(`allCreancier?msg=Journal de remboursement de créance créer avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
};

// READ ALL - Liste globale des journaux actifs
allCreanceJournal = (app) => {
    app.get('/allCreanceJournal', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const jcs = await JournalCreancier.findAll({
                include:[
                    {
                        model: Creancier,
                        required: true,
                        where: {is_active: true}
                    }
                ],
                where: {is_active: true},
                order:[['id_journal', 'DESC']]
            })
    
            const jes = await JournalEmprunt.findAll({
                include:[
                    {
                        model: Creancier,
                        required: true,
                        where: {is_active: true}
                    }
                ],
                where: {is_active: true},
                order:[['id_journal', 'DESC']]
            })
    
            res.status(200).render('historiqueTransaction', {jcs, jes, msg: req.query.msg, tc: req.query.tc})
               
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    })
}

// UPDATE - Modifier une transaction
router.put('/:id', async (req, res) => {
    try {
        const [updated] = await JournalCreancier.update(req.body, {
            where: { id_journal: req.params.id }
        });
        if (!updated) return res.status(404).json({ message: "Ligne de journal non trouvée" });
        res.json({ message: "Transaction mise à jour" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE (LOGIQUE) - Désactiver une seule ligne de journal
deleteCreanceJournal = (app) => {
    app.delete('/deleteCreanceJournal/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const result = await JournalCreancier.update(
                { is_active: false },
                { where: { id_journal: req.params.id } }
            );
            if (result[0] > 0) {
                res.redirect(`/allCreanceJournal?msg=Le Journal de créance a ete supprimer avec successe&tc=alert-success`);
            } else {
                res.redirect(`/allCreanceJournal?msg=Le Journal de créance n'a pas pu etre supprimer&tc=alert-danger`);
            }
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
};

module.exports = {
    addCreanceJournal,
    deleteCreanceJournal,
    allCreanceJournal
}