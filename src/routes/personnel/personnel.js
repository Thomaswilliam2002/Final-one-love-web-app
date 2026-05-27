//const { where } = require('sequelize')
const {Personnel, Caisse} = require('../../db/sequelize') 
const {Poste} = require('../../db/sequelize')
const {Occupe} = require('../../db/sequelize')
const {Sanction} = require('../../db/sequelize')
const occupe = require('../../models/occupe')
const bcrypt = require('bcrypt')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const { where } = require('sequelize')

allPersonnel = (app) => {
    app.get('/allPersonnel', protrctionRoot, authorise('admin', 'comptable', 'caissier'), (req, res) => {
        Occupe.findAll({
            include: [
                {model: Personnel, where: {is_active: true}, required: false},
                {model: Poste, where: {is_active: true}, required: false}
            ],
            where: {is_active: true},
            order:[['id_occupe', 'DESC']]
        })
            .then(personnels => {
                const msg = "Liste recuperer avec succes"
                res.status(200).render('staff-list', {personnels: personnels, msg: req.query.msg, type:req.query.type, allType: req.query.allType, tc: req.query.tc});
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

validation = (app) => {
    app.get(['/validation/:id/:val'], async (req, res) => {
        const upd = await Personnel.update({
            validation: req.params.val
        },{
            where: {id_personnel: req.params.id}
        })
        if(upd){
            res.redirect('/allPersonnel?msg=Validation effectuer avec succes&tc=alert-success&type=admin');
        }else{
            res.redirect('/notFound');
            return;
        }
    })
}

onePersonnel = (app) => {
    app.get('/onePersonnel/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central', 'gerant'), (req, res) => {
        Occupe.findOne({
            include:[
                {
                    model:Personnel,
                    include: [{
                        model: Caisse,
                        through: { attributes: [] },
                        where: {is_active: true},
                        required: false
                    }],
                    where: {id_personnel: req.params.id}
                },
                {model: Poste, where: {is_active: true}, required: false},
                {model: Sanction, where: {is_active: true}, required: false}
            ],
        })
            .then(occupe => {
                if (!occupe) return res.redirect('/notFound');

                // Le personnel et ses caisses sont maintenant accessibles via 'occupe.Personnel'
                const personnel = occupe.Personnel;
                const caisses = personnel.Caisses || []; // Sequelize met les caisses dans un tableau .Caisses
    
                // On rend la vue avec toutes les données
                res.status(200).render('staff-profil', {
                    occupe: occupe, 
                    indice: req.query.indice, 
                    caisses: caisses, // Sera un tableau vide si ce n'est pas un caissier ou s'il n'a pas de caisse
                    msg: req.query.msg,
                    tc: req.query.tc
                });
                // if(occupe.Personnel.type_personnel === 'caissier'){
                //     res.status(200).render('staff-profil', {occupe: occupe, indice: req.query.indice});
                // }
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

formAddPersonnel = (app) =>{
    app.get(['/formAddPersonnel', '/inscription'], (req, res) => {
        Poste.findAll({where: { is_active: true }})
            .then(postes => {
                res.status(200).render('add-staff', {postes: postes, indice: req.query.indice, msg: req.query.msg, tc: req.query.tc})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

formAddAdmin = (app) =>{
    app.get('/formAddAdmin', protrctionRoot, authorise('admin'), (req, res) => {
        res.status(200).render('add-admin', {msg: req.query.msg, tc: req.query.tc})
    })
}

formEditAdmin = (app) =>{
    app.get('/formEditAdmin/:id', protrctionRoot, authorise('admin'), (req, res) => {
        Personnel.findByPk(req.params.id)
            .then(personnel => {
                Occupe.findAll({ 
                    include:[
                        {model:Personnel, where: {id_personnel: personnel.id_personnel}, required: true},
                        {model: Poste, where: {id_poste: 1, is_active: true}, required: true}
                    ]
                })
                .then(occupe => {
                    //res.json(occupe)
                    res.status(200).render('edit-admin', {personnel: personnel, occupe: occupe})
                })
                .catch(_ => {
                    console.error(_);
                    res.redirect('/notFound');
                    return; // On stoppe tout ici !
                })
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

formEditPersonnel = (app) =>{
    app.get('/formEditPersonnel/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier'), async (req, res) => {
        try{
            const personnel = await  Personnel.findByPk(req.params.id)
            const occupe = await Occupe.findOne({
                where:{id_personnel: personnel.id_personnel, is_active: true},
                include:[
                    {
                        model:Poste,
                        where: {is_active: true}
                    }
                ]
            })
            res.status(200).render('edit-staff', {personnel: personnel,occupe})
        }catch(_) {
            console.error(_);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

addPersonnel = (app) => {
    app.post(['/addPersonnel', '/addAdmin'], async (req, res) => {
        try {
            const { nom, prenom, email, mdp, numero, age, selectGenderOptions, poste, desc, adresse, periode } = req.body;

            const cleanAge = age?.trim();
            const emailtrim = email?.trim();
            const ageData = (cleanAge && !isNaN(cleanAge)) ? parseInt(cleanAge, 10) : 0;

            if (["onelove@gmail.com", "one-love@gmail.com", "one_love@gmail.com"].includes(emailtrim?.toLowerCase())) {
                return res.redirect("/inscription?msg=Impossible de creer un compte avec cette adresse email. Choisisez de preferance un email qui ne contien pas le mot 'onelove'.");
            }

            // Vérifier si email existe
            if (emailtrim && emailtrim.includes('@')) {
                const verif = await Personnel.findOne({ where: { email: emailtrim } });

                if (verif) {
                    const msg = "Cette email existe déjà! Choisisez un autre.";

                    if (req.path === '/addPersonnel' && req.query.sender === 'staff') {
                        return res.redirect('/inscription?msg=' + msg);
                    } else if (req.path === '/addAdmin') {
                        return res.redirect('/formAddAdmin?msg=' + msg);
                    }
                }
            }

            let postte = poste;
            let type = 'staff';

            // hash password
            const salt = await bcrypt.genSalt(10);
            const hash_pass = await bcrypt.hash(mdp, salt);

            // si admin
            if (req.path === '/addAdmin') {
                const adPoste = await Poste.findOne({ where: { nom_poste: 'Admin' } });

                if (adPoste) {
                    postte = adPoste.id_poste;
                    type = 'admin';
                }
            }

            // si personnel
            if (req.path === '/addPersonnel') {
                const post = await Poste.findByPk(poste);

                if (post) {
                    // res.json(post);
                    // return;
                    if (post.nom_poste.toLowerCase() === 'comptable') type = 'comptable';
                    else if (post.nom_poste.toLowerCase() === 'caissier central') type = 'caissier central';
                    else if (post.nom_poste.toLowerCase() === 'caissier') type = 'caissier';
                }
            }

            // créer personnel
            const personnel = await Personnel.create({
                nom,
                prenom,
                adresse,
                email: emailtrim,
                mdp: hash_pass,
                numero,
                age: ageData,
                genre: selectGenderOptions,
                type_personnel: type,
                description: desc,
                validation: 0,
                periode
            });

            const posteData = await Poste.findByPk(postte);

            await Occupe.create({
                salaire: posteData.salaire,
                id_personnel: personnel.id_personnel,
                id_poste: posteData.id_poste
            });

            // redirections
            if (req.path === '/addPersonnel' && req.query.sender === 'admin') {
                return res.redirect('/formAddPersonnel?indice=admin&msg=ajout');
            } else if (req.path === '/addPersonnel') {
                return res.redirect('/login');
            } else if (req.path === '/addAdmin' && req.query.sender === 'admin') {
                return res.redirect('/formAddAdmin?msg=ajout');
            }

        } catch (err) {
            console.error(err);
            res.redirect('/notFound');
        }
    });
}

addPersonnel = (app) => {
    app.post(['/addPersonnel', '/addAdmin'], async (req, res) => {
        try {
            const { nom, prenom, email, mdp, numero, age, selectGenderOptions, poste, desc, adresse, periode } = req.body;

            const cleanAge = age?.trim();
            const emailtrim = email?.trim();
            const ageData = (cleanAge && !isNaN(cleanAge)) ? parseInt(cleanAge, 10) : 0;

            if (["onelove@gmail.com", "one-love@gmail.com", "one_love@gmail.com"].includes(emailtrim?.toLowerCase())) {
                return res.redirect("/inscription?msg=Impossible de creer un compte avec cette adresse email. Choisisez de preferance un email qui ne contien pas le mot 'onelove'.");
            }

            // Vérifier si email existe
            if (emailtrim && emailtrim.includes('@')) {
                const verif = await Personnel.findOne({ where: { email: emailtrim } });

                if (verif) {
                    const msg = "Cette email existe déjà! Choisisez un autre.";

                    if (req.path === '/addPersonnel' && req.query.sender === 'staff') {
                        return res.redirect('/inscription?msg=' + msg);
                    } else if (req.path === '/addAdmin') {
                        return res.redirect('/formAddAdmin?msg=' + msg);
                    }
                }
            }

            let postte = poste;
            let type = 'staff';

            // hash password
            const salt = await bcrypt.genSalt(10);
            const hash_pass = await bcrypt.hash(mdp, salt);

            // si admin
            if (req.path === '/addAdmin') {
                const adPoste = await Poste.findOne({ where: { nom_poste: 'Admin' } });

                if (adPoste) {
                    postte = adPoste.id_poste;
                    type = 'admin';
                }
            }

            // si personnel
            if (req.path === '/addPersonnel') {
                const post = await Poste.findByPk(poste);

                if (post) {
                    if (post.nom_poste.toLowerCase() === 'comptable') type = 'comptable';
                    else if (post.nom_poste.toLowerCase() === 'caissier central') type = 'caissier central';
                    else if (post.nom_poste.toLowerCase() === 'caissier') type = 'caissier';
                }
            }

            // créer personnel
            const personnel = await Personnel.create({
                nom,
                prenom,
                adresse,
                email: emailtrim,
                mdp: hash_pass,
                numero,
                age: ageData,
                genre: selectGenderOptions,
                type_personnel: type,
                description: desc,
                validation: 0,
                periode
            });

            const posteData = await Poste.findByPk(postte);

            await Occupe.create({
                salaire: posteData.salaire,
                id_personnel: personnel.id_personnel,
                id_poste: posteData.id_poste
            });

            // redirections
            if (req.path === '/addPersonnel' && req.query.sender === 'admin') {
                return res.redirect('/formAddPersonnel?indice=admin&msg=Personnel ajouté&tc=alert-success');
            } else if (req.path === '/addPersonnel') {
                return res.redirect('/login');
            } else if (req.path === '/addAdmin' && req.query.sender === 'admin') {
                return res.redirect('/formAddAdmin?msg=Administrateur ajouté&tc=alert-success');
            }

        } catch (err) {
            console.error(err);
            res.redirect('/notFound');
        }
    });
}

updatePersonnel = (app) => {
    app.put(['/updatePersonnel/:id'], (req, res) => {
        if (req.query.type === 'staff'){
            const {nom, prenom, email, numero, age, selectGenderOptions, desc, adresse, periode} = req.body;
            Personnel.update({
                nom: nom,
                prenom: prenom,
                adresse: adresse,
                email: email,
                numero: numero,
                age: age,
                genre: selectGenderOptions,
                description: desc,
                periode: periode
            },{
                where: {id_personnel: req.params.id}
            })
                .then(personnel => {
                    res.redirect(`/onePersonnel/${req.params.id}`);
                  
                })
                .catch(_ => {
                    console.error(_);
                    res.redirect('/notFound');
                    return; // On stoppe tout ici !
                })
        }
        else if(req.query.type === 'admin'){
            const {nom, prenom, email, numero, age, selectGenderOptions, qualification, poste, departement, sdepartement, salaire, desc, adresse} = req.body;
             Personnel.update({
                nom: nom,
                prenom: prenom,
                adresse: adresse,
                email: email,
                numero: numero,
                age: age,
                genre: selectGenderOptions,
                description: desc
            },{
                where: {id_personnel: req.params.id}
            })
                .then(personnel => {
                    res.redirect('/allPersonnel?allType=admin&msg=modif&type=admin');
                })
                .catch(_ => {
                    console.error(_);
                    res.redirect('/notFound');
                    return; // On stoppe tout ici !
                })
        }
    })
}

deletePersonnel = (app) => {
    app.delete('/deletePersonnel/:id', protrctionRoot, authorise('admin','comptable','caissier'), async (req, res) => {
        try {

            const personnel = await Personnel.findByPk(req.params.id);

            if (!personnel) {
                return res.redirect('/notFound');
            }

            const idPersonnel = personnel.id_personnel;

            // suppression logique de l'occupation
            await Occupe.update(
                { is_active: false },
                { where: { id_personnel: idPersonnel, is_active: true } }
            );

            // suppression logique du personnel
            await Personnel.update(
                { is_active: false, validation: false },
                { where: { id_personnel: idPersonnel } }
            );

            // redirection
            if (personnel.type_personnel === 'pas_admin') {
                return res.redirect('/allPersonnel?allType=pas_admin&msg=Personnel supprimer avec succes&tc=alert-success&type=staff');
            } else {
                return res.redirect('/allPersonnel?allType=admin&msg=Personnel supprimer avec succes&tc=alert-success&type=admin');
            }

        } catch (err) {
            console.error(err);
            res.redirect('/notFound');
        }
    });
}

module.exports = {
    allPersonnel,
    onePersonnel,
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
    formAddPersonnel,
    formEditPersonnel,
    formAddAdmin,
    formEditAdmin,
    validation
}