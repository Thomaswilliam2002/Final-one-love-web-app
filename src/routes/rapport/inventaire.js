const {Caisse,sequelize, Personnel, Produit, HistSortie, HistCaisse, HistEntrer, Emballage} = require('../../db/sequelize')
const {fn, col, literal, Op, where} = require('sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

inventaire = (app) => {
    app.get('/inventaire', protrctionRoot, authorise('admin', 'comptable', 'caissier central', 'caissier'), async (req, res) => {
        try {
          let caisses
            //recuperer et verrifier le type
            if(req?.query?.type && req?.query?.type === 'caissier' && req?.query?.id){
              caisses = await Caisse.findAll({
                include: [{
                    model: Personnel,
                    required: true,
                    where: { is_active: true },
                    through: { attributes: ['id_personnel', 'id_caisse'], where: { is_active: true, id_personnel: req?.query?.id }  } 
                }],
                where: { is_active: true },
                order: [['id_caisse', 'DESC']]
              });
              return res.status(200).render('inventaire' , {msg: req.query.msg, tc: req.query.tc, caisses})
            }

            // Récupération des caisses avec leurs caissiers
            caisses = await Caisse.findAll({
              include: [{
                  model: Personnel,
                  required: false,
                  where: { is_active: true },
                  through: { attributes: ['id_personnel', 'id_caisse'], where: { is_active: true }  } 
              }],
              where: { is_active: true },
              order: [['id_caisse', 'DESC']]
            });
            
            res.status(200).render('inventaire' , {msg: req.query.msg, tc: req.query.tc, caisses})

        } catch (err) {
            console.error("Erreur dans l'envois des rapport:", err);
            res.redirect('/notFound');
        }
        
    })
}

mackeInventaire = (app) => {
  app.post(
    '/mackeRapport',
    protrctionRoot,
    authorise('admin', 'comptable', 'caissier central', 'caissier'),
    async (req, res) => {
      try {

        // =========================================================
        // 1. RÉCUPÉRATION DES DONNÉES DU BODY
        // =========================================================
        const {
          caisse,
          date_debut,
          date_fin,
          heure_debut,
          heure_fin,
          cyble
        } = req.body;

        const model = cyble === 'emballage' ? Emballage : Produit;
        const idField = cyble === 'emballage' ? 'id_emballage' : 'id_produit';

        if (!caisse || !date_debut || !date_fin || !heure_debut || !heure_fin || !cyble) {
          return res.json({
            msg: "Veuillez renseigner toutes les informations",
            type: "error"
          });
        }

        // =========================================================
        // 2. CONSTRUCTION DES BORNES TEMPORELLES (IMPORTANT)
        // =========================================================
        const debut = new Date(`${date_debut}T${heure_debut}`);
        const fin = new Date(`${date_fin}T${heure_fin}`);

        // =========================================================
        // 3. RÉCUPÉRATION DES PRODUITS CONCERNÉS
        // =========================================================
        const mouvements = await HistSortie.findAll({
          attributes: ['id_probal'],
          where: {
            is_active: true,
            type: cyble,
            id_caisse: caisse
          },
          group: ['id_probal'],
          raw: true
        });

        if (mouvements.length === 0) {
          return res.json({
            msg: "Aucun mouvement trouvé pour cette caisse",
            type: "warning"
          });
        }

        const productIds = mouvements.map(m => m.id_probal);

        // =========================================================
        // 4. RÉCUPÉRATION DES DÉTAILS PRODUITS
        // =========================================================
        const produits = await model.findAll({
          where: {
            is_active: true,
            [idField]: productIds
          },
          raw: true
        });

        // =========================================================
        // 5. AGRÉGATIONS STOCK
        // =========================================================

        // -------- ENTRÉES AVANT PÉRIODE --------
        const entreesAvant = await HistSortie.findAll({
          attributes: [
            'id_probal',
            [fn('SUM', col('quantiter')), 'total']
          ],
          where: {
            is_active: true,
            type: cyble,
            id_caisse: caisse,
            created: { [Op.lt]: debut }
          },
          group: ['id_probal'],
          raw: true
        });

        // -------- VENTES AVANT PÉRIODE --------
        const ventesAvant = await HistCaisse.findAll({
          attributes: [
            'id_probal',
            [fn('SUM', col('quantiter')), 'total']
          ],
          where: {
            is_active: true,
            id_caisse: caisse,
            created: { [Op.lt]: debut }
          },
          group: ['id_probal'],
          raw: true
        });

        // -------- ENTRÉES PÉRIODE --------
        const entreesPeriode = await HistSortie.findAll({
          attributes: [
            'id_probal',
            [fn('SUM', col('quantiter')), 'total']
          ],
          where: {
            is_active: true,
            type: cyble,
            id_caisse: caisse,
            created: { [Op.between]: [debut, fin] }
          },
          group: ['id_probal'],
          raw: true
        });

        // -------- VENTES PÉRIODE --------
        const ventesPeriode = await HistCaisse.findAll({
          attributes: [
            'id_probal',
            [fn('SUM', col('quantiter')), 'total']
          ],
          where: {
            is_active: true,
            id_caisse: caisse,
            created: { [Op.between]: [debut, fin] }
          },
          group: ['id_probal'],
          raw: true
        });

        // =========================================================
        // 6. CONVERSION EN MAPS (OPTIMISATION)
        // =========================================================
        const toMap = (arr) => {
          const map = {};
          arr.forEach(i => {
            map[i.id_probal] = parseFloat(i.total || 0);
          });
          return map;
        };

        const mapEntreeAvant = toMap(entreesAvant);
        const mapVenteAvant = toMap(ventesAvant);
        const mapEntreePeriode = toMap(entreesPeriode);
        const mapVentePeriode = toMap(ventesPeriode);

        // =========================================================
        // 7. CONSTRUCTION INVENTAIRE FINAL
        // =========================================================
        const rapportComplet = await Promise.all(produits.map(async (prod) => {
          const id = prod[idField];

          

        // --- C. PRIX ET STOCK FINAL ---
        // On récupère le dernier prix unitaire pratiqué dans les sorties vers cette caisse
        const lastPrice = await HistSortie.findOne({
            where: { id_probal: id, id_caisse: caisse, type: cyble },
            order: [['created', 'DESC']],
            attributes: ['prix_unit']
        });

        //on récupère le dernier prix unitaire pratiqué dans les entree pour ce produit
        const lastPrixAchat = await HistEntrer.findOne({
            where: { id_probal: id, type: cyble },
            order: [['created', 'DESC']],
            attributes: ['prix_unit']
        });


          // STOCK INITIAL = Entrées passées - Ventes passées
          const stock_initial =
            (mapEntreeAvant[id] || 0) -
            (mapVenteAvant[id] || 0);

          // MOUVEMENTS PÉRIODE
          const entree = mapEntreePeriode[id] || 0;
          const vente = mapVentePeriode[id] || 0;

          // STOCK FINAL
          const stock_final = stock_initial + entree - vente;

          return {
            id_produit: prod.slug_id || id,
            nom_produit: prod.nom,
            stock_initial,
            entree,
            vente,
            prix_unitaire: lastPrice?.prix_unit || 0,
            prix_unitaire_achat: lastPrixAchat?.prix_unit || 0,
            stock_final,
            description: prod.description || "",
            observations: stock_final <= (prod.seuil || 0)
              ? "⚠️ Seuil atteint"
              : "ghbejhrgbjerht htbhj terhtbw tewtt wtwywtwy"
          };
        }));

        // =========================================================
        // 8. TRI FINAL (Alphabétique)
        // =========================================================
        rapportComplet.sort((a, b) =>
          a.nom_produit.localeCompare(b.nom_produit)
        );

        // =========================================================
        // 9. ENVOI À LA VUE
        // =========================================================
        return res.json({
          inventaire: rapportComplet,
          periode: {debut: debut, fin: fin},
          msg: 'Inventaire effectué',
          type: 'success'
        });

      } catch (err) {
        console.error("Erreur génération rapport:", err);
        return res.redirect('/notFound');
      }
    }
  );
};

module.exports = {
  inventaire, mackeInventaire
}