const {Client, Appartement, AppartJournal, sequelize, PaiementSejourAppart} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

formAddClient = (app) =>{
    app.get('/formAddClient', protrctionRoot, authorise('admin', 'gerant', 'comptable', 'caissier'), async (req, res) => {
        const appartements = await Appartement.findAll({where: {is_active: true}});
        const allClients = await Client.findAll({where: {is_active: true}})
        const allSejours = await AppartJournal.findAll({
            include:[
                {model:Appartement, where: {is_active: true}, required: true},
                {model:Client, where: {is_active: true}, required: true}
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
        if(appartements){
            res.status(200).render('add-client', {appartements, allClients, allSejours, msg: req.query.msg, tc: req.query.tc})
        }else{
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
        
    })
}
 
allClient = (app) => {
    app.get('/allClient', protrctionRoot, authorise('admin', 'comptable', 'caissier', 'caissier central'), (req, res) => {
        Client.findAll({
            where: {is_active: true},
            order:[['id_client', 'DESC']]
        })
            .then(clients => {
                AppartJournal.findAll({
                    include:[
                        {model:Appartement, where: {is_active: true}, required: true}
                    ],
                    where: {is_active: true},
                    order:[['id_journal', 'DESC']]
                })
                    .then(appj =>{
                        res.status(200).render('client-list', {clients: clients,msg: req.query.msg, japparts: appj, tc: req.query.tc});
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

addClient = (app) => {
    app.post('/addClient', protrctionRoot, authorise('admin', 'comptable', 'caissier'), async (req, res) => {
        try{
            const {nom, prenom, numero, commentaire,} = req.body;
            const cli = await Client.findOne({
                where:{nom_client: nom,
                    prenom_client:prenom
                }
            })
            if(cli){
                res.redirect('/allClient?msg=Le client que vous tenter d\'enregistrer existe deja.Ajouter lui un sejour si besoin.&tc=alert-warning');        
            }else{
                const client = await Client.create({
                    nom_client: nom,
                    prenom_client: prenom,
                    numero_client: numero,
                    comentaire_client: commentaire
                })
                if(client){
                    res.redirect('/allClient?msg=Client ajouter avec succes&tc=alert-success');
                }
            }
        }catch (e){
            console.error(e);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
        
    })
}

deleteClient = (app) => {
    app.delete('/deleteClient/:id', protrctionRoot, authorise('admin', 'comptable', 'caissier'), async (req, res) => {
        try{
            const t = await sequelize.transaction();
            Client.update({is_active: false}, {where: {id_client: req.params.id}, transaction: t});
            await AppartJournal.update({is_active: false}, {where: {id_client: req.params.id, is_active: true}, transaction: t});

            await t.commit();

            res.redirect('/allClient?msg=Suppression de client avec succes&tc=alert-success');
        }
        catch(e){
            console.error(e);
            await t.rollback();
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

histOpClient = (app) =>{
    app.get('/histOpClient', protrctionRoot, authorise('admin', 'comptable', 'caissier'), async (req, res) => {
        try{
            const [paiementSejoures, allSejours] = await Promise.all([
                PaiementSejourAppart.findAll({
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
                }),
                AppartJournal.findAll({
                    include:[
                        {model:Appartement, where: {is_active: true}, required: true},
                        {model:Client, where: {is_active: true}, required: true}
                    ],
                    where: {is_active: true},
                    order:[['id_journal', 'DESC']]
                })
            ])

            const AppartJournalEnrichies = await Promise.all(allSejours.map(async (a) => {
                const json = a.toJSON();
                const sumP = await PaiementSejourAppart.sum('montant',{where: {is_active: true, id_journal: a.id_journal}})

                json.deja_payer = sumP 
                const reste = a.loyer - sumP
                json.reste = reste

                return json;
            }))

            res.status(200).render('histOperationClient', {paiementSejoures, AppartJournalEnrichies, msg: req.query.msg, tc: req.query.tc})
        }
        catch(e){
            console.error(e);
            res.redirect('/notFound');
            return; // On stoppe tout ici !
        }
    })
}

module.exports = {
    allClient,
    addClient,
    deleteClient,
    formAddClient,
    histOpClient
}