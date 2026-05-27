const {Creancier, JournalEmprunt, JournalCreancier, sequelize} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

addNewEmprunt = (app) =>  {
    app.post('/addNewEmprunt', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            // Vérification si le créancier existe et est actif
            const creancier = await Creancier.findByPk(req.body.id_creancier);
            if (!creancier || !creancier.is_active) {
                return res.redirect(`allCreancier?msg="Créancier inexistant ou inactif&tc=alert-danger`);
            }

            const emprunt = await JournalEmprunt.create(req.body);
            if (!emprunt) return redirect('/allCreancier?msg=Impossible d\'ajouter un nouvel emprunt&tc=alert-danger');
            res.redirect(`/allCreancier?msg=Emprunt ajouter avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    })
}

addNewRembourcement = (app) => {
    app.post('/addNewRembourcement', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            // Vérification si le créancier existe et est actif
            const creancier = await Creancier.findByPk(req.body.id_creancier);
            if (!creancier || !creancier.is_active) {
                return res.redirect(`allCreancier?msg="Créancier inexistant ou inactif&tc=alert-danger`);
            }

            const rembourcement = await JournalCreancier.create(req.body);
            if (!rembourcement) return redirect('/allCreancier?msg=Impossible d\'ajouter un nouveau rembourcement&tc=alert-danger');
            res.redirect(`/allCreancier?msg=Rembourcement ajouter avec successe&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }0
    })
}

deleteEmpruntJournal = (app) => {
    app.delete('/deleteEmpruntJournal/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const result = await JournalEmprunt.update(
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

module.exports = {addNewEmprunt, addNewRembourcement, deleteEmpruntJournal}
