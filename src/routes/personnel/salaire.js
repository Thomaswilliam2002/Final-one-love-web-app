const { Salaire, Personnel, Poste, Occupe, PaiementSalaire, AvanceSalaire, sequelize } = require('../../db/sequelize');
const {protrctionRoot, authorise} = require('../../middleware/protectRoot');

// 1. CREATE - Enregistrer un paiement de salaire
addSalaire = (app) => {
    app.post('/addSalaire', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            if(req.body.debut_periode > req.body.fin_periode){
                return res.redirect(`/formSalaireAndPaiement?msg=Operarion Echouer. La date de debut doit etre inférieure a la date de fin&tc=alert-danger`);
            }

            const nouveauSalaire = await Salaire.create(req.body) 
            res.redirect(`/formSalaireAndPaiement?msg=Operarion effectuer avec success&tc=alert-success`);
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

formOpSalaire = (app) =>{
    app.get('/formOpSalaire/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) =>{
        try{
            const personnel = await Occupe.findOne({
                include: [
                    {model: Personnel, where: {is_active: true, id_personnel: req.params.id}, required: true},
                    {model: Poste, where: {is_active: true}, required: true}
                ],
                where: {is_active: true},
                order:[['id_occupe', 'DESC']]
            })

            const allSalaires = await Salaire.findAll({where: {is_active: true, id_occupe: personnel.id_occupe, id_personnel: personnel.Personnel.id_personnel, status: 'EN COURS'}})
            res.status(200).render('operationSurSalaire', {personnel, allSalaires, msg: req.query.msg, tc: req.query.tc})
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    })
}

formSalaireAndPaiement = (app) =>{
    app.get('/formSalaireAndPaiement', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try{
            const personnels =  await Occupe.findAll({
                include: [
                    {model: Personnel, where: {is_active: true}, required: false},
                    {model: Poste, where: {is_active: true}, required: false}
                ],
                where: {is_active: true},
                order:[['id_occupe', 'DESC']]
            })
            res.status(200).render('formSalaireAndPaiement', {personnels, msg: req.query.msg, tc: req.query.tc})
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    })
}

// 2. READ ALL - Liste des salaires payés (avec détails personnel et poste)
allSalaire = (app) => {
    app.get('/allSalaire', protrctionRoot, authorise('admin', 'comptable', 'caissier central'), async (req, res) => {
        try {
            const [salaires, paiementSalaires, avanceSalaires] = await Promise.all([
                Salaire.findAll({
                    where: { is_active: true },
                    include: [
                        {
                            model: Personnel,
                        },
                        {
                            model: Occupe,
                            include: [
                                {
                                    model: Poste,
                                }
                            ],
                        }
                    ],
                    order: [['created', 'DESC']] // Plus récent en premier
                }),

                PaiementSalaire.findAll({
                    where: { is_active: true },
                    include: [
                        {
                            model: Salaire,
                            include: [
                                {
                                    model: Personnel,
                                },
                                {
                                    model: Occupe,
                                    include: [
                                        {
                                            model: Poste,
                                        }
                                    ],
                                }
                            ],
                        }
                    ],
                    order: [['created', 'DESC']] // Plus récent en premier
                }),

                AvanceSalaire.findAll({
                    where: { is_active: true },
                    include: [
                        {
                            model: Salaire,
                            include: [
                                {
                                    model: Personnel,
                                },
                                {
                                    model: Occupe,
                                    include: [
                                        {
                                            model: Poste,
                                        }
                                    ],
                                }
                            ],
                        }
                    ],
                    order: [['created', 'DESC']] // Plus récent en premier
                })
            ])
            res.render('histeOperationSalaire', {salaires, paiementSalaires, avanceSalaires,msg: req.query.msg, tc: req.query.tc});
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// 4. UPDATE - Modifier un enregistrement de salaire
updateSalaire = (app) => {
    app.put('/updateSalaire/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const [updated] = await Salaire.update(req.body, {
                where: { id_salaire: req.params.id }
            });
            if (!updated) return res.redirect('/allSalaire?mag=L\'opperation n\a pas pu etre effecruer&tc=alert-dabger');
            res.redirect('/allSalaire?mag=Salaire mise a jour avec seccess&tc=alert-success');
        } catch (error) {
            console.error(error);
            res.redirect('/notFound');
        }
    });
}

// 5. DELETE - Suppression Logique
deleteSalaire = (app) => {
    app.delete('/deleteSalaire/:id', protrctionRoot, authorise('admin', 'comptable'), async (req, res) => {
        try {
            const t = await sequelize.transaction()
            //verifier si le salaire existe
            const existe = await Salaire.findByPk(req.params.id)
            if(!existe) return res.redirect('/allSalaire?mag=L\'opperation n\a pas pu etre effecruer&tc=alert-dabger');

            //desactiver les paiement salaire et avance salaire associer
            const paies = PaiementSalaire.update(
                { is_active: false },
                { where: { id_salaire: req.params.id }, transaction: t},
            );

            const avance = AvanceSalaire.update(
                { is_active: false },
                { where: { id_salaire: req.params.id }, transaction: t},
            );

            const result = await Salaire.update(
                { is_active: false },
                { where: { id_salaire: req.params.id }, transaction: t},
            );

            await t.commit();
            
            if (result[0] > 0) {
                res.redirect('/allSalaire?mag=Salaire supprimer avec seccess&tc=alert-success');
            } else {
                res.redirect('/allSalaire?mag=L\'opperation n\a pas pu etre effecruer&tc=alert-dabger');
            }
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.redirect('/notFound');
        }
    });
}

module.exports = {
    addSalaire, allSalaire, updateSalaire, deleteSalaire, formSalaireAndPaiement, formOpSalaire
};