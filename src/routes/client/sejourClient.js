const {Client, Appartement, AppartJournal, sequelize, PaiementSejourAppart} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

addSejour = (app) =>{
    app.post('/addSejour', protrctionRoot, authorise('admin', 'comptable', 'caissier'), async (req, res) => {
        try{
            const {loyer, nuiter, id_appart, commentaire, date_debut, date_fin_prevue, date_fin_reel, id_client} = req.body;
            if(date_debut > date_fin_prevue || date_debut > date_fin_reel || date_fin_prevue > date_fin_reel){
                return res.redirect(`/formAddClient?msg=Operarion Echouer. La date de debut doit etre inférieure a la date de fin. Et la date de fin doit etre inférieure a la date de fin réel&tc=alert-warning`);
            }
            const newSejour = await AppartJournal.create({
                date_debut:date_debut,
                date_fin_reel: date_fin_reel,
                date_fin: date_fin_prevue,
                loyer: loyer,
                nuiter:nuiter || 0,
                id_appart:id_appart,
                id_client:id_client,
                commentaire: commentaire
            })
            if(newSejour){
                msg=`Séjour ajouter avec succès pour le client`
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

allSejour = (app) => {
    app.get('/allSejour', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'),async (req, res) => {
        try{
            const allSejours = await AppartJournal.findAll({
                include:[
                    {model:Appartement, where: {is_active: true}, required: true},
                    {model:Client, where: {is_active: true}, required: true}
                ],
                where: {is_active: true},
                order:[['id_journal', 'DESC']]
            })
            if(allSejours){
                res.status(200).render('sejourClient', {msg: req.query.msg, tc:req.query.msg})
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

updateSejour = (app) => {
    app.put('/updateSejour/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'),async (req, res) => {
        try{
            const updateSejours = await AppartJournal.update(req.body, {
                where: {id_journal: req.params.id}
            })
            if(updateSejours){
                res.status(200).redirect('/histOpClient?msg=Mise a jour effectuer avec succes&tc=alert-success')
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

deleteSejour = (app) => {
    app.delete('/deleteSejour/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), async (req, res) => {
        try{
            const t = await sequelize.transaction()
            await AppartJournal.update({
                is_active: false
            },{where: {id_journal: req.params.id}, transaction:t})

            await PaiementSejourAppart.update({
                is_active: false
            },{where: {id_journal: req.params.id}, transaction:t})

            await t.commit()

            res.redirect('/histOpClient?msg=Suppression du sejour avec succes&tc=alert-success');
        }
        catch(e){
            console.error(e);
            await t.rollback()
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

module.exports = {
    allSejour,
    addSejour,
    deleteSejour,
    updateSejour
}