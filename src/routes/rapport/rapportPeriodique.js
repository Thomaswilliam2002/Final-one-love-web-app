const {Caisse,sequelize, Personnel, Produit, HistSortie, HistEntrer, JournalSalonPrive, BarSimpleJournal,
    BarSimple, BarVip, BarVipJournal, AppartFondJournal, ChambreJournal, Appartement, CrazyClub, CrazyClubJournal, HistCaisse, CuisineJournal, Cuisine,
    SalonPrive, CollectFondSalonPrive, Consomation, Depense, CategorieDepense, Creancier, JournalCreancier, JournalEmprunt, MaisonColse} = require('../../db/sequelize')
const {fn, col, literal, Op, where} = require('sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const {differenceInDays, eachDayOfInterval, addDays, format, parseISO} = require('date-fns')

//============================================= FONCTION DE DECOUP TEMPOREL START ===============================================

//fonction de decoupe en n bloc de m jour
const splitDateRange = (startDate, endDate, dateParseInterval) =>{
    try{
        const debut = new Date(startDate)
        const fin = new Date(endDate)

        const dates = eachDayOfInterval({start: debut, end: addDays(fin, 1)}).map(date => format(date, 'yyyy-MM-dd'))

        nbj = differenceInDays(addDays(fin, 1), debut)

        nbParse = nbj / dateParseInterval

        const [divEntire, divDecimal] = [Math.floor(nbParse), nbParse % 1]

        const suplu = divDecimal > 0 ? divDecimal * dateParseInterval : 0

        let interval = []
        let inc0 = 0
        let inc1 = divEntire
        //decoupe des interval de date
        for(let i=1; i<= dateParseInterval; i++){
            if(i=== dateParseInterval){
                interval.push({debut: dates[inc0 + 1], fin: dates[inc1 + suplu]})
            }else{
                interval.push({debut: dates[inc0 + 1], fin: dates[inc1]})
            }
            inc0 += divEntire
            inc1 = inc0 + divEntire
        }

        // return {
        //     startDate,
        //     endDate,
        //     dateParseInterval,
        //     nbj,
        //     nbParse,
        //     divEntire,
        //     divDecimal,
        //     suplu,
        //     interval,
        //     dates
        // }
        return interval
    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}

//============================================= FONCTION DE DECOUP TEMPOREL END ===============================================



/**
 * Calcule la somme totale des recettes entre deux dates et heures précises
 * en se basant sur le champ 'created' (timestamps).
 */

//============================================= recette global start ===============================================
// cette fonction calcule et renvois la somme de toute les recette et manquant des different bar simple durant une periode donnee
async function calculerRecettesBarSimple(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des objets Date (les "voitures" pour filtrer le champ created)
        const debutCompte = new Date(`${date_debut}T${heure_debut}`);
        const finCompte = new Date(`${date_fin}T${heure_fin}`);
        
        //recuperer tout les bars simple
        const infos = await BarSimple.findAll({
            where: { 
                is_active: true 
            },
            attributes: {
                include:[// Somme des recettes et manquant pour ce bar spécifique
                    [fn('COALESCE',fn('SUM', col('BarSimpleJournals.recette')),0), 'total_recette'],
                    [fn('COALESCE',fn('SUM', col('BarSimpleJournals.manquant')),0), 'total_manquant']
                ]
                
            },
            include: [
                {
                    model: BarSimpleJournal,
                    required: false, // Permet de garder le bar même s'il n'y a pas de journal sur la période
                    where: {
                        is_active: true,
                        created: {
                            [Op.between]: [debutCompte, finCompte]
                        }
                    },
                    attributes: []
                }
            ],
            // Obligatoire pour que le SUM fonctionne par bar
            group: ['BarSimple.id_barSimple'] 
        });
        return {
            success: true,
            periode: { du: debutCompte, au: finCompte },
            details: infos
        };

    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}

// cette fonction calcule et renvois la somme de toute les recette et manquant des different bar vip durant une periode donnee
async function calculerRecettesVip(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des objets Date (les "voitures" pour filtrer le champ created)
        const debutCompte = new Date(`${date_debut}T${heure_debut}`);
        const finCompte = new Date(`${date_fin}T${heure_fin}`);

        //recuperer tout les bars simple
        const infos = await BarVip.findAll({
            where: { 
                is_active: true 
            },
            attributes: {
                include:[// Somme des recettes et manquant pour ce bar spécifique
                    [fn('COALESCE',fn('SUM', col('BarVipJournals.recette')),0), 'total_recette'],
                    [fn('COALESCE',fn('SUM', col('BarVipJournals.manquant')),0), 'total_manquant']
                ]
                
            },
            include: [
                {
                    model: BarVipJournal,
                    required: false, // Permet de garder le bar même s'il n'y a pas de journal sur la période
                    where: {
                        is_active: true,
                        created: {
                            [Op.between]: [debutCompte, finCompte]
                        }
                    },
                    attributes: []
                }
            ],
            // Obligatoire pour que le SUM fonctionne par bar
            group: ['BarVip.id_barVip'] 
        });
        return {
            success: true,
            periode: { du: debutCompte, au: finCompte },
            details: infos
        };

    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}

// cette fonction calcule et renvois la somme de toute les recette et manquant des different crazy club durant une periode donnee
async function calculerRecettesCrazyClub(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des objets Date (les "voitures" pour filtrer le champ created)
        const debutCompte = new Date(`${date_debut}T${heure_debut}`);
        const finCompte = new Date(`${date_fin}T${heure_fin}`);

        //recuperer tout les bars simple
        const infos = await CrazyClub.findAll({
            where: { 
                is_active: true 
            },
            attributes: {
                include:[// Somme des recettes et manquant pour ce bar spécifique
                    [fn('COALESCE',fn('SUM', col('CClubJournals.recette')),0), 'total_recette'],
                    [fn('COALESCE',fn('SUM', col('CClubJournals.manquant')),0), 'total_manquant']
                ]
                
            },
            include: [
                {
                    model: CrazyClubJournal,
                    required: false, // Permet de garder le bar même s'il n'y a pas de journal sur la période
                    where: {
                        is_active: true,
                        created: {
                            [Op.between]: [debutCompte, finCompte]
                        }
                    },
                    attributes: []
                }
            ],
            // Obligatoire pour que le SUM fonctionne par bar
            group: ['CrazyClub.id_cclub'] 
        });
        return {
            success: true,
            periode: { du: debutCompte, au: finCompte },
            details: infos
        };

    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}

// cette fonction calcule et renvois la somme de toute les recette et manquant des different salon prive durant une periode donnee
async function calculerRecettesSalonPrive(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des objets Date (les "voitures" pour filtrer le champ created)
        const debutCompte = new Date(`${date_debut}T${heure_debut}`);
        const finCompte = new Date(`${date_fin}T${heure_fin}`);

        //recuperer tout les bars simple
        const infos = await SalonPrive.findAll({
            where: { 
                is_active: true 
            },
            attributes: {
                include:[// Somme des recettes et manquant pour ce bar spécifique
                    [fn('COALESCE',fn('SUM', col('CollectFondSalonPrives.recette')),0), 'total_recette'],
                    [fn('COALESCE',fn('SUM', col('CollectFondSalonPrives.manquant')),0), 'total_manquant']
                ]
                
            },
            include: [
                {
                    model: CollectFondSalonPrive,
                    required: false, // Permet de garder le bar même s'il n'y a pas de journal sur la période
                    where: {
                        is_active: true,
                        created: {
                            [Op.between]: [debutCompte, finCompte]
                        }
                    },
                    attributes: []
                }
            ],
            // Obligatoire pour que le SUM fonctionne par bar
            group: ['SalonPrive.id_salon'] 
        });
        return {
            success: true,
            periode: { du: debutCompte, au: finCompte },
            details: infos
        };

    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}

// cette fonction calcule et renvois la somme de toute les recette des different appartement durant une periode donnee
async function calculerRecettesAppartement(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des objets Date (les "voitures" pour filtrer le champ created)
        const debutCompte = new Date(`${date_debut}T${heure_debut}`);
        const finCompte = new Date(`${date_fin}T${heure_fin}`);

        const infos = await Appartement.findAll({
            where: { 
                is_active: true 
            },
            attributes: {
                include:[// Somme des recettes et manquant pour ce bar spécifique
                    [fn('COALESCE',fn('SUM', col('AppartFondJournals.recette')),0), 'total_recette'],
                    [fn('COALESCE',fn('SUM', col('AppartFondJournals.manquant')),0), 'total_manquant']
                ]
                
            },
            include: [
                {
                    model: AppartFondJournal,
                    required: false, // Permet de garder le bar même s'il n'y a pas de journal sur la période
                    where: {
                        is_active: true,
                        created: {
                            [Op.between]: [debutCompte, finCompte]
                        }
                    },
                    attributes: []
                }
            ],
            // Obligatoire pour que le SUM fonctionne par bar
            group: ['Appartement.id_appart'] 
        });
        return {
            success: true,
            periode: { du: debutCompte, au: finCompte },
            details: infos
        };

    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}

async function calculerRecettesMaisonClose(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des objets Date (les "voitures" pour filtrer le champ created)
        const debutCompte = new Date(`${date_debut}T${heure_debut}`);
        const finCompte = new Date(`${date_fin}T${heure_fin}`);

        //recuperer tout les bars simple
        const infos = await MaisonColse.findAll({ 
            where: { 
                is_active: true 
            },
            attributes: {
                include:[// Somme des recettes et manquant pour ce bar spécifique
                    [fn('COALESCE',fn('SUM', col('ChambreJournals.loyer')),0), 'total_recette'],
                    [fn('COALESCE',fn('SUM', col('ChambreJournals.manquant')),0), 'total_manquant']
                ]
                
            },
            include: [
                {
                    model: ChambreJournal,
                    required: false, // Permet de garder la maison close même s'il n'y a pas de journal sur la période
                    where: {
                        is_active: true,
                        created: {
                            [Op.between]: [debutCompte, finCompte]
                        }
                    },
                    attributes: []
                }
            ],
            // Obligatoire pour que le SUM fonctionne par bar
            group: ['MaisonClose.id_mclose'] 
        });
        return {
            success: true,
            periode: { du: debutCompte, au: finCompte },
            details: infos
        };

    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}

// cette fonction calcule et renvois la somme de toute les recette des differente cuisine durant une periode donnee
async function calculerRecettesCuisine(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des objets Date (les "voitures" pour filtrer le champ created)
        const debutCompte = new Date(`${date_debut}T${heure_debut}`);
        const finCompte = new Date(`${date_fin}T${heure_fin}`);

        //recuperer tout les bars simple
        const infos = await Cuisine.findAll({ 
            where: { 
                is_active: true 
            },
            attributes: {
                include:[// Somme des recettes et manquant pour ce bar spécifique
                    [fn('COALESCE',fn('SUM', col('CuisineJournals.montant_verser')),0), 'total_recette'],
                    [fn('COALESCE',fn('SUM', col('CuisineJournals.manquant')),0), 'total_manquant']
                ]
                
            },
            include: [
                {
                    model: CuisineJournal,
                    required: false, // Permet de garder la cuisine même s'il n'y a pas de journal sur la période
                    where: {
                        is_active: true,
                        created: {
                            [Op.between]: [debutCompte, finCompte]
                        }
                    },
                    attributes: []
                }
            ],
            // Obligatoire pour que le SUM fonctionne par bar
            group: ['Cuisine.id_cuisine'] 
        });
        return {
            success: true,
            periode: { du: debutCompte, au: finCompte },
            details: infos
        };

    } catch (error) {
        console.error("Erreur lors du calcul des recettes:", error);
        return { success: false, error: error.message };
    }
}
//============================================= recette global end ===============================================
//============================================= recette non percu end ===============================================
/**
 * Calcule le montant total des consommations par type de consommateur
 * pour une période donnée.
 */
async function calculerConsommationParType(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des bornes temporelles (les voitures) basées sur le champ 'created'
        const debutPeriode = new Date(`${date_debut}T${heure_debut}`);
        const finPeriode = new Date(`${date_fin}T${heure_fin}`);

        const resultats = await Consomation.findAll({
            raw: true,
            attributes: [
               'type_consommateur',
                    // Calcul du montant : SUM(quantiter * prix_unit)
                [fn('COALESCE',fn('SUM', literal('quantiter * prix_unit')),0), 'montant_total']  
            ],
            where: {
                is_active: true, // Respect de la suppression logique
                created: {
                    [Op.between]: [debutPeriode, finPeriode] // Filtrage sur le timestamp 'created'
                }
            },
            group: ['type_consommateur'], // Groupement par type distinct
            
        });

        return {
            success: true,
            periode: { debut: debutPeriode, fin: finPeriode },
            details: resultats
        };

    } catch (error) {
        console.error("Erreur lors du calcul des consommations :", error);
        return { success: false, error: error.message };
    }
}
//============================================= recette non percu end ===============================================
//============================================= Depenses start ===============================================
/**
 * Calcule la somme des dépenses par catégorie pour une période donnée.
 * Basé sur le champ 'created' pour la précision temporelle.
 */
async function calculerDepensesParCategorie(date_debut, date_fin, heure_debut = '00:00:00', heure_fin = '23:59:59') {
    try {
        // Construction des bornes temporelles
        const debutPeriode = new Date(`${date_debut}T${heure_debut}`);
        const finPeriode = new Date(`${date_fin}T${heure_fin}`);

        const resultats = await Depense.findAll({
            attributes: [
                'Depense.id_categ',
                [fn('SUM', col('montant')), 'total_depense']
            ],
            where: {
                is_active: true, // Uniquement les dépenses non supprimées logiquement
                created: {
                    [Op.between]: [debutPeriode, finPeriode]
                }
            },
            include: [
                {
                    model: CategorieDepense,
                    attributes: ['nom'], // Pour récupérer le nom de la catégorie au lieu de l'ID seul
                    where: { is_active: true } // Uniquement les catégories actives
                }
            ],
            group: ['Depense.id_categ', 'CategorieDepense.id_categ', 'CategorieDepense.nom'], 
            raw: true,
            nest: true // Organise le résultat pour que l'objet Categorie soit imbriqué proprement
        });

        return {
            success: true,
            periode: { debut: debutPeriode, fin: finPeriode },
            details: resultats
        };

    } catch (error) {
        console.error("Erreur lors du calcul des dépenses :", error);
        return { success: false, error: error.message };
    }
}
//============================================= Depenses end ===============================================
// //=============================================EPARGNE creance interne(PEPCO, AICHA,...) start ===============================================
// async function calculerDette(
//     date_debut,
//     date_fin,
//     heure_debut = '00:00:00',
//     heure_fin = '23:59:59'
// ) {
//     try{
//         const debutPeriode = new Date(`${date_debut}T${heure_debut}`);
//         const finPeriode = new Date(`${date_fin}T${heure_fin}`);

//         const creanciers = await Creancier.findAll({
//             where: {
//                 is_active: true
//             },

//             attributes: [
//                 // 'id_creancier',
//                 // 'nom',
//                 '*',

//                 [
//                     literal(`(
//                         SELECT COALESCE(SUM(jc.montat), 0)
//                         FROM JournalCreanciers as jc
//                         WHERE
//                             jc.id_creancier = Creancier.id_creancier
//                             AND jc.is_active = true
//                             AND jc.date BETWEEN '${debutPeriode.toISOString()}'
//                             AND '${finPeriode.toISOString()}'
//                     )`),
//                     'total_verser'
//                 ],

//                 [
//                     literal(`(
//                         SELECT COALESCE(SUM(je.montat), 0)
//                         FROM JournalEmprunts as je
//                         WHERE
//                             je.id_creancier = Creancier.id_creancier
//                             AND je.is_active = true
//                             AND je.date BETWEEN '${debutPeriode.toISOString()}'
//                             AND '${finPeriode.toISOString()}'
//                     )`),
//                     'total_recu'
//                 ]
//             ],

//             order: [
//                 ['id_creancier', 'ASC']
//             ]
//         });

//         return {
//             success: true,
//             details: creanciers
//         };
//     } catch (error) {
//         console.error("Erreur lors du calcul des consommations :", error);
//         return { success: false, error: error.message };
//     }
// }
//=============================================EPARGNE creance interne(PEPCO, AICHA,...) end ===============================================
//============================================= EXTRACT DATA FUNCTION START ===============================================
function extraireSommeRecettesManquant(blocs){
    let totalRecette = 0;
    let totalManquant = 0;
 
    blocs.forEach(module => {
 
       module.details.forEach(item => {
 
          const j = item.toJSON ? item.toJSON() : item;
 
          const enfants =
             j.BarSimpleJournals ||
             j.BarVipJournals ||
             j.CrazyClubJournals ||
             j.CollectFondSalonPrives ||
             j.AppartFondJournals ||
             j.CuisineJournals ||
             [];
 
          if(enfants.length){
 
             enfants.forEach(e=>{
                totalRecette += Number(
                   e.total_recette ||
                   e.recette ||
                   e.loyer ||
                //    e.montant_verser ||
                   0
                );

                totalManquant += Number(
                    e.total_manquant ||
                    e.manquant ||
                    0
                 );
             });
 
          } else if(j.total_recette){
            totalRecette += Number(j.total_recette);
            totalManquant += Number(j.total_manquant);
          }
 
       });
 
    });
 
    return {totalRecette, totalManquant};
}
//============================================= EXTRACT DATA FUNCTION END ===============================================
// ============================================= STOCKS / INVENTAIRE SYNTHÉTIQUE START ===============================================
/**
 * Calcule l'inventaire synthétique caisse par caisse
 * (pas produit par produit)
 *
 * Colonnes retournées pour la maquette :
 * - stock_initial
 * - entrees
 * - sorties
 * - stock_final
 * - valeur
 */

async function calculerInventaireSynthese(
    date_debut,
    date_fin,
    heure_debut='00:00:00',
    heure_fin='23:59:59'
){
 try{

    // -------------------------------------------------
    // bornes période
    // -------------------------------------------------
    const debut = new Date(`${date_debut}T${heure_debut}`);
    const fin   = new Date(`${date_fin}T${heure_fin}`);

    // -------------------------------------------------
    // récupération des caisses actives
    // chaque caisse donnera UNE ligne de la maquette
    // -------------------------------------------------
    const caisses = await Caisse.findAll({
        where:{
            is_active:true
        }
    });

    let syntheseCaisses = [];

    // -------------------------------------------------
    // parcours caisse par caisse
    // -------------------------------------------------
    for(const caisse of caisses){

        //------------------------------------------------
        // produits qui ont déjà bougé dans cette caisse
        //------------------------------------------------
        const mouvements = await HistSortie.findAll({
            attributes:['id_probal'],
            where:{
                is_active:true,
                id_caisse:caisse.id_caisse
            },
            group:['id_probal'],
            raw:true
        });

        if(!mouvements.length){

            syntheseCaisses.push({
                caisse:caisse.nom,
                stock_initial:0,
                entrees:0,
                sorties:0,
                stock_final:0,
                valeur:0,
                benefice:0
            });

            continue;
        }

        const idsProduits =
            mouvements.map(m=>m.id_probal);

        //------------------------------------------------
        // entrées avant période
        //------------------------------------------------
        const entreesAvant = await HistSortie.findAll({
            attributes:[
              'id_probal',
              [fn('SUM',col('quantiter')),'total']
            ],
            where:{
                is_active:true,
                id_caisse:caisse.id_caisse,
                created:{
                   [Op.lt]:debut
                }
            },
            group:['id_probal'],
            raw:true
        });


        //------------------------------------------------
        // ventes avant période
        //------------------------------------------------
        const ventesAvant = await HistCaisse.findAll({
            attributes:[
              'id_probal',
              [fn('SUM',col('quantiter')),'total']
            ],
            where:{
                is_active:true,
                id_caisse:caisse.id_caisse,
                created:{
                  [Op.lt]:debut
                }
            },
            group:['id_probal'],
            raw:true
        });


        //------------------------------------------------
        // entrées pendant période
        //------------------------------------------------
        const entreesPeriode = await HistSortie.findAll({
            attributes:[
             'id_probal',
             [fn('SUM',col('quantiter')),'total']
            ],
            where:{
                is_active:true,
                id_caisse:caisse.id_caisse,
                created:{
                  [Op.between]:[debut,fin]
                }
            },
            group:['id_probal'],
            raw:true
        });


        //------------------------------------------------
        // sorties / ventes période
        //------------------------------------------------
        const ventesPeriode = await HistCaisse.findAll({
            attributes:[
              'id_probal',
              [fn('SUM',col('quantiter')),'total']
            ],
            where:{
                is_active:true,
                id_caisse:caisse.id_caisse,
                created:{
                  [Op.between]:[debut,fin]
                }
            },
            group:['id_probal'],
            raw:true
        });


        //------------------------------------------------
        // petite fonction helper
        //------------------------------------------------
        const toMap=(arr)=>{
          let map={}
          arr.forEach(i=>{
             map[i.id_probal]=Number(i.total||0)
          })
          return map
        }

        const mapEA = toMap(entreesAvant);
        const mapVA = toMap(ventesAvant);
        const mapEP = toMap(entreesPeriode);
        const mapVP = toMap(ventesPeriode);


        //------------------------------------------------
        // agrégats synthétiques caisse
        //------------------------------------------------
        let stockInitialValeur=0;
        let entreesValeur=0;
        let sortiesValeur=0;
        let stockFinalValeur=0;
        let beneficeValeur=0;


        //------------------------------------------------
        // on passe produit par produit
        // MAIS uniquement pour agréger la caisse
        //------------------------------------------------
        for(const id of idsProduits){

            // dernier prix achat
            const prixAchat=await HistEntrer.findOne({
                where:{
                    id_probal:id
                },
                order:[
                   ['created','DESC']
                ],
                attributes:['prix_unit']
            });

            // dernier prix vente
            const prixVente=await HistSortie.findOne({
                where:{
                    id_probal:id,
                    id_caisse:caisse.id_caisse
                },
                order:[
                   ['created','DESC']
                ],
                attributes:['prix_unit']
            });

            // prix retenu pour valorisation(vente)
            const pu = Number(prixVente?.prix_unit||0);
            const pa = Number(prixAchat?.prix_unit || 0); // prix achat

            const si=
              (mapEA[id]||0)-
              (mapVA[id]||0);

            const ent=
              mapEP[id]||0;

            const sort=
              mapVP[id]||0;

            const sf=
              si+ent-sort;


            //-----------------------------------
            // valorisations synthétiques
            //-----------------------------------
            stockInitialValeur+=si*pu;

            entreesValeur+=ent*pu;

            sortiesValeur+=sort*pu;

            stockFinalValeur+=sf*pu;

            beneficeValeur+=sort* (pu - pa);

        }


        //------------------------------------------------
        // UNE ligne de maquette pour cette caisse
        //------------------------------------------------
        syntheseCaisses.push({

            caisse:caisse.nom,

            stock_initial:
               stockInitialValeur,

            entrees:
               entreesValeur,

            sorties:
               sortiesValeur,

            stock_final:
               stockFinalValeur,

            benefice:
               beneficeValeur,

            // la maquette semble demander "valeur"
            // ici on prend la valeur finale du stock
            valeur:
               stockFinalValeur
        });

    }


    //------------------------------------------------
    // total global synthétique toutes caisses
    //------------------------------------------------
    const totalGlobal=
      syntheseCaisses.reduce((a,c)=>{

        a.stock_initial+=c.stock_initial;
        a.entrees+=c.entrees;
        a.sorties+=c.sorties;
        a.stock_final+=c.stock_final;
        a.valeur+=c.valeur;
        a.benefice+=c.benefice;

        return a;

      },{
        stock_initial:0,
        entrees:0,
        sorties:0,
        stock_final:0,
        valeur:0,
        benefice:0
      });



    return{
      success:true,
      periode:{
        debut,
        fin
      },
      details:syntheseCaisses,
      total:totalGlobal
    }

 }catch(error){

   console.error(
      "Erreur calcul inventaire synthèse:",
      error
   );

   return{
      success:false,
      error:error.message
   }
 }

}
//============================================= STOCKS / INVENTAIRE SYNTHÉTIQUE END ===============================================

//============================================= RAPPORT START ===============================================
rapportPeriodique = (app) =>{
    app.get('/rapportPeriodique', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        const section = splitDateRange('2026-03-01', '2026-05-20', 5)
        const infos = await Promise.all(section.map(async (date) => {
            const [recettesBarSimple,recettesVip,recettesCrazyClub,recettesSalonPrive,recettesAppartement,
                recettesMaisonClose, recettesCuisine, ConsommationParType, DepensesParCategorie
            ] = await Promise.all(
                [
                    calculerRecettesBarSimple(date.debut, date.fin),
                    calculerRecettesVip(date.debut, date.fin),
                    calculerRecettesCrazyClub(date.debut, date.fin),
                    calculerRecettesSalonPrive(date.debut, date.fin),
                    calculerRecettesAppartement(date.debut, date.fin),
                    calculerRecettesMaisonClose(date.debut, date.fin),
                    calculerRecettesCuisine(date.debut, date.fin),
                    calculerConsommationParType(date.debut, date.fin),
                    calculerDepensesParCategorie(date.debut, date.fin),
                    // calculerDette(date.debut, date.fin)
                ]
            )

            const recetteGlobale = extraireSommeRecettesManquant([recettesBarSimple,recettesVip,recettesCrazyClub,recettesSalonPrive,recettesAppartement,recettesMaisonClose, recettesCuisine, ConsommationParType, DepensesParCategorie]);
            const stocks = await calculerInventaireSynthese(date.debut, date.fin);

            const resum ={periodeD: format(parseISO(date.debut), 'dd-MM-yyyy'),
                periodeF: format(parseISO(date.fin), 'dd-MM-yyyy'),
                recettesBarSimple, recettesVip, recettesCrazyClub, recettesSalonPrive, recettesAppartement, recettesMaisonClose, recettesCuisine, ConsommationParType, DepensesParCategorie,
                recetteGlobale, stocks
            }

            return resum
            
        }))

        res.status(200).render('rapportPeriodique', {infos, msg: req.query.msg, tc: req.query.tc})
        
        //  res.json(infos)
    })
}
 
//============================================= RAPPORT END ===============================================

module.exports = {
    rapportPeriodique,
}