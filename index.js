require('dotenv').config();
const {sequelize, Occupe, Personnel, Poste, BarSimpleJournal, BarVipJournal, AppartFondJournal, CuisineJournal, 
    ChambreJournal, Sanction, CrazyClubJournal,
    Appartement,
    Categorie,AppartJournal,
    Produit,
    Emballage,Presence,
    Caisse,Depense, AvanceSalaire, PaiementSalaire, Salaire, 
    CaisseJournal,SalonPrive} = require('./src/db/sequelize');

const {stockJob} = require('./src/mail/email')


const methodOverride = require('method-override');
const path = require('path'); 
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const bcrypt = require('bcrypt');
const {protrctionRoot, authorise, infos} = require('./src/middleware/protectRoot');
const {fn, col, literal, json, where, Op} = require('sequelize');

//const bodyParser = require('body-parser')
const appart = require('./src/routes/appartement/appart')
const appartJournal = require('./src/routes/appartement/appartJournal')
const barSimple = require('./src/routes/barSimple/barSimple')
const barSJournal = require('./src/routes/barSimple/barSJournal')
const barVip = require('./src/routes/barVip/barVip')
const barVJournal = require('./src/routes/barVip/barVJournal')
const caisse = require('./src/routes/caisse/caisse')
const caisseJournal = require('./src/routes/caisse/caisseJournal')
const chambre = require('./src/routes/chambre/chambre')
const chambreJournal = require('./src/routes/chambre/chambreJournal')
const cuisine = require('./src/routes/cuisine/cuisine')
const cuisineJournal = require('./src/routes/cuisine/cuisineJournal')
const maisonClose = require('./src/routes/maisonclose/maisonClose')
const personnel = require('./src/routes/personnel/personnel')
const poste = require('./src/routes/poste/poste')
const sanction = require('./src/routes/sanction/sanction')
const client = require('./src/routes/client/client')
const crazyClub = require('./src/routes/cclub/cclub')
const crazyClubJournal = require('./src/routes/cclub/cclubJournal')
const categorie = require('./src/routes/categorie/categorie')
const produit = require('./src/routes/produit/produit')
const emballage = require('./src/routes/emballage/emballage')
const histEntrer = require('./src/routes/hist/histEntrer')
const histSortie = require('./src/routes/hist/histSortie')
const pointage = require('./src/routes/presence/presence')
const occupent = require('./src/routes/occupent/occupent')
const caisseProduit = require('./src/routes/produit/produitCaisse')
const forgot = require('./src/mail/forgotMail')
const depenseRoutes = require('./src/routes/depense/depense')
const categorieDepense = require('./src/routes/depense/categorieDepense')
const notification = require('./src/routes/notification/notification')
const fournisseur = require('./src/routes/fournisseur/fournisseur')
const inventaire = require('./src/routes/rapport/inventaire')
const rapportJ = require('./src/routes/rapport/rapportJournalier')
const salonPrive = require('./src/routes/salonPrive/salonPrive')
const journalSalonPrive = require('./src/routes/salonPrive/journalSalonPrive')
const collectFondSalonPrive = require('./src/routes/salonPrive/collectFondSalonPrive')
const creancier = require('./src/routes/creance/creancier')
const journalCreancier = require('./src/routes/creance/journalCreancie')
const journalEmprunt = require('./src/routes/creance/journalEmprunt')
const consommation = require('./src/routes/consommation/consommation')
const salaire = require('./src/routes/personnel/salaire')
const paiementSalaire = require('./src/routes/personnel/paiementSalaire')
const avanceSalaire = require('./src/routes/personnel/avanceSalaire')
const sejourClient = require('./src/routes/client/sejourClient')
const paiementSejour = require('./src/routes/client/paiementSejour')
const rapport = require('./src/routes/rapport/rapportPeriodique')


const {MaisonColse, Chambre, Cuisine, HistCaisse} = require('./src/db/sequelize')
const {BarSimple} = require('./src/db/sequelize')
const {BarVip} = require('./src/db/sequelize')
const {CrazyClub} = require('./src/db/sequelize')
const email = require('./src/mail/email');

const express = require('express');
const { create } = require('domain');
// const cclubJournal = require('./src/models/cclubJournal');
//const article = require('./src/models/article')

const app = express();
app.set('trust proxy', 1); // Indispensable pour que le cookie passe sur Render

app.set('view engine', 'ejs');
app.set('views', 'src/vues')
// app.use(cors({
//     origin: "*"
// }));

app.use(cors({
    // origin: process.env.FRONTEND_URL,
    origin: true,
    credentials: true
}));

const mySessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions', // Nom de la table qui sera créée automatiquement
    logging: false, // <--- Ajoute cette ligne pour cacher les logs SQL des sessions
    checkExpirationInterval: 15 * 60 * 1000, // Nettoie les sessions expirées toutes les 15 min
    expiration: 7 * 24 * 60 * 60 * 1000,  // Durée max de 1 semaine
    touchAfter: 24 * 60 * 60 // n'update la session que si modifiée après 24h
});

app.use(session({
    name: "session_name",
    secret: process.env.SESSION_SECRET || 'mon_secret_ultra_sur',
    store: mySessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Ajoute cette ligne aussi
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure:  true, //process.env.NODE_ENV === 'production'||
        httpOnly: true,
        // sameSite: 'lax', // Recommandé pour éviter les problèmes de redirection
        sameSite: 'none',     // Nécessaire si le cookie traverse des domaines
        //Note importante sur sameSite: 'none' : > Si ton application (le frontend) et ton serveur (le backend) sont sur le même nom de domaine (ce qui semble être le cas sur Render), il vaut mieux utiliser sameSite: 'lax'.
    }
}));


// TRÈS IMPORTANT : Créer la table dans MariaDB si elle n'existe pas
mySessionStore.sync();

app.use(methodOverride('_method'));

app.use('/assets', express.static(path.join(__dirname, 'src/vues/assets')))
app.use('/sweetalert2', express.static(__dirname + '/node_modules/sweetalert2/dist'));
app.use('/icons', express.static(__dirname + '/node_modules/bootstrap-icons'));
app.use(express.json());

app.use(express.urlencoded({extended: false}))

const port = process.env.PORT || 3000;

app.use(infos);

//no-store : Interdit au navigateur de sauvegarder la page sur le disque.
//must-revalidate : Force le navigateur à vérifier si le contenu a changé.
//max-stale=0 : Considère que toute version en cache est immédiatement périmée.

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

//route roote
app.get('/', (req, res) => {
    res.render('login', {msg: req.query.msg})
    //res.json('Hello heroku !🤩')
})
// ------------------------------------------------------------------------------------------
app.get('/expo', (req, res) => {
    res.json({data: 'ok'})
})
// ------------------------------------------------------------------------------------------

//route page not found
app.get('/notFound', (req, res) => {
    res.render('page-not-found', {msg: req.query.msg})
})

//route acount not found or probleme validation
app.get('/validation', (req, res) => {
    res.render('validation')
})

//route cree une fiche de paie
app.get('/fichePaie', (req, res) => {
    res.render('create-invoice')
})


// ------------------------------------------------------------------------------------------
const getDay = () => {
    const now = new Date()
    const year =  now.getFullYear()

    //premier jour de l'annee (UTC)
    const firstDay = new Date(Date.UTC(year, 0, 1))
    //dernier jour de l'annee (UTC)
    const lastDay = new Date(Date.UTC(year, 11, 31, 59, 59, 999))

    return {
        firstDayISO : firstDay,
        lastDayISO : lastDay
    }
}
// ------------------------------------------------------------------------------------------

//route recapitulatif des caisses et recette
app.get('/recap', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {

        const [
            nb_personnel, nb_appart, nb_barSimple, nb_barVip, nb_crazyClub,
            sum_bs, sum_bv, sum_cc, sum_cui, sum_ap, sum_ch,
            nb_mc, nb_ch, nb_cu, nb_cat, nb_prod, nb_emb, nb_cai, sum_depense
        ] = await Promise.all([

            Personnel.count({ where: { is_active: true } }),
            Appartement.count({ where: { is_active: true } }),
            BarSimple.count({ where: { is_active: true } }),
            BarVip.count({ where: { is_active: true } }),
            CrazyClub.count({ where: { is_active: true } }),

            BarSimpleJournal.sum("recette", {
                where: { is_active: true ,date: { [Op.gte]: todayStart, [Op.lt]: todayEnd } }
            }),

            BarVipJournal.sum("recette", {
                where: { is_active: true ,date: { [Op.gte]: todayStart, [Op.lt]: todayEnd } }
            }),

            CrazyClubJournal.sum("recette", {
                where: { is_active: true ,date: { [Op.gte]: todayStart, [Op.lt]: todayEnd } }
            }),

            CuisineJournal.sum("montant_verser", {
                where: { is_active: true ,date: { [Op.gte]: todayStart, [Op.lt]: todayEnd } }
            }),

            AppartJournal.sum("loyer", {
                where: { is_active: true ,date_debut: { [Op.gte]: todayStart, [Op.lt]: todayEnd } }
            }),

            ChambreJournal.sum("loyer", {
                where: { is_active: true ,date: { [Op.gte]: todayStart, [Op.lt]: todayEnd } }
            }),

            MaisonColse.count({ where: { is_active: true } }),
            Chambre.count({ where: { is_active: true } }),
            Cuisine.count({ where: { is_active: true } }),
            Categorie.count({ where: { is_active: true } }),
            Produit.count({ where: { is_active: true } }),
            Emballage.count({ where: { is_active: true } }),
            Caisse.count({ where: { is_active: true } }),

            Depense.sum("montant", {
                where: { is_active: true ,date: { [Op.gte]: todayStart, [Op.lt]: todayEnd } }
            })
        ]);

        const data = {
            personnel: nb_personnel || 0,
            nbAppart: nb_appart || 0,
            nbBarSimple: nb_barSimple || 0,
            nbBarVip: nb_barVip || 0,
            nbCrazyClub: nb_crazyClub || 0,
            nbMaisonClose: nb_mc || 0,
            nbChambre: nb_ch || 0,
            nbCuisine: nb_cu || 0,
            nbProduit: nb_prod || 0,
            nbCaisse: nb_cai || 0,
            nbEmballage: nb_emb || 0,
            nbCategorieArticle: nb_cat || 0,
            nbTotalBarClub: (nb_barSimple || 0) + (nb_barVip || 0) + (nb_crazyClub || 0),
            recetteBarSimple: sum_bs || 0,
            recetteBarVip: sum_bv || 0,
            recetteCrazyClub: sum_cc || 0,
            recetteCuisine: sum_cui || 0,
            recetteAppart: sum_ap || 0,
            recetteChambre: sum_ch || 0,
            sum_depense: sum_depense || 0
        };

        res.render('index', { data });

    } catch (e) {
        console.error("Erreur Dashboard Index:", e);
        res.redirect('/notFound');
    }
});

//route dashboard
app.get('/index', protrctionRoot, authorise('admin'), async (req, res) => {
    const nvdate = new Date();
    // Début et fin du mois en cours pour le filtrage
    const firstDay = new Date(nvdate.getFullYear(), nvdate.getMonth(), 1);
    const lastDay = new Date(nvdate.getFullYear(), nvdate.getMonth() + 1, 1);

    try {
        // On lance TOUTES les requêtes en parallèle pour gagner en performance
        const [
            nb_personnel, nb_appart, nb_barSimple, nb_barVip, nb_crazyClub,
            sum_bs, sum_bv, sum_cc, sum_cui, sum_ap, sum_ch,
            nb_mc, nb_ch, nb_cu, nb_cat, nb_prod, nb_emb, nb_cai,sum_depense,
            sum_recette_mois
        ] = await Promise.all([
            Personnel.count({ where: { is_active: true } }),
            Appartement.count({ where: { is_active: true } }),
            BarSimple.count({ where: { is_active: true } }),
            BarVip.count({ where: { is_active: true } }),
            CrazyClub.count({ where: { is_active: true } }),
            // Sommes avec gestion de la période (Gte = Supérieur ou égal, Lt = Strictement inférieur)
             // -----------------------------------------------------------
            
            BarSimpleJournal.sum("recette", { where: { is_active: true ,date: { [Op.gte]: firstDay, [Op.lt]: lastDay } } }),
            BarVipJournal.sum("recette", { where: { is_active: true ,date: { [Op.gte]: firstDay, [Op.lt]: lastDay } } }),
            CrazyClubJournal.sum("recette", { where: { is_active: true ,date: { [Op.gte]: firstDay, [Op.lt]: lastDay } } }),
            CuisineJournal.sum("montant_verser", { is_active: true ,where: { date: { [Op.gte]: firstDay, [Op.lt]: lastDay } } }),
            AppartJournal.sum("loyer", { where: { is_active: true ,date_debut: { [Op.gte]: firstDay, [Op.lt]: lastDay } } }),
            ChambreJournal.sum("loyer", { where: { is_active: true ,date: { [Op.gte]: firstDay, [Op.lt]: lastDay } } }),
            // Totaux globaux
            MaisonColse.count({ where: { is_active: true } }),
            Chambre.count({ where: { is_active: true } }),
            Cuisine.count({ where: { is_active: true } }),
            Categorie.count({ where: { is_active: true } }),
            Produit.count({ where: { is_active: true } }),
            Emballage.count({ where: { is_active: true } }),
            Caisse.count({ where: { is_active: true } }),
            Depense.sum("montant", { is_active: true ,where: {date: {[Op.gte]: firstDay,[Op.lt]: lastDay } } }),
            //somme des recettes du mois via la table histCaisse
            HistCaisse.findAll({
                attributes: [
                  [fn('SUM', literal('"quantiter" * "prix_unit"')), 'total']
                ],
                where: {
                  is_active: true,
                  created: {
                    [Op.gte]: firstDay,
                    [Op.lt]: lastDay
                  }
                },
                raw: true
              })
        ]);

        const data = {
            "personnel": nb_personnel || 0,
            "nbAppart": nb_appart || 0,
            "nbBarSimple": nb_barSimple || 0,
            "nbBarVip": nb_barVip || 0,
            "nbCrazyClub": nb_crazyClub || 0,
            "nbMaisonClose": nb_mc || 0,
            "nbChambre": nb_ch || 0,
            "nbCuisine": nb_cu || 0,
            "nbProduit": nb_prod || 0,
            "nbCaisse": nb_cai || 0,
            "nbEmballage": nb_emb || 0,
            "nbCategorieArticle": nb_cat || 0,
            "nbTotalBarClub": (nb_barSimple || 0) + (nb_barVip || 0) + (nb_crazyClub || 0),
            "recetteBarSimple": sum_bs || 0,
            "recetteBarVip": sum_bv || 0,
            "recetteCrazyClub": sum_cc || 0,
            "recetteCuisine": sum_cui || 0,
            "recetteAppart": sum_ap || 0,
            "recetteChambre": sum_ch || 0,
            "sum_depense": sum_depense || 0,
            "sum_recette_mois": sum_recette_mois || 0
        };

        res.render('index', { data: data });

    } catch (e) {
        console.error("Erreur Dashboard Index:", e);
        res.redirect('/notFound');
    }
});

// verrifie la liste des produit et emballage en rupture de stock toutte les heure et envoi un mail aux admin
stockJob.start();

//route presence
app.get('/presence', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
    const presences = await Presence.findAll({
        where: { is_active: true },
        include:[{model: Personnel, required: false, where: { is_active: true }}],
    })
    const personnels = await Personnel.findAll({where: { is_active: true }});
    if(presences){
        res.render('presence', {presences: presences,personnels: personnels, msg: req.query.msg, tc: req.query.text_color});
    }else{
        res.redirect('/notFound');
    }
    
})

//route login
app.get('/login', (req, res) => {
    res.render('login', {msg: req.query.msg, tc: req.query.tc})
})

//route connexion
// app.post('/connexion', async (req, res) => {
//     const{email, pwd} = req.body
//     const personnel = await Occupe.findOne({
//         where: {is_active: true},
//         include:[
//             {model: Personnel,where: {email: email, is_active: true}, required: true},
//             {model: Poste, required: true, where: {is_active: true}}
//         ]
//     })
//     if(personnel){
//         const verif = await bcrypt.compare(pwd, personnel.Personnel.mdp);
//         if(verif){
//             if(personnel.Personnel.validation === true){
//                 req.session.user = personnel;
//                 req.session.isLoggedIn = true;
//                 // res.locals.user = personnel;
//                 //console.log(res.locals.user)
//                 if(personnel.Poste.nom_poste === 'Admin'){
//                     res.redirect('/index');
//                 }else{
//                     // console.log('oui')
//                     res.redirect('/onePersonnel/' + personnel.Personnel.id_personnel)
//                 }
//             }else{
//                 // console.log('compte nom valider');
//                 res.redirect('login?msg= Votre compte n\'est pas valider. Veuillez pacienter ou contacter l\'administrateur.&tc=alert-danger')
//             }
            
//         }else{
//             // console.log('mdp incorrect');
//             res.redirect('login?msg=Email ou mot de passe incorrect&tc=alert-danger')
//         }
//     }else{
//         // console.log('utilisateur non trouver');
//         res.redirect('login?msg=Utilisateur non trouver.Email ou mot de passe incorrect&tc=alert-danger')
//     }
// })

app.post('/connexion', async (req, res) => {

    const { email, pwd } = req.body;

    const personnel = await Occupe.findOne({
        where: { is_active: true },
        include:[
            {
                model: Personnel,
                where: { email: email, is_active: true },
                required: true
            },
            {
                model: Poste,
                where: { is_active: true },
                required: true
            }
        ]
    });

    if(!personnel){
        return res.redirect('login?msg=Utilisateur non trouver.Email ou mot de passe incorrect&tc=alert-danger')
    }

    const verif = await bcrypt.compare(pwd, personnel.Personnel.mdp);

    if(!verif){
        return res.redirect('login?msg=Email ou mot de passe incorrect&tc=alert-danger')
    }

    if(personnel.Personnel.validation !== true){
        return res.redirect('login?msg=Votre compte n\'est pas valider. Veuillez patienter ou contacter l\'administrateur.&tc=alert-danger')
    }

    req.session.user = personnel;
    req.session.isLoggedIn = true;

    if(personnel.Poste.nom_poste === 'Admin'){
        res.redirect('/index');
    }else{
        res.redirect('/onePersonnel/' + personnel.Personnel.id_personnel);
    }

});

//route deconnexion
app.get('/deconnexion', protrctionRoot, (req, res) => {
    req.session.destroy((err) => {
        if(err){
            res.redirect('/login')
        }else{
            res.clearCookie("session_name")
            res.redirect('/login')
        }
    })
})

//route mdp oublier
app.get('/forgot', (req, res) => { //, protrctionRoot
    res.render('forgot-password')
})

//route changer le mdp
app.get('/reset', protrctionRoot, (req, res) => {
    res.render('reset-password',{msg: req.query.msg, tc: req.query.tc})
})

//route changer le mdp
app.put('/resetTraitement/:id', protrctionRoot, async (req, res) => {
    const { Pwd, newPwd, cnewPwd } = req.body;

    try {
        // 🔍 Récupérer l'utilisateur
        const user = await Personnel.findByPk(req.params.id);

        if (!user) {
            // ❌ Utilisateur inexistant
            return res.redirect('/login');
        }

        // 🔐 Vérifier l'ancien mot de passe
        const verif = await bcrypt.compare(Pwd, user.mdp); // ⚠️ correction: user.mdp au lieu de personnel.mdp

        if (!verif) {
            // ❌ Mauvais ancien mot de passe
            return res.redirect('/reset?msg=L\'encien mot de passe est incorrect&tc=alert-danger');
        }

        // 🔒 Vérifier que les nouveaux mots de passe correspondent
        if (newPwd !== cnewPwd) {
            return res.redirect('/reset?msg=Les nouveaux mots de passe ne correspondent pas Identique&tc=alert-danger'); // message confirmation incorrecte
        }

        // ⚠️ Vérification basique de sécurité (optionnel mais recommandé)
        if (!newPwd || newPwd.length < 8) {
            return res.redirect('/reset?msg=Le nouveau mot de passe est trop faible. Il doit contenir au moins 8 caractères&tc=alert-danger'); // mot de passe trop faible
        }

        // 🔑 Hasher le nouveau mot de passe
        const hash_pass = await bcrypt.hash(newPwd, 10);

        // 💾 Mise à jour en base
        user.mdp = hash_pass;
        await user.save();

        // ✅ Succès → redirection
        return res.redirect('/login?msg= Le mot de passe a bien été changé avec succès\nConnectez-vous avec le nouveau mot de passe&tc=alert-success');

    } catch (e) {
        console.log(e);
        return res.redirect('/notFond?msg=serveur');
    }
});

// la route vers la facture proforma
app.get('/proforma', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
    res.status(200).render('proforma')
})

//route add
app.get('/Add', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
    MaisonColse.findAll({where: {is_active: true}})
        .then(maisonColses => {
            Chambre.findAll({where: {is_active: true}}) 
                .then(chambres => {
                    
                    const msg = "Liste recuperer avec succes"
                    //res.json(maisonColses[0].id_mclose)
                    res.render('ajout', {maisonColses: maisonColses, chambres: chambres, msg: req.query.msg, tc: req.query.text_color})
                })
                .catch(_ => console.log('erreure de selection all' + _))
        })
        .catch(_ => console.log('erreure de selection all' + _))
})

// //route add bar
// app.get('/fondBarClub', (req, res) => {
//     res.render('/fondBarClub', {msg: req.query.msg})
// })

//route edit-bar-club
app.get('/editBarClub/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
    //console.log("ok")
    if(req.query.type === "bs"){
        BarSimple.findByPk(req.params.id)
            .then(bar => {
                res.status(200).render('edit-bar-club', {bar: bar, type: "bs", })
            })
            .catch(_ => console.log('erreure de selection' + _))
    }
    else if(req.query.type === "bv"){
        BarVip.findByPk(req.params.id)
            .then(bar => {
                res.status(200).render('edit-bar-club', {bar: bar, type: "bv"})
            })
            .catch(_ => console.log('erreure de selection' + _))
    }
    else if(req.query.type === "cc"){
        CrazyClub.findByPk(req.params.id)
            .then(bar => {
                res.status(200).render('edit-bar-club', {bar: bar, type: "cc"})
            })
            .catch(_ => console.log('erreure de selection' + _))
    }
    
})


//route afficher bar simple,vip and crazy club
app.get('/allBarClub', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
    BarSimple.findAll({where: {is_active: true}})
        .then(bars => {
            BarVip.findAll({where: {is_active: true}})
                .then(barv => {
                    CrazyClub.findAll({where: {is_active: true}})
                        .then(crazyc => {
                            res.render('all-bars-club', {bars: bars, barv: barv, crazyc: crazyc, msg: req.query.msg, type: req.query.type, tc: req.query.tc})
                        })
                        .catch(_ => console.log('erreure de selection all' + _))
                })
                .catch(_ => console.log('erreure de selection all' + _))
        })
        .catch(_ => console.log('erreure de selection all' + _))
})

// la route vers la liste des salarier
app.get('/salarier', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) =>{
    try{
        const salariers = await Occupe.findAll({
            where: {is_active: true},
            include:[
                {model: Personnel, required: false, where: {is_active: true}},
                {model: Poste, required: false, where: {is_active: true}},   
            ],
            order:[['id_occupe', 'DESC']]
        })
        if(salariers){
            //==========================================================================================
            // const salariersEnrichie = await Promise.all(salariers.map(async (s) => {
            //     const json = s.toJSON();
            //     // const av = await AvanceSalaire.findAll()
            //     // console.log('enc', av)
            //     //selectionner tout les salaire en cours
            //     const enCoure = await Salaire.findAll(
            //         {
            //             where: {is_active: true, status:'EN COURS', id_occupe: s.id_occupe},
            //             include:[
            //                 {
            //                     model: AvanceSalaire, required: false, where: {is_active: true}
            //                 },
            //                 {
            //                     model: PaiementSalaire, required: false, where: {is_active: true}
            //                 }
            //             ]
            //         },
                    
            //     )

            //     // console.log('enc', enCoure)

            //     let totalSalaire = 0
            //     let sumAvence = 0
            //     let sumPaiement = 0
            //     let totalPrime = 0
            //     let totalDeduction = 0
            //     //parcourire les salaire en coure
            //     const calc = enCoure.map((ec) => {
                    
            //         sumAvence += ec.AvanceSalaires.reduce(
            //             (somme,j)=> somme + Number(j.montant || 0),
            //             0
            //         );
            //         sumPaiement += ec.PaiementSalaires.reduce(
            //             (somme,j)=> somme + Number(j.montant || 0),
            //             0
            //         );

            //         totalSalaire += ec.montant_net
            //         totalPrime += ec.primes
            //         totalDeduction += ec.deductions

            //         // return {sumAvence: sumAvence, sumPaiement: sumPaiement, totalSalaire: totalSalaire}
            //     })

            //     json.sumAvence = sumAvence
            //     json.sumPaiement = sumPaiement
            //     json.totalSalaire = totalSalaire
            //     json.reste = (Number(totalSalaire || 0 ) + Number(totalPrime || 0)) - (Number(sumAvence || 0) + Number(sumPaiement || 0) + Number(totalDeduction || 0))

            //     return json;
            // })
            // )
            const salariersEnrichie = await Promise.all(salariers.map(async (s) => {
                const json = s.toJSON();
                
                const enCoure = await Salaire.findAll({
                    where: { is_active: true, status: 'EN COURS', id_occupe: s.id_occupe },
                    include: [
                        { model: AvanceSalaire, required: false, where: { is_active: true } },
                        { model: PaiementSalaire, required: false, where: { is_active: true } }
                    ]
                });
            
                let totalSalaire = 0;
                let sumAvance = 0; // Attention à l'orthographe "Avance"
                let sumPaiement = 0;
                let totalPrime = 0;
                let totalDeduction = 0;
            
                // On utilise forEach car on veut juste accumuler des valeurs, pas créer un nouveau tableau
                enCoure.forEach((ec) => {
                    // Correction : Vérifier si l'association existe ET utiliser le bon nom (souvent pluriel)
                    // Vérifie bien dans tes modèles si c'est "AvanceSalaires" ou "AvanceSalaires"
                    const avances = ec.AvanceSalaires || []; 
                    const paiements = ec.PaiementSalaires || [];
            
                    sumAvance += avances.reduce((somme, j) => somme + Number(j.montant || 0), 0);
                    sumPaiement += paiements.reduce((somme, j) => somme + Number(j.montant || 0), 0);
            
                    totalSalaire += Number(ec.montant_net || 0);
                    totalPrime += Number(ec.primes || 0);
                    totalDeduction += Number(ec.deductions || 0);
                });
            
                // On assigne les variables locales directement au JSON
                json.sumAvence = sumAvance;
                json.sumPaiement = sumPaiement;
                json.totalSalaire = totalSalaire;
                json.totalPrime = totalPrime;
                json.totalDeduction = totalDeduction;
                
                // Calcul du reste
                json.reste = (totalSalaire + totalPrime) - (sumAvance + sumPaiement + totalDeduction);
            
                return json;
            }));
            //========================================================================================
            res.render('salaries', {salariersEnrichie})
        }else{
            res.redirect('/notFound')
        }
    }catch(e){
        console.log(e)
        res.redirect('/notFound')
    }
})

// la route vers le formulaire ajout des font des bars et club
app.get('/formFondBarClub', protrctionRoot, authorise('admin','comptable','caissier', 'caissier central'), async (req, res) =>{
    let chambres = null;
    try{
        if(req.query.type === 'bc'){
            BarSimple.findAll({where: {is_active: true}})
            .then(barss =>{
                BarVip.findAll({where: {is_active: true}})
                    .then(barvs =>{
                        CrazyClub.findAll({where: {is_active: true}})
                            .then(crazys =>{
                                Caisse.findAll({where: {is_active: true}})
                                    .then(caisses => {
                                        res.render('fondBarClub', {barss: barss, chambres: chambres, barvs: barvs, crazys: crazys, caisses: caisses, msg: req.query.msg, type: req.query.type})
                                    })
                                    .catch(err => console.log(err))
                            })
                            .catch(err => console.log(err))
                    })
                    .catch(err => console.log(err))
            })
            .catch(err => console.log(err))
        }else if(req.query.type === 'cuisine'){
            Cuisine.findAll({where: {is_active: true}})
                .then(cuisines => {
                    res.render('fondBarClub', {cuisines: cuisines, chambres: chambres, msg: req.query.msg, type: req.query.type})
                })
                .catch(_ => console.log('erreure de selection all' + _))
        }else if(req.query.type === 'mclose') {
            const mcloses = await MaisonColse.findAll({where: {is_active: true}})
            if(mcloses){
                const chambre = await Chambre.findAll({where: {is_active: true}})
                const chambreEnrichie = await Promise.all(chambre.map(async (c) => {
                        const json = c.toJSON();
                        const chJ = await ChambreJournal.findAll({where: {is_active: true, id_chambre:c.id_chambre, id_mclose:c.id_mclose}})
                        // console.log(`len ch ${c.nom}`, chJ.length) 
                        const nbjour = chJ.length

                        const montant_total = chJ.reduce(
                            (somme,j)=> somme + Number(j.loyer || 0),
                            0
                        );

                        const manquant_total = chJ.reduce(
                            (somme,j)=> somme + Number(j.manquant || 0),
                            0
                        );

                        json.dette_manuelle = manquant_total
                        const ms = (nbjour * Number(c.loyer || 0)) - montant_total //Math.abs() => valeur absolu
                        json.manquant_total_systeme = ms < 0 ? 0 : ms

                        const histToday = await ChambreJournal.findAll({where: {is_active: true, id_chambre:c.id_chambre, date: new Date().toISOString().split('T')[0]}})
                        // console.log('len', histToday.length) 
                        if(histToday.length > 0){
                            json.total = json.dette_manuelle
                        }else{
                            json.total = Math.max(Number(json.dette_manuelle || 0), Number(json.manquant_total_systeme || 0)) + Number(c.loyer || 0)
                        }
                        return json;
                    })
                )
                // console.log('chambreEnrichie', chambreEnrichie)
                if(chambre){
                    res.render('fondBarClub', {mcloses: mcloses, chambres: chambreEnrichie, msg: req.query.msg, type: req.query.type})
                }
            }
        }else if(req.query.type === 'appart') {
            const apparts = await Appartement.findAll({where: {is_active: true}})
            if(apparts && apparts !== null){
                res.render('fondBarClub', {apparts:apparts,chambres: chambres, msg: req.query.msg, type: req.query.type})
            }
        }else if(req.query.type === 'salonp'){
            const salons = await SalonPrive.findAll({where: {is_active: true}})
            res.render('fondBarClub', {msg: req.query.msg, type: req.query.type, salons,chambres: chambres})
        }
    } catch (e) {
        console.error(e);
        res.redirect('/notFound');
    }
})

// route pour la caisse general one love
app.get('/caisseOnelove', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
    try {
        // Définition de l'expression de date pour Postgres
        const moisExpr = fn('TO_CHAR', col('date'), 'YYYY-MM');

        // On lance toutes les requêtes en parallèle pour plus de performance
        const [fbs, fbv, fap, fcui, fmc, fcc] = await Promise.all([
            BarSimpleJournal.findAll({
                attributes: [[moisExpr, 'mois'], [fn('SUM', col('recette')), 'total_recette']],
                group: [moisExpr], // Groupement par l'expression de date
                order: [[literal('"mois"'), 'ASC']],
                raw: true,
                where: { is_active: true }
            }),
            BarVipJournal.findAll({
                attributes: [[moisExpr, 'mois'], [fn('SUM', col('recette')), 'total_recette']],
                group: [moisExpr],
                order: [[literal('"mois"'), 'ASC']],
                raw: true,
                where: { is_active: true }
            }),
            AppartFondJournal.findAll({
                attributes: [[moisExpr, 'mois'], [fn('SUM', col('recette')), 'total_recette']],
                group: [moisExpr],
                order: [[literal('"mois"'), 'ASC']],
                raw: true,
                where: { is_active: true }
            }),
            CuisineJournal.findAll({
                attributes: [[moisExpr, 'mois'], [fn('SUM', col('montant_verser')), 'total_recette']],
                group: [moisExpr],
                order: [[literal('"mois"'), 'ASC']],
                raw: true,
                where: { is_active: true }
            }),
            ChambreJournal.findAll({
                attributes: [[moisExpr, 'mois'], [fn('SUM', col('loyer')), 'total_recette']],
                group: [moisExpr],
                order: [[literal('"mois"'), 'ASC']],
                raw: true,
                where: { is_active: true }
            }),
            CrazyClubJournal.findAll({ // Assure-toi que le modèle est bien importé
                attributes: [[moisExpr, 'mois'], [fn('SUM', col('recette')), 'total_recette']],
                group: [moisExpr],
                order: [[literal('"mois"'), 'ASC']],
                raw: true,
                where: { is_active: true }
            })
        ]);

        // Construction du tableau final
        const all_recette = [fbs, fbv, fap, fcui, fmc, fcc];

        res.render('caisseOnelove', { all_recette });

    } catch (e) {
        console.error("Erreur dans la route caisseOnelove :", e);
        res.redirect('/notFound');
    }
});

// les routes commence ici allBarClub
//appart.ell(app);
appart.allAppart(app);
appart.oneAppart(app);
appart.addAppart(app);
appart.updateAppart(app);
appart.deleteAppart(app);
appart.formAddAppart(app);
appart.formEditAppart(app);
//console.log("ok");
appartJournal.allJournal(app);
appartJournal.oneJournal(app);
appartJournal.addJournal(app);
appartJournal.updateJournal(app);
appartJournal.deleteJournal(app);
appartJournal.appartFondJournal(app);
appartJournal.deleteFondJournal(app);

client.allClient(app);
client.formAddClient(app);
client.addClient(app);
client.deleteClient(app);
client.histOpClient(app);

barSimple.allBarS(app);
barSimple.oneBarS(app);
barSimple.addBarS(app);
barSimple.updateBarS(app);
barSimple.deleteBarS(app);

barSJournal.allBSJournal(app);
barSJournal.oneBSJournal(app);
barSJournal.addBSJournal(app);
barSJournal.updateBSJournal(app);
barSJournal.deleteBSJournal(app);

barVip.allBarV(app);
barVip.oneBarV(app);
barVip.addBarV(app);
barVip.updateBarV(app);
barVip.deleteBarV(app);

barVJournal.allBVJournal(app);
barVJournal.oneBVJournal(app);
barVJournal.addBVJournal(app);
barVJournal.updateBVJournal(app);
barVJournal.deleteBVJournal(app); 

crazyClub.allCClub(app);
crazyClub.oneCClub(app);
crazyClub.addCClub(app);
crazyClub.updateCClub(app);
crazyClub.deleteCClub(app);

crazyClubJournal.allCCJournal(app);
crazyClubJournal.oneCCJournal(app);
crazyClubJournal.addCCJournal(app);
crazyClubJournal.updateCCJournal(app);
crazyClubJournal.deleteCCJournal(app);

caisse.allCaisse(app);
caisse.oneCaisse(app);
caisse.addCaisse(app);
caisse.updateCaisse(app);
caisse.deleteCaisse(app);
caisse.formAddCaisse(app);
caisse.formEditCaisse(app);
caisse.caisseBareSimple(app);
caisse.caisseBareVip(app);
caisse.caisseAppart(app);
caisse.caisseMClose(app);
caisse.caisseCClub(app);
caisse.caisseCuisine(app);
caisse.assignCaisse(app);
caisse.desassignCaisse(app);

caisseProduit.allProduitCaisse(app);
caisseProduit.addHistCaisse(app);
caisseProduit.allHistCaisse(app);
caisseProduit.deleteHistCaisse(app);
caisseProduit.statsRecetteMoris(app);
caisseProduit.allCaisseArticle(app);
caisseProduit.allCaisseContent(app);

caisseJournal.allCJournal(app);
caisseJournal.oneCJournal(app);
caisseJournal.addCJournal(app);
caisseJournal.updateCJournal(app);
caisseJournal.deleteCJournal(app);

chambre.allChambre(app);
chambre.oneChambre(app);
chambre.addChambre(app);
chambre.updateChambre(app);
chambre.deleteChambre(app);

chambreJournal.allChJournal(app);
chambreJournal.oneChJournal(app);
chambreJournal.addChJournal(app);
chambreJournal.updateChJournal(app);
chambreJournal.deleteChJournal(app);

cuisine.allCuisine(app);
cuisine.oneCuisine(app);
cuisine.addCuisine(app);
cuisine.updateCuisine(app);
cuisine.deleteCuisine(app);
cuisine.formAddCuisine(app);
cuisine.formEditCuisine(app);

cuisineJournal.allCuJournal(app);
cuisineJournal.oneCuJournal(app);
cuisineJournal.addCuJournal(app);
cuisineJournal.updateCuJournal(app);
cuisineJournal.deleteCuJournal(app);

maisonClose.allMClose(app);
maisonClose.oneMClose(app);
maisonClose.addMClose(app);
maisonClose.updateMClose(app);
maisonClose.deleteMClose(app);

personnel.formAddAdmin(app);
personnel.allPersonnel(app);
personnel.onePersonnel(app);
personnel.addPersonnel(app);
personnel.updatePersonnel(app);
personnel.deletePersonnel(app);
personnel.formAddPersonnel(app);
personnel.formEditPersonnel(app);
personnel.formEditAdmin(app);
personnel.validation(app);

poste.allPoste(app);
poste.onePoste(app);
poste.addPoste(app);
poste.updatePoste(app);
poste.deletePoste(app);

sanction.allSanction(app);
sanction.oneSanction(app);
sanction.addSanction(app);
sanction.updateSanction(app);
sanction.deleteSanction(app);
sanction.formAddSamction(app);

categorie.allCateg(app);
categorie.addCateg(app);
categorie.deleteCateg(app);
//categorie.formAddCateg(app);

histSortie.allHSortie(app);
histSortie.addHSortie(app);
histSortie.deleteHSortie(app);
histSortie.updateHSortie(app);
histSortie.allHAproCaisse(app);
histSortie.allHAproGeneral(app);

histEntrer.allHEntrer(app);
histEntrer.addHEntrer(app);
histEntrer.deleteHEntrer(app);
histEntrer.updateHEntrer(app);

produit.allProduit(app);
produit.formAddProduit(app);
produit.updateProduit(app);
produit.addProduit(app);
produit.deleteProduit(app);
produit.oneProduit(app);

emballage.allEmballage(app);
emballage.formAddEmballage(app);
emballage.addEmballage(app);
emballage.deleteEmballage(app);
emballage.updateEmballage(app);
emballage.oneEmballage(app);

pointage.addPresence(app);
pointage.addAbsence(app);
pointage.allPresence(app);
pointage.allAbsence(app);
pointage.deletePresence(app);
pointage.addArrivee(app);
pointage.updateDepart(app);
pointage.addAbsenceDebut(app);
pointage.updateAbsenceFin(app);

occupent.AddOccupent(app);
occupent.deleteOccupent(app);

forgot.forgotPassword(app);
forgot.resetPassword(app);
forgot.resetPasswordForm(app);

email.stockDown(app);

depenseRoutes.addDepense(app);
depenseRoutes.allDepense(app);
depenseRoutes.formAddDepense(app);
depenseRoutes.updateDepense(app);
depenseRoutes.deleteDepense(app);
depenseRoutes.depenceTest(app);

categorieDepense.addCategorieDepense(app);
categorieDepense.allCategorieDepense(app);
categorieDepense.formAddCategorieDepense(app);
categorieDepense.updateCategorieDepense(app);
categorieDepense.deleteCategorieDepense(app);

notification.allNotifNonLu(app);
notification.marquerLu(app);
notification.marquerNonLu(app);

fournisseur.allFournisseur(app);
fournisseur.addFournisseur(app);
fournisseur.updateFournisseur(app);
fournisseur.deleteFournisseur(app);

inventaire.inventaire(app);
inventaire.mackeInventaire(app);

rapportJ.rapportJournalier(app);

salonPrive.addSalon(app);
salonPrive.allSalon(app);
salonPrive.oneSalon(app);
salonPrive.updateSalon(app);
salonPrive.deleteSalon(app);

journalSalonPrive.addSalonJournal(app);
journalSalonPrive.deleteSalonJournal(app);

creancier.addCreancier(app);
creancier.allCreancier(app);
creancier.oneCreancier(app);
creancier.updateCreancier(app);
creancier.deleteCreancier(app);

journalCreancier.addCreanceJournal(app);
journalCreancier.deleteCreanceJournal(app);
journalCreancier.allCreanceJournal(app);

journalEmprunt.addNewEmprunt(app);
journalEmprunt.deleteEmpruntJournal(app);

consommation.addConsommation(app);
consommation.allConsommation(app);
consommation.deleteConsommation(app);
consommation.updateConsommation(app);

collectFondSalonPrive.addSPJournal(app);
collectFondSalonPrive.deleteSPJournal(app);
collectFondSalonPrive.allSPJournal(app);

salaire.addSalaire(app);
salaire.allSalaire(app);
salaire.deleteSalaire(app);
salaire.formSalaireAndPaiement(app);
salaire.updateSalaire(app);
salaire.formOpSalaire(app);

paiementSalaire.addPSalaire(app);
paiementSalaire.deletePSalaire(app);

avanceSalaire.addASalaire(app);
avanceSalaire.deleteASalaire(app);

sejourClient.addSejour(app);
sejourClient.allSejour(app);
sejourClient.updateSejour(app);
sejourClient.deleteSejour(app);

paiementSejour.addPaiementSejour(app);
paiementSejour.allPaiementSejour(app);
paiementSejour.deletePaiementSejour(app);

rapport.rapportPeriodique(app);

// const port = 8000;
// app.listen(port, () => console.log('serveur en cour sur http://localhost:' + port));

app.listen(port, () => {
    console.log(`Serveur en cours sur http://localhost:${port}`);
});

//----------------------------------------------------------------------------------------------------------------------
// const {DataTypes} = require('sequelize')

// const Appartement_m = require('./src/moduls/appartement')
// const AppartJournal_m = require('./src/moduls/appartJournal')
// const BarSimple_m = require('./src/moduls/barSimple')
// const BarSimpleJournal_m = require('./src/moduls/barSimpleJournal')
// const BarVip_m = require('./src/moduls/barVip');
// const BarVipJournal_m = require('./src/moduls/barVipJournal');
// const Caisse_m = require('./src/moduls/caisse');
// const CaisseJournal_m = require('./src/moduls/caisseJournal');
// const Chambre_m = require('./src/moduls/chambre');
// const ChambreJournal_m = require('./src/moduls/chambreJournal');
// const CrazyClub_m = require('./src/moduls/crazyClub');
// const Cuisine_m = require('./src/moduls/cuisine');
// const CuisineJournal_m = require('./src/moduls/cuisineJournal');
// const MaisonColse_m = require('./src/moduls/maisonClose');
// const Personnel_m = require('./src/moduls/personnel');
// const Poste_m = require('./src/moduls/postel');
// const Sanction_m = require('./src/moduls/sanction');


// const Appartement = Appartement_m(sequelize, DataTypes);
// const AppartJournal = AppartJournal_m(sequelize, DataTypes);
// const BarSimple = BarSimple_m(sequelize, DataTypes);
// const BarSimpleJournal = BarSimpleJournal_m(sequelize, DataTypes);
// const BarVip = BarVip_m(sequelize, DataTypes);
// const BarVipJournal = BarVipJournal_m(sequelize, DataTypes);
// const Caisse = Caisse_m(sequelize, DataTypes);
// const CaisseJournal = CaisseJournal_m(sequelize, DataTypes);
// const Chambre = Chambre_m(sequelize, DataTypes);
// const ChambreJournal = ChambreJournal_m(sequelize, DataTypes);
// const CrazyClub = CrazyClub_m(sequelize, DataTypes);
// const Cuisine = Cuisine_m(sequelize, DataTypes);
// const CuisineJournal = CuisineJournal_m(sequelize, DataTypes);
// const MaisonColse = MaisonColse_m(sequelize, DataTypes);
// const Personnel = Personnel_m(sequelize, DataTypes);
// const Poste = Poste(sequelize, DataTypes);
// const Sanction = Sanction(sequelize, DataTypes);
// //creation des relation entre les table

// // liaison entre bar simple et son journal
// BarSimple.hasMany(BarSimpleJournal, {
//     foreignKey: 'code_barSimple'
// });
// BarSimpleJournal.belongsTo(BarSimple, {
//     foreignKey: 'code_barSimple'
// });

// // liaison entre appartement et son journal
// Appartement.hasMany(AppartJournal, {
//     foreignKey: 'id_appart'
// });
// AppartJournal.belongsTo(Appartement, {
//     foreignKey: 'id_appart'
// });

// // liaison entre bar vip et son journal
// BarVip.hasMany(BarVipJournal, {
//     foreignKey: 'code_barVip'
// });
// BarVipJournal.belongsTo(BarVip, {
//     foreignKey: 'code_barVip'
// });

// // liaison entre bar cuisine et son journal
// Cuisine.hasMany(CuisineJournal, {
//     foreignKey: 'id_cuisine'
// });
// CuisineJournal.belongsTo(Cuisine, {
//     foreignKey: 'id_cuisine'
// });

// // liaison entre maison close et chambre
// MaisonColse.hasMany(Chambre, {
//     foreignKey: 'id_mclose'
// });
// Chambre.belongsTo(MaisonColse, {
//     foreignKey: 'id_mclose'
// });

// // liaison entre chambre et son journal
// Chambre.hasMany(ChambreJournal, {
//     foreignKey: 'id_chambre'
// });
// ChambreJournal.belongsTo(Chambre, {
//     foreignKey: 'id_chambre'
// });

// // liaison entre caisse et son journal
// Caisse.hasMany(CaisseJournal, {
//     foreignKey: 'id_caisse'
// });
// CaisseJournal.belongsTo(Caisse, {
//     foreignKey: 'id_caisse'
// });

// // liaison entre caisse et bar simple
// Caisse.hasMany(BarSimple, {
//     foreignKey: 'id_caisse'
// });
// BarSimple.belongsTo(Caisse, {
//     foreignKey: 'id_caisse'
// });

// // liaison entre caisse et appartement
// Caisse.hasMany(Appartement, {
//     foreignKey: 'id_caisse'
// });
// Appartement.belongsTo(Caisse, {
//     foreignKey: 'id_caisse'
// });

// // liaison entre caisse et bar vip
// Caisse.hasMany(BarVip, {
//     foreignKey: 'id_caisse'
// });
// BarVip.belongsTo(Caisse, {
//     foreignKey: 'id_caisse'
// });

// // liaison entre caisse et cuisine
// Caisse.hasMany(Cuisine, {
//     foreignKey: 'id_caisse'
// });
// Cuisine.belongsTo(Caisse, {
//     foreignKey: 'id_caisse'
// });

// // liaison entre caisse et maison close
// Caisse.hasMany(MaisonColse, {
//     foreignKey: 'id_caisse'
// });
// MaisonColse.belongsTo(Caisse, {
//     foreignKey: 'id_caisse'
// });

// // liaison entre personnel et poste
// Personnel.hasMany(Poste, {
//     foreignKey: 'id_personnel'
// });
// Poste.belongsTo(Personnel, {
//     foreignKey: 'id_personnel'
// });

// // liaison entre poste et sanction
// Poste.hasMany(Sanction, {
//     foreignKey: 'id_poste'
// });
// Sanction.belongsTo(Poste, {
//     foreignKey: 'id_poste'
// });

// sequelize.sync({force: false})
//     .then(_ => console.log('Base synchronisee'))
//     .catch(err => console.log('Erreur ' + err))