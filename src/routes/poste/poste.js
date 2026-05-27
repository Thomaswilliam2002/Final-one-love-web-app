const {Poste, Personnel, sequelize, Occupe} = require('../../db/sequelize')
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');
const { Op } = require('sequelize')

allPoste = (app) => {
    app.get('/allPoste', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), (req, res) => {
        Poste.findAll({
            where:{is_active: true},
            order:[['id_poste', 'DESC']]
        })
            .then(postes => {
                const msg = "Liste recuperer avec succes"
                //res.json({msg, data: postes})
                res.status(200).render('poste', {postes: postes, msg: req.query.msg, tc:req.query.tc});
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

onePoste = (app) => {
    app.get('/onePoste/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        Poste.findByPk(req.params.id)
            .then(poste => {
                const msg = "personnel recuperer avec succes"
                res.json({msg, data: poste})
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

addPoste = (app) => {
    app.post('/addPoste', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, salaire, desc} = req.body
        const np = nom?.trim().toLowerCase() || "";
        Poste.create({
            nom_poste: np,
            salaire: salaire,
            description: desc 
        })
            .then(poste => {
                const msg = "le Poste " + req.body.nom + "a ete ajouter avec succes"
                //res.json({msg, data: poste})
                res.redirect('allPoste?msg=' + msg);
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

updatePoste = (app) => {
    app.put('/updatePoste/:id', protrctionRoot, authorise('admin', 'comptable'), (req, res) => {
        const {nom, salaire, desc} = req.body;
        const np = nom?.trim().toLowerCase() || "";
        Poste.update({
            nom_poste: np,
            salaire: salaire,
            description: desc 
        },{
            where: {id_poste: req.params.id}
        })
            .then(_ => {
                res.redirect('/allPoste?msg=Poste modifier avec succès&tc=alert-success');
            })
            .catch(_ => {
                console.error(_);
                res.redirect('/notFound');
                return; // On stoppe tout ici !
            })
    })
}

deletePoste = (app) => {
    app.delete('/deletePoste/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        let t;

        try {

            t = await sequelize.transaction();

            // récupérer les personnels occupant ce poste
            const occupe = await Occupe.findAll({
                include: [{
                    model: Personnel,
                    attributes: ['id_personnel'],
                    where: { is_active: true },
                    required: true
                }],
                where: { id_poste: req.params.id },
                transaction: t
            });

            const tabPersonnel = occupe.map(o => o.Personnel.id_personnel);

            // désactiver les occupations
            await Occupe.update(
                { is_active: false },
                { where: { id_poste: req.params.id }, transaction: t }
            );

            // désactiver les personnels
            if (tabPersonnel.length > 0) {
                await Personnel.update(
                    { is_active: false },
                    {
                        where: { id_personnel: { [Op.in]: tabPersonnel } },
                        transaction: t
                    }
                );
            }

            await t.commit();

            res.redirect('/allPoste?msg=Poste supprimer avec succes&tc=alert-success');

        } catch (error) {

            console.error(error);

            if (t) await t.rollback();

            res.redirect('/notFound');
        }
    })
}

module.exports = {
    allPoste,
    onePoste,
    addPoste,
    updatePoste,
    deletePoste
}