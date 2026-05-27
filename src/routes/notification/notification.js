const {Notification, sequelize, Personnel, ReadNotification} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const readNotification = require('../../models/readNotification');

//liste des notification non lu par un utilisateur
allNotifNonLu = (app) =>{
    app.get('/allNotifNonLu/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const personnel = await Personnel.findByPk(req.params.id)

            if (!personnel) {
                return res.json({'type':'erreur', 'message':"Nous n'avons pas pu identifier l'utilisateur connecter pour afficher les notiffication"});
            }

            const nonLu = await Notification.findAll({
                where: { is_active: true },
                include: [{
                    model: Personnel,
                    // On cible la table de liaison définie dans belongsToMany
                    through: { 
                        attributes: ['lu', 'date', 'heure'], 
                        where: { 
                            is_active: true, 
                            lu: false, 
                            id_personnel: personnel.id_personnel 
                        } 
                    },
                    required: true // Indispensable pour filtrer uniquement les notifications concernées
                }],
                order: [['created', 'DESC']],
            });

            if (nonLu) {
                return res.json({'type': 'succes', 'data': nonLu, 'tc':'alert-success'});
            }else{
                return res.json({'type':'erreur', 'message':"Impossible de récupérer les notiffication de l'utilisateur connecter.", 'tc':'alert-danger'});
            }
        } catch (e) {
            console.log(e);
            res.redirect('/notFound');
        }
    });
}

marquerLu = (app) => {
    app.put('/marquerLu/:id_p/:id_n', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const id_perso = req.params.id_p;
            const id_notif = req.params.id_n;

            if (!id_notif || !id_perso) {
                return res.json({'type': 'erreur', 'message': 'Nous n\'avons pas pu effectuer cette operation'});
            }

            // Vérifier si la notif non marquer lu existe
            const isActive = await ReadNotification.findOne({
                where: { id_notif, id_personnel: id_perso, is_active: true, lu: false }
            });

            if (!isActive) {
                return res.json({'type': 'erreur', 'message': 'Nous n\'avons pas pu effectuer cette operation'});
            }

            //marquer lu
            await ReadNotification.update(
                { lu: true },
                {
                    where: { id_notif, id_personnel: id_perso }
                }
            );

            res.json({'type': 'succes', 'message': 'Operation  effectuer avec succes'});

        } catch (e) {
            console.log(e);
            res.redirect('/notFound');
        }
    });
};

marquerNonLu = (app) => {
    app.put('/marquerLu/:id_p/:id_n', protrctionRoot, authorise('admin', 'comptable'),async (req, res) => {
        try {
            const id_perso = req.query.id_p;
            const id_notif = req.query.id_n;

            if (!id_notif || !id_perso) {
                return res.json({'type': 'erreur', 'message': 'Nous n\'avons pas pu effectuer cette operation'});
            }

            // Vérifier si la notif non marquer lu existe
            const isActive = await ReadNotification.findOne({
                where: { id_notif, id_personnel: id_perso, is_active: true, lu: true }
            });

            if (!isActive) {
                return res.json({'type': 'erreur', 'message': 'Nous n\'avons pas pu effectuer cette operation'});
            }

            //marquer lu
            await ReadNotification.update(
                { lu: false },
                {
                    where: { id_notif, id_personnel: id_perso }
                }
            );

            res.json({'type': 'succes', 'message': 'Operation  effectuer avec succes'});

        } catch (e) {
            console.log(e);
            res.redirect('/notFound');
        }
    });
};

module.exports = {
    allNotifNonLu, marquerLu, marquerNonLu
};