const {Presence, Personnel} = require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

addArrivee = (app) => {
    // 1. POINTER L'ARRIVÉE (Nouvelle ligne)
    app.post('/addArrivee', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const { id_personnel, heure_arriver, pointeur, date_debut } = req.body;
        try {
            const presence = await Presence.findOne({
                where: {
                    id_personnel: id_personnel,
                    heure_deppart: null,
                    etat_presence: 'Present'
                }
            });if (presence) {
                return res.redirect('/presence?msg=Erreur: L\'employé est deja present depuis ' + presence.date_debut + ' a ' + presence.heure_arriver + '. Veuillez pointer son départ pour pouvoir en marquer une nouvelle.&tc=text-danger');
            }
            await Presence.create({
                date_debut: date_debut,
                heure_arriver: heure_arriver,
                etat_presence: 'Present',
                id_personnel: id_personnel,
                pointeur: pointeur // On récupère l'id de l'admin connecté
            });res.redirect('/presence?msg=Arrivée enregistrée&tc=text-success');
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

updateDepart = (app) => {
    // 2. POINTER LE DÉPART (Mise à jour de la ligne existante)
    app.post('/updateDepart', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const { id_personnel, heure_deppart, date_fin } = req.body;

        try {
            const presence = await Presence.findOne({
                where: {
                    id_personnel: id_personnel,
                    heure_deppart: null,
                    etat_presence: 'Present'
                }
            });if (!presence) {
                return res.redirect('/presence?msg=Erreur: Aucun début de présence trouvé pour cet employé aujourd\'hui&tc=text-danger');
            }

            if (presence.date_debut > date_fin) {
                return res.redirect('/presence?msg=Erreur: La date de fin de presence ne peut pas etre inferieur à la date de debut de presence&tc=text-danger');
            }

            if(presence.date_debut == date_fin){
                if(presence.heure_arriver > heure_deppart){
                    return res.redirect("/presence?msg=Erreur: L'heure de depart ne peut pas être inferieur à l'heure d'arriver&tc=text-danger");    
                }
            }

            await presence.update({ heure_deppart: heure_deppart, date_fin: date_fin });
            res.redirect('/presence?msg=Départ enregistré&tc=text-warning');
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

addAbsenceDebut = (app) => {
    // 3. DÉBUT ABSENCE (Nouvelle ligne)
    app.post('/addAbsenceDebut', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const { id_personnel, date_debut, justification, pointeur, heure_debut } = req.body;
        try {
            const absence = await Presence.findOne({
                where: {
                    id_personnel: id_personnel,
                    etat_presence: 'Absent',
                    heure_deppart: null
                },
                order: [['date_debut', 'DESC']]
            });if (absence) {
                return res.redirect('/presence?msg=Erreur: Absence en cours trouvée(' + absence.date_debut + ' ' + absence.heure_arriver + ') pour cet employé. Veuillez terminer l\'absence en cours pour pouvoir en marquer une nouvelle.&tc=text-danger');
            }
            const a = await Presence.create({
                date_debut: date_debut,
                heure_arriver: heure_debut,
                etat_presence: 'Absent',
                justification_absence: justification,
                id_personnel: id_personnel,
                pointeur: pointeur
            });res.redirect('/presence?msg=Début d\'absence marqué&tc=text-danger');
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

updateAbsenceFin = (app) => {
    // 4. FIN ABSENCE (Mise à jour)
    app.post('/updateAbsenceFin', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const { id_personnel, date_fin, heure_fin } = req.body;
        try {
            const absence = await Presence.findOne({
                where: {
                    id_personnel: id_personnel,
                    etat_presence: 'Absent',
                    heure_deppart: null
                },
                order: [['date_debut', 'DESC']]
            });if (!absence) {
                return res.redirect('/presence?msg=Erreur: Aucune absence en cours trouvée&tc=text-danger');
            }

            if (absence.date_debut > date_fin) {
                return res.redirect('/presence?msg=Erreur: La date de fin d\'absence ne peut pas etre inferieur à la date de debut d\'absence&tc=text-danger');
            }

            if(absence.date_debut == date_fin){
                if(absence.heure_arriver > heure_fin){
                    return res.redirect("/presence?msg=Erreur: L'heure de depart ne peut pas etre inferieur à l'heure d'arriver&tc=text-danger");    
                }
            }

            await absence.update({ date_fin: date_fin, heure_deppart: heure_fin });
            res.redirect('/presence?msg=Retour d\'absence enregistré&tc=text-info');
        } catch (error) {
            console.log(error);
            res.redirect('/notFound');
        }
    });
}
addPresence = (app) => {
    app.post('/addPresence/:id/:idUser', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const {date, hd, hf, da} = req.body;
        let depart_enticipe = 'non'
        if(da){
            depart_enticipe = 'oui'
        }
        const personnel = await Personnel.findByPk(req.params.id);
        if(personnel){
            const presence = await Presence.create({
                date: date,
                heure_arriver: hd,
                heure_deppart: hf,
                justification_absence: '',
                etat_presence: 'Present',
                depart_enticiper: depart_enticipe,
                description: '',
                id_personnel: req.params.id,
                pointeur: req.params.idUser
            })
            if(presence){
                res.redirect('/presence?msg=Presence maquer pour ' + personnel.nom + ' ' + personnel.prenom + '&type=presence')
            }
        }else{
            res.redirect('/notFound');
            return
        }
    })
}

addAbsence = (app) => {
    app.post('/addAbsence/:id/:idUser', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const {date,hd, hf, just} = req.body;
        let ndate = new Date(date);
        const flag = false;
        const personnel = await Personnel.findByPk(req.params.id);
        if(personnel){
            const presence = await Presence.findOne({
                where: {date: ndate.toISOString(), id_personnel: req.params.id}
            })
            if(presence){
                if(presence.heure_arriver >= hd && presence.heure_deppart <= hf){
                    res.redirect('/presence?msg=' + personnel.nom + ' ' + personnel.prenom  + '&type=existe')
                }else{
                    const absence = await Presence.create({
                        date: date,
                        heure_arriver: hd,
                        heure_deppart: hf,
                        justification_absence: just,
                        etat_presence: 'Absent',
                        depart_enticiper: '',
                        description: just,
                        id_personnel: req.params.id,
                        pointeur: req.params.idUser
                    })
                    if(absence){
                        res.redirect('/presence?msg=Absence maquer pour ' + personnel.nom + ' ' + personnel.prenom  + '&type=absence')
                    }
                }
            }else{
                const absence = await Presence.create({
                    date: date,
                    heure_arriver: hd,
                    heure_deppart: hf,
                    justification_absence: just,
                    etat_presence: 'Absent',
                    depart_enticiper: '',
                    description: just,
                    id_personnel: req.params.id,
                    pointeur: req.params.idUser
                })
                if(absence){
                    res.redirect('/presence?msg=Absence maquer pour ' + personnel.nom + ' ' + personnel.prenom  + '&type=absence')
                }else{
                    res.redirect('/notFound');
                    return
                }
            }
            
        }
    })
}

allPresence = (app) => {
    app.get('/allPresence', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const histps = await Presence.findAll({
            where: {etat_presence: 'Present', is_active: true},
            include:[
                {model: Personnel, where: {is_active: true}, required: true}
            ],
            order:[['id_presence', 'DESC']]
        })
        if(histps){
            res.status(200).render('histPresence', {histps: histps, indice: req.query.indice})
        }else{
            const msg = 'Historique de présence vide.'
            res.status(200).render('histPresence', {msg: msg})
        }
    })
}

allAbsence = (app) => {
    app.get('/allAbsence', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        const histas = await Presence.findAll({
            where: {etat_presence: 'Absent', is_active: true},
            include:[
                {model: Personnel, where: {is_active: true}, required: true}
            ]
        })
        if(histas){
            res.status(200).render('histAbsence', {histas: histas, indice: req.query.indice})
        }else{
            const msg = 'Historique d\'absence vide.'
            res.status(200).render('histAbsence', {msg: msg})
        }
    })
}

deletePresence = (app) => {
    app.delete('/deletePresence/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), (req, res) => {
        Presence.findByPk(req.params.id)
            .then(presence => {
                const appartDel = presence;
                Presence.update({is_active: false},{where: {id_presence: appartDel.id_presence}})
                    .then(_ => {
                        res.redirect('/allPresence')
                    })
                    .catch(_ => {
                        console.error(_);
                        res.redirect('/notFound');
                        return; // On stoppe tout ici !
                    })
            })
    })
}

module.exports = {
    addPresence,
    addAbsence,
    allPresence,
    allAbsence,
    deletePresence,
    addArrivee,
    updateDepart,
    addAbsenceDebut,
    updateAbsenceFin
}