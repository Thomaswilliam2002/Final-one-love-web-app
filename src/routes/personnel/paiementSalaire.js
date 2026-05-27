const express = require('express');
const router = express.Router();
const { PaiementSalaire, AvanceSalaire, Salaire } =require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

// 1. CREATE - Enregistrer un paiement de salaire
addPSalaire = (app) => {
    app.post('/addPSalaire', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            //==========================================================================
            //verification
            const salaire = await Salaire.findByPk(req.body.id_salaire)
            
            if(!salaire) return res.redirect(`/formSalaireAndPaiement?msg=L'Operarion n'a pas pu etre effectuers. Salaire introuvable&tc=alert-danger`);

            const sumAvence = await AvanceSalaire.sum('montant', {
                where:{is_active: true, id_salaire: salaire.id_salaire}
            })

            const sumPaie = await PaiementSalaire.sum('montant', {
                where:{is_active: true, id_salaire: salaire.id_salaire}
            })

            const som = sumAvence + sumPaie

            let msg = "Impossible d'effectuer cette opperation\n"

            if(som === salaire.montant_net ){
                msg += "Le salaire est deja Payer\n"
            }else if(som + parseFloat(req.body.montant) > salaire.montant_net){
                msg += `Vous avez deja payer ${som} sur ${salaire.montant_net}. Il ne vous reste que ${salaire.montant_net - som} a payer pour le salaire qui couvre la periode de ${salaire.debut_periode} au ${salaire.fin_periode}, au lieux de ${req.body.montant}`
            }else if (som + parseFloat(req.body.montant) <= salaire.montant_net ){
                msg = "Opperation effectuer avec success\n"
                const nouveauPSalaire = await PaiementSalaire.create(req.body);
                if (som + parseFloat(req.body.montant) === salaire.montant_net ){
                    msg = "Le salaire vient d'etre Payer en integraliter\n"
                    await salaire.update({status: 'Payer'})
                    return res.redirect(`/formSalaireAndPaiement?msg=${msg}&tc=alert-success`);
                }
                return res.redirect(`/formSalaireAndPaiement?msg=${msg}&tc=alert-success`);
            }
            res.redirect(`/formSalaireAndPaiement?msg=${msg}&tc=alert-danger`);
            //============================================================================
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

deletePSalaire = (app) => {
    app.delete('/deletePSalaire/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const result = await PaiementSalaire.update(
                { is_active: false },
                { where: { id_paisal: req.params.id } }
            );
            
            if (result[0] > 0) {
                res.redirect('/allSalaire?mag=Paiement Salaire supprimer avec seccess&tc=alert-success');
            } else {     
                res.redirect('/allSalaire?mag=L\'opperation n\a pas pu etre effecruer&tc=alert-dabger');
            }
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

module.exports = {
    addPSalaire, deletePSalaire
};