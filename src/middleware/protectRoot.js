const {Personnel} = require('../db/sequelize');

const protrctionRoot = async (req, res, next) =>{
    if(!req?.session?.user){
        return res.redirect('/login')
    }

    const personnel = await Personnel.findOne({
        where: {id_personnel: req.session.user.Personnel.id_personnel}
    })

    const userValid = personnel.validation //req.session?.user?.Personnel.validation;
    if(!userValid){
        // return res.status(403).json({message: 'compte non valider'})
        return res.redirect('/validation')
    }
    next();
}

//verifier si le role est aitoriser
const authorise = (...roles) =>{
    return (req, res, next) => {
        const userRole = req.session?.user?.Personnel.type_personnel;
        if(!roles.includes(userRole)){
            if(req.path === '/index'){
                return res.redirect('/onePersonnel/' + req.session.user.Personnel.id_personnel)
            }
            return res.status(403).json({message: 'acces reffuser'})
        } 
        next();
    };
}

const infos = (req, res, next) => {
    res.locals.user = req.session.user
    //console.log(res.locals.idUser)
    next();
}

module.exports = {protrctionRoot,authorise, infos};