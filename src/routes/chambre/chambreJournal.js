const {ChambreJournal, MaisonColse, Chambre} = require('../../db/sequelize')

allChJournal = (app) => {
    app.get('/allChJournal', (req, res) => {
        ChambreJournal.findAll({
            include:[
                {model: MaisonColse, required: false, where: {is_active: true}},
                {model: Chambre, required: false, where: {is_active: true}}
            ],
            where: {is_active: true},
            order:[['id_journal', 'DESC']]
        })
            .then(chambreJournals => {
                // const msg = "Liste recuperer avec succes"
                // res.json({msg, data: chambreJournals})
                //console.log(chambreJournals)
                res.status(200).render('histMClose', {journals:chambreJournals, msg: req.query.msg, indice: req.query.indice})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

oneChJournal = (app) => {
    app.get('/oneChJournal/:id', (req, res) => {
        ChambreJournal.findByPk(req.params.id)
            .then(chambreJournal => {
                const msg = "chambre Journal recuperer avec succes"
                res.json({msg, data: chambreJournal})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addChJournal = (app) => {
    app.post('/addChJournal', (req, res) => {
        const {mclose1, chambre2, montant, date, commentaire, manquant} = req.body;
        ChambreJournal.create({
            loyer:montant,
            motif: '',
            description: commentaire,
            date: date,
            id_chambre: chambre2,
            id_mclose: mclose1,
            manquant: manquant,
        })
            .then(chambreJournal => {
                res.redirect('/formFondBarClub?msg=Journal ajouter avec succes pour la chambre ' + chambre2 + ' et la maison colse ' + mclose1 + '&type=mclose')
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

updateChJournal = (app) => {
    app.put('/updateChJournal/:id', (req, res) => {
        
        ChambreJournal.update(req.body, {
            where: {id: req.params.id}
        })
            .then(_ => {
                const msg = "Modification de chambre Journal avec succes"
                res.json({msg})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deleteChJournal = (app) => {
    app.delete('/deleteChJournal/:id_j/:id_ch/:id_mc', async (req, res) => {
        try{
            await ChambreJournal.update({is_active: false}, {where: {id_journal: req.params.id_j}});
            if(req.query.sender === 'profil'){
                res.redirect('/oneChambre/' + req.params.id_ch + '/' + req.params.id_mc)
            }else if(req.query.sender === 'hist'){
                res.redirect('/allChJournal')
            }
        }catch(_){
            console.log(_)
            res.redirect('/notFound');
            return;
        }
    })
}

module.exports = {
    allChJournal,
    oneChJournal,
    addChJournal,
    updateChJournal,
    deleteChJournal
}