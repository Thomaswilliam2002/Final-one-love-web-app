const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const { Creancier, JournalCreancier, sequelize, JournalEmprunt   } = require('../../db/sequelize');
const { or } = require('sequelize');

// CREATE - Ajouter un nouveau créancier
addCreancier = (app) => {
    app.post('/addCreancier', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const creancier = await Creancier.create(req.body);
            res.redirect(`/allCreancier?msg=Créancier ajouter avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            return res.redirect(`/allCreancier?msg=Le créancier n'a pas pu étre ajouter&tc=alert-danger`);
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// READ ALL - Liste des créanciers actifs
allCreancier = (app) => {
    app.get('/allCreancier', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const creanciers = await Creancier.findAll({
                where: { is_active: true },
                include: [
                    { 
                        model: JournalCreancier,
                        where: { is_active: true }, 
                        required: false,
                        // order: [['created', 'DESC']]
                    },
                    {
                        model: JournalEmprunt,
                        where: { is_active: true }, 
                        required: false,
                        // order: [['created', 'DESC']]
                    }
                ],
                order: [
                    ['id_creancier', 'ASC'],
                    [JournalCreancier, 'created', 'DESC'],
                    [JournalEmprunt, 'created', 'DESC']
                ]
            });
            const creanciersData = creanciers.map(c => {

                const json = c.toJSON();
            
                json.total_payer = json.JournalCreanciers.reduce(
                    (somme,j)=> somme + Number(j.montant || 0),
                    0
                );
            
                json.total_du = json.JournalEmprunts.reduce(
                    (somme,j)=> somme + Number(j.montant || 0),
                    0
                );

                const s = json.total_du == 0 ? 0 : json.total_du - json.total_payer;
            
                json.solde = s;
            
                return json;
            });

            res.render('creance', {msg: req.query.msg, tc: req.query.tc, creanciers: creanciersData});
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// READ ONE - Détails d'un créancier
oneCreancier = (app) => {
    app.get('/oneCreancier/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const creancier = await Creancier.findOne({
                where: { 
                    id_creancier: req.params.id, 
                    is_active: true 
                },
                include: [JournalCreancier]
            });
            if (!creancier) return res.status(404).json({ message: "Créancier non trouvé" });
            res.json(creancier);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// UPDATE - Modifier les infos d'un créancier
updateCreancier = (app) => {
    app.put('/updateCreancier/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const [updated] = await Creancier.update(req.body, {
                where: { id_creancier: req.params.id }
            });
            if (!updated) return res.redirect(`/allCreancier?msg=Créancier non trouvée&tc=alert-danger`);
            res.redirect(`/allCreancier?msg=Créancier mis à jour avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

entrerSomme = (app) => {
    app.post('/entrerSomme/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const [updated] = await Creancier.update(req.body, {
                where: { id_creancier: req.params.id }
            });
            if (!updated) return res.redirect(`/allCreancier?msg=Créancier non trouvée&tc=alert-danger`);
            res.redirect(`/allCreancier?msg=Créancier mis à jour avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// DELETE (LOGIQUE) - Désactiver un créancier et ses journaux (Cascade)
deleteCreancier = (app) => {
    app.delete('/deleteCreancier/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const id_creancier = req.params.id
            const t = await sequelize.transaction();

            // Désactivation du créancier
            const result = await Creancier.update(
                { is_active: false },
                { where: { id_creancier: id_creancier } },
                { transaction: t } 
            );

            if (result[0] > 0) {
                // Désactivation en cascade de ses journaux
                await JournalCreancier.update(
                    { is_active: false },
                    { where: { id_creancier: id_creancier } },
                    { transaction: t }
                );

                await t.commit();
                res.redirect(`/allCreancier?msg=Le Créancier et ses journaux associés ont été Suppimer avec successe&tc=alert-success`);
            } else {
                await t.rollback();
                res.redirect(`/allCreancier?msg=Le Créancier n'a pas pu étre Supprimer&tc=alert-danger`);
            }
        } catch (error) {
            if (t) await t.rollback();
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

module.exports = {
    addCreancier,
    allCreancier,
    oneCreancier,
    updateCreancier,
    deleteCreancier
}