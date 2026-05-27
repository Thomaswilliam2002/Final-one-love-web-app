const {Caisse,sequelize, Personnel, Produit, HistSortie, HistCaisse, HistEntrer} = require('../../db/sequelize')
const {fn, col, literal, Op, where} = require('sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

rapportJournalier = (app) => {
    app.get('/rapportJournalier', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const caisses = await Caisse.findAll({
                include: [{
                    model: Personnel,
                    required: false,
                    where: { is_active: true },
                    through: { attributes: ['id_personnel', 'id_caisse'], where: { is_active: true }  } 
                }],
                where: { is_active: true },
                order: [['id_caisse', 'DESC']]
            });

            res.status(200).render('rapportJournalier' , {msg: req.query.msg, tc: req.query.tc, caisses: caisses})

        } catch (err) {
            console.error("Erreur dans l'envois des rapport:", err);
            res.redirect('/notFound');
        }
        
    })
}

module.exports = {rapportJournalier};