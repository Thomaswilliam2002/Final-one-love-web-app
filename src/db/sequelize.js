const {Sequelize, DataTypes,Op} = require('sequelize');
const bcrypt = require('bcrypt')
require('dotenv').config();

const Appartement_m = require('../models/appartement')
const AppartJournal_m = require('../models/appartJournal')
const BarSimple_m = require('../models/barSimple')
const BarSimpleJournal_m = require('../models/barSimpleJournal')
const BarVip_m = require('../models/barVip');
const BarVipJournal_m = require('../models/barVipJournal');
const Caisse_m = require('../models/caisse');
const CaisseJournal_m = require('../models/caisseJournal');
const Chambre_m = require('../models/chambre');
const ChambreJournal_m = require('../models/chambreJournal');
const CrazyClub_m = require('../models/crazyClub');
const CrazyClubJournal_m = require('../models/cclubJournal');
const Cuisine_m = require('../models/cuisine');
const CuisineJournal_m = require('../models/cuisineJournal');
const MaisonColse_m = require('../models/maisonClose');
const Personnel_m = require('../models/personnel');
const Poste_m = require('../models/poste');
const Sanction_m = require('../models/sanction');
const Client_m = require('../models/client')
const Occupe_m = require('../models/occupe')
const Categorie_m = require('../models/categorie')
const Produit_m = require('../models/produit')
const Emballage_m = require('../models/emballage')
const HistEntrer_m = require('../models/histEntrer')
const HistSortie_m = require('../models/histSortie')
const Presence_m = require('../models/presence')
const Occupent_m = require('../models/occupent')
const AppartFondJournal_m = require('../models/appartFondJournal');
const HistCaisse_m = require('../models/histCaise');
const occupe = require('../models/occupe');
const Depense_m = require('../models/depense');
const CategorieDepense_m = require('../models/categorieDepense');
const CaissePersonnel_m = require('../models/caissePersonnel');
const Fournisseur_m = require('../models/fournisseur');
const Notification_m = require('../models/notification');
const ReadNotification_m = require('../models/readNotification');
const Consomation_m = require('../models/consomation');
const SalonPrive_m = require('../models/salonPrive');
const JournalSalonPrive_m = require('../models/journalSalonPrive');
const CollectFondSalonPrive_m = require('../models/collectFondSalonPrive');
const Creancier_m = require('../models/creance');
const JournalCreancier_m = require('../models/journalCreancier');
const JournalEmprunt_m = require('../models/journalEmprunt');
const JournalSalaire_m = require('../models/journalSalaire');
const PaiementSalaire_m = require('../models/paiementSalaire');
const AvanceSalaire_m = require('../models/avanceSalaire');
const Salaire_m = require('../models/salaire');
const PaiementSejourAppart_m = require('../models/paiementSejourAppart');

const { on } = require('nodemailer/lib/xoauth2');


// On utilise l'URL de Render (DATABASE_URL)
// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//     dialect: 'postgres',
//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false // Indispensable pour que Render accepte la connexion
//       }
//     }
// });

const sequelize = new Sequelize('onelove', 'postgres', '1234', {
    host: '127.0.0.1',
    dialect: 'postgres',
    port: 5432,
    logging: true, // Pour ne pas polluer la console avec les requêtes SQL
});

const Appartement = Appartement_m(sequelize, DataTypes);
const AppartJournal = AppartJournal_m(sequelize, DataTypes);
const BarSimple = BarSimple_m(sequelize, DataTypes);
const BarSimpleJournal = BarSimpleJournal_m(sequelize, DataTypes);
const BarVip = BarVip_m(sequelize, DataTypes);
const BarVipJournal = BarVipJournal_m(sequelize, DataTypes);
const Caisse = Caisse_m(sequelize, DataTypes);
const CaisseJournal = CaisseJournal_m(sequelize, DataTypes);
const Chambre = Chambre_m(sequelize, DataTypes);
const ChambreJournal = ChambreJournal_m(sequelize, DataTypes);
const CrazyClub = CrazyClub_m(sequelize, DataTypes);
const CrazyClubJournal = CrazyClubJournal_m(sequelize, DataTypes);
const Cuisine = Cuisine_m(sequelize, DataTypes);
const CuisineJournal = CuisineJournal_m(sequelize, DataTypes);
const MaisonColse = MaisonColse_m(sequelize, DataTypes);
const Personnel = Personnel_m(sequelize, DataTypes);
const Poste = Poste_m(sequelize, DataTypes);
const Sanction = Sanction_m(sequelize, DataTypes);
const Client = Client_m(sequelize, DataTypes);
const Occupe = Occupe_m(sequelize, DataTypes);
const Categorie = Categorie_m(sequelize, DataTypes);
const Produit = Produit_m(sequelize, DataTypes);
const Emballage = Emballage_m(sequelize, DataTypes);
const HistEntrer = HistEntrer_m(sequelize, DataTypes);
const HistSortie = HistSortie_m(sequelize, DataTypes);
const Presence = Presence_m(sequelize, DataTypes);
const Occupent = Occupent_m(sequelize, DataTypes);
const AppartFondJournal = AppartFondJournal_m(sequelize, DataTypes);
const HistCaisse = HistCaisse_m(sequelize, DataTypes);
const Depense = Depense_m(sequelize, DataTypes);
const CategorieDepense = CategorieDepense_m(sequelize,DataTypes);
const CaissePersonnel = CaissePersonnel_m(sequelize, DataTypes);
const Fournisseur = Fournisseur_m(sequelize, DataTypes);
const Notification = Notification_m(sequelize, DataTypes);
const ReadNotification = ReadNotification_m(sequelize, DataTypes);
const Consomation = Consomation_m(sequelize, DataTypes);
const SalonPrive = SalonPrive_m(sequelize, DataTypes);
const JournalSalonPrive = JournalSalonPrive_m(sequelize, DataTypes);
const CollectFondSalonPrive = CollectFondSalonPrive_m(sequelize, DataTypes);
const Creancier = Creancier_m(sequelize, DataTypes);
const JournalCreancier = JournalCreancier_m(sequelize, DataTypes);
const JournalEmprunt = JournalEmprunt_m(sequelize, DataTypes);
const JournalSalaire = JournalSalaire_m(sequelize, DataTypes);
const PaiementSalaire = PaiementSalaire_m(sequelize, DataTypes);
const AvanceSalaire = AvanceSalaire_m(sequelize, DataTypes);
const Salaire = Salaire_m(sequelize, DataTypes);
const PaiementSejourAppart = PaiementSejourAppart_m(sequelize, DataTypes);


sequelize.authenticate()
    .then(_ => console.log("Connexion reussi avec la bd"))
    .catch(err => console.log('erreur: ' + err))


//creation des relation entre les table

// liaison entre bar simple et son journal
BarSimple.hasMany(BarSimpleJournal, {
    foreignKey: 'id_barSimple'
});
BarSimpleJournal.belongsTo(BarSimple, {
    foreignKey: 'id_barSimple'
});

// liaison entre appartement et son journal
Appartement.hasMany(AppartJournal, {
    foreignKey: 'id_appart'
});
AppartJournal.belongsTo(Appartement, {
    foreignKey: 'id_appart'
});

// liaison entre client et journal journal
Client.hasMany(AppartJournal, {
    foreignKey: 'id_client'
});
AppartJournal.belongsTo(Client, {
    foreignKey: 'id_client'
});

// liaison entre appartement journal et son paiement sejour appart
AppartJournal.hasMany(PaiementSejourAppart, {
    foreignKey: 'id_journal'
});
PaiementSejourAppart.belongsTo(AppartJournal, {
    foreignKey: 'id_journal'
});

// liaison entre appartement et appart font journal
Appartement.hasMany(AppartFondJournal, {
    foreignKey: 'id_appart'
});
AppartFondJournal.belongsTo(Appartement, {
    foreignKey: 'id_appart'
});

// liaison entre bar vip et son journal
BarVip.hasMany(BarVipJournal, {
    foreignKey: 'id_barVip'
});
BarVipJournal.belongsTo(BarVip, {
    foreignKey: 'id_barVip'
});

CrazyClub.hasMany(CrazyClubJournal, {
    foreignKey: 'id_cclub'
});
CrazyClubJournal.belongsTo(CrazyClub, {
    foreignKey: 'id_cclub'
});

// liaison entre bar cuisine et son journal
Cuisine.hasMany(CuisineJournal, {
    foreignKey: 'id_cuisine'
});
CuisineJournal.belongsTo(Cuisine, {
    foreignKey: 'id_cuisine'
});

// liaison entre maison close et chambre
MaisonColse.hasMany(Chambre, {
    foreignKey: 'id_mclose'
});
Chambre.belongsTo(MaisonColse, {
    foreignKey: 'id_mclose'
});

// liaison entre chambre et son journal
Chambre.hasMany(ChambreJournal, {
    foreignKey: 'id_chambre'
});
ChambreJournal.belongsTo(Chambre, {
    foreignKey: 'id_chambre'
});

// liaison entre maison close et journal chambre
MaisonColse.hasMany(ChambreJournal, {
    foreignKey: 'id_mclose'
});
ChambreJournal.belongsTo(MaisonColse, {
    foreignKey: 'id_mclose'
});

// liaison entre caisse et son journal
Caisse.hasMany(CaisseJournal, {
    foreignKey: 'id_caisse'
});
CaisseJournal.belongsTo(Caisse, {
    foreignKey: 'id_caisse'
});

// liaison entre salon prive et sa collect
SalonPrive.hasMany(CollectFondSalonPrive, {
    foreignKey: 'id_salon'
});
CollectFondSalonPrive.belongsTo(SalonPrive, {
    foreignKey: 'id_salon'
});

// liaison entre creancier et son journal
Creancier.hasMany(JournalCreancier, {
    foreignKey: 'id_creancier'
});
JournalCreancier.belongsTo(Creancier, {
    foreignKey: 'id_creancier'
});

// liaison entre creancier et son journal emprunt
Creancier.hasMany(JournalEmprunt, {
    foreignKey: 'id_creancier'
});
JournalEmprunt.belongsTo(Creancier, {
    foreignKey: 'id_creancier'
});

// liaison entre Personnel et consommation
// --- Relation pour le CONSOMMATEUR ---
Personnel.hasMany(Consomation, {
    foreignKey: 'consommateur',
    as: 'mesConsommations' // Alias pour récupérer les consos d'un employé
});
Consomation.belongsTo(Personnel, {
    foreignKey: 'consommateur',
    as: 'detailsConsommateur' // Alias pour voir qui a consommé
});

// --- Relation pour le MARQUEUR (celui qui enregistre) ---
Personnel.hasMany(Consomation, {
    foreignKey: 'marqueur',
    as: 'consommationsMarquees' // Alias pour voir ce qu'un marqueur a saisi
});
Consomation.belongsTo(Personnel, {
    foreignKey: 'marqueur',
    as: 'detailsMarqueur' // Alias pour voir qui a marqué la conso
});

// --- Relation pour poste et journal salaire ---
Poste.hasMany(JournalSalaire, {
    foreignKey: 'id_poste'
});
JournalSalaire.belongsTo(Poste, {
    foreignKey: 'id_poste'
});

// liaison entre Personnel et journal salon priver
// --- Relation pour le SALON ---
Personnel.hasMany(JournalSalonPrive, {
    foreignKey: 'danseuse',
    as: 'mesDanses' // Alias pour récupérer les dance d'un employé(danseuse)
});
JournalSalonPrive.belongsTo(Personnel, {
    foreignKey: 'danseuse',
    as: 'detailsDanseuse' // Alias pour voir qui a danser
});

// --- Relation pour le MARQUEUR (celui qui enregistre) ---
Personnel.hasMany(JournalSalonPrive, {
    foreignKey: 'marqueur',
    as: 'danseMarquees' // Alias pour voir ce qu'un marqueur a saisi
});
JournalSalonPrive.belongsTo(Personnel, {
    foreignKey: 'marqueur',
    as: 'detailsMarqueur' // Alias pour voir qui a marqué la danse
});


// liaison entre salon prive et son journal
SalonPrive.hasMany(JournalSalonPrive, {
    foreignKey: 'id_salon'
});
JournalSalonPrive.belongsTo(SalonPrive, {
    foreignKey: 'id_salon'
});


// --- Relation pour personnel et journal salaire ---
Personnel.hasMany(Salaire, {
    foreignKey: 'id_personnel'
});
Salaire.belongsTo(Personnel, {
    foreignKey: 'id_personnel'
});

// --- Relation pour occupe et journal salaire ---
Occupe.hasMany(Salaire, {
    foreignKey: 'id_occupe'
});
Salaire.belongsTo(Occupe, {
    foreignKey: 'id_occupe'
});

// --- Relation pour Occupe et paiement salaire ---
Salaire.hasMany(PaiementSalaire, {
    foreignKey: 'id_salaire'
});
PaiementSalaire.belongsTo(Salaire, {
    foreignKey: 'id_salaire'
});

// --- Relation pour Occupe et avance salaire ---
Salaire.hasMany(AvanceSalaire, {
    foreignKey: 'id_salaire'
});
AvanceSalaire.belongsTo(Salaire, {
    foreignKey: 'id_salaire'
});
//===========================================================================
// Association Notification -> Personnel
Notification.belongsToMany(Personnel, {
    through: ReadNotification,
    foreignKey: 'id_notif',   
    otherKey: 'id_personnel', 
    onDelete: 'CASCADE',
});

// Association Personnel -> Notification
Personnel.belongsToMany(Notification, {
    through: ReadNotification,
    foreignKey: 'id_personnel',
    otherKey: 'id_notif',   
    onDelete: 'CASCADE',
});
//===========================================================================

// Association Caisse -> Personnel
Caisse.belongsToMany(Personnel, {
    through: CaissePersonnel,
    foreignKey: 'id_caisse',      // Clé pointant vers Caisse dans CaissePersonnel
    otherKey: 'id_personnel',     // Clé pointant vers Personnel dans CaissePersonnel
    onDelete: 'CASCADE',
    // as: 'Personnels'              // Alias pour tes requêtes include
});

// Association Personnel -> Caisse
Personnel.belongsToMany(Caisse, {
    through: CaissePersonnel,
    foreignKey: 'id_personnel',   // Clé pointant vers Personnel dans CaissePersonnel
    otherKey: 'id_caisse',        // Clé pointant vers Caisse dans CaissePersonnel
    onDelete: 'CASCADE',
    // as: 'Caisses'                 // Alias pour tes requêtes include
});

// liaison entre personnel et occupe
Personnel.hasMany(Occupe, {
    foreignKey: 'id_personnel'
});
Occupe.belongsTo(Personnel, {
    foreignKey: 'id_personnel'
});

// liaison entre personnel et presence
Personnel.hasMany(Presence, {
    foreignKey: 'id_personnel'
});
Presence.belongsTo(Personnel, {
    foreignKey: 'id_personnel'
});

// liaison entre occupe et poste
Poste.hasMany(Occupe, {
    foreignKey: 'id_poste'
});
Occupe.belongsTo(Poste, {
    foreignKey: 'id_poste'
});


// liaison entre occupe et sanction
Occupe.hasMany(Sanction, {
    foreignKey: 'id_occupe'
});
Sanction.belongsTo(Occupe, {
    foreignKey: 'id_occupe'
});

// liaison entre categorieDepense et depense
CategorieDepense.hasMany(Depense, {
    foreignKey: 'id_categ',
    onDelete: 'CASCADE'
});
Depense.belongsTo(CategorieDepense, {
    foreignKey: 'id_categ'
});

//liaison entre caisse et HistCaisse
Caisse.hasMany(HistCaisse, {
    foreignKey: 'id_caisse',
    onDelete: 'CASCADE'
});
HistCaisse.belongsTo(Caisse, {
    foreignKey: 'id_caisse',
});

// liaison entre fournisseur et histEntrer
HistEntrer.belongsTo(Fournisseur, {
    foreignKey: 'id_fournisseur',
});

Fournisseur.hasMany(HistEntrer, {
    foreignKey: 'id_fournisseur',
});

(async () => {
    try {
        await sequelize.sync(); //{ alter: true }
        console.log('Base synchronisée');

        const count = await Poste.count({
            where: {
                nom_poste: {
                    [Op.in]: ['Admin', 'Comptable', 'Caissier']
                }
            }
        });

        const admin = await Personnel.findAll({
            where: { type_personnel: 'admin' }
        });

        if (count === 0) {
            try {
                await Poste.bulkCreate([
                    { nom_poste: 'Admin', salaire: 0, description: 'Administrateur de One Love' },
                    { nom_poste: 'Comptable', salaire: 0, description: 'Comptable de One Love' },
                    { nom_poste: 'Caissier Central', salaire: 0, description: '' },
                    { nom_poste: 'Caissier', salaire: 0, description: '' },
                ], { individualHooks: true }); // important pour les hooks
            } catch (e) {
                console.log('Erreur insertion Postes :', e);
            }
        }

        // récupérer le poste admin
        const adminPoste = await Poste.findOne({ where: { nom_poste: 'Admin' } });

        if (!admin || admin.length === 0) {
            try {
                const salt = await bcrypt.genSalt(10);
                const hash_pass = await bcrypt.hash('adminadmin', salt);

                // Créer le personnel et attendre la fin pour récupérer l'id
                const newAdmin = await Personnel.create({
                    nom: 'admin',
                    prenom: 'admin',
                    adresse: '',
                    email: 'admin@gmail.com',
                    mdp: hash_pass,
                    numero: '',
                    age: 0,
                    genre: '',
                    type_personnel: 'admin',
                    description: '',
                    validation: true,
                    periode: 'Mensuel'
                });

                // Créer Occupe avec les bonnes clés
                await Occupe.create({
                    salaire: 0,
                    id_personnel: newAdmin.id_personnel, // utiliser l'ID créé
                    id_poste: adminPoste.id_poste,
                    // slug_id: await Occupe.generateCustomId() // si Occupe a un hook similaire
                });

            } catch (e) {
                console.log('Erreur création admin :', e);
                // Pas de res ici, juste log
            }
        }

    } catch (e) {
        console.log('Erreur sync globale :', e);
    }
})();

module.exports = {
    sequelize,
    Appartement,
    AppartJournal,
    BarSimple,
    BarSimpleJournal,
    BarVip,
    BarVipJournal,
    Caisse,
    CaisseJournal,
    Chambre,
    ChambreJournal,
    CrazyClub,
    CrazyClubJournal,
    Cuisine,
    CuisineJournal,
    MaisonColse,
    Personnel,
    Poste,
    Sanction,
    Client,
    Occupe,
    Categorie,
    Produit,
    Emballage,
    HistEntrer,
    HistSortie,
    Presence,
    Occupent,
    AppartFondJournal,
    HistCaisse,
    CategorieDepense,
    Depense,
    CaissePersonnel,
    Notification,
    ReadNotification,
    Fournisseur,
    Consomation,
    SalonPrive,
    JournalSalonPrive,
    CollectFondSalonPrive,
    Creancier,
    JournalCreancier,
    JournalEmprunt,
    JournalSalaire,
    PaiementSalaire,
    AvanceSalaire,
    Salaire,
    PaiementSejourAppart
}