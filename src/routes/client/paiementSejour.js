const {Client, Appartement, AppartJournal, sequelize, PaiementSejourAppart} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

addPaiementSejour = (app) =>{
    app.post('/addPaiementSejour', protrctionRoot, authorise('admin', 'comptable', 'caissier'), async (req, res) => {
        try{
            const newPaieentSejour = await PaiementSejourAppart.create(req.body)
            if(newPaieentSejour){
                msg=`Paiement ajouter avec succès`
                res.status(200).redirect(`/formAddClient?msg=${msg}&tc=alert-success`)
            }else{
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            }
        }catch (e){
            console.error(e);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
        
    })
}

allPaiementSejour = (app) => {
    app.get('/allPaiementSejour', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'),async (req, res) => {
        try{
            const allPaiementSejour = await PaiementSejourAppart.findAll({
                include:[
                    {
                        model:AppartJournal, where: {is_active: true}, required: true,
                        include:[
                            {model:Appartement, where: {is_active: true}, required: true},
                            {model:Client, where: {is_active: true}, required: true}
                        ]
                    },
                ],
                where: {is_active: true},
                order:[['id_journal', 'DESC']]
            })
            if(allPaiementSejour){
                res.status(200).render('sejourClient', {msg, tc:'alert-success'})
            }else{
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            }
        }catch (e){
            console.error(e);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}


deletePaiementSejour = (app) => {deletePaiementSejour
    app.delete('/deletePaiementSejour/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try{
            await PaiementSejourAppart.update({
                is_active: false
            },{where: {id_pais: req.params.id}})

            res.redirect('/histOpClient?msg=Suppression du paiement avec succes&tc=alert-success');
        }
        catch(e){
            console.error(e);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

module.exports = {
    addPaiementSejour,
    allPaiementSejour,
    deletePaiementSejour
}