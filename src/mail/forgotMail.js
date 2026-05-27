const crypto = require('crypto'); // Module natif de Node.js
const { Personnel } = require('../db/sequelize');
const bcrypt = require('bcrypt')
const {sendAlert} = require('./email')
const {Op} = require('sequelize');
const { promisify } = require('util');
const inlineCss = require('inline-css');

// Route : POST /forgot-password 

forgotPassword = (app) =>{
    app.post('/forgotPassword',async (req, res) => {
        const {email} = req.body;

        try {
            const user = await Personnel.findOne({ where: { email: email } });
            if (!user) {
                return res.redirect("/notFound?msg=email");
            }

            // 1. Créer un token aléatoire
            const token = crypto.randomBytes(32).toString('hex');
            
            // 2. Définir une expiration (ex: 1 heure)
            const expiration = new Date(Date.now() + 1000 * 60 * 15); 

            // 3. Sauvegarder dans la DB
            await user.update({ 
                resetToken: token,
                resetTokenExpiration: expiration
            });

            // 4. Envoyer l'email
            const link = `/resetPasswordForm/${token}`; //http://localhost:3000
            const message = `
                <html>
                <head>
                <style>
                    body {
                    margin: 0;
                    padding: 0;
                    background: #f4f6f8;
                    font-family: Arial, sans-serif;
                    }

                    .wrapper {
                    width: 100%;
                    padding: 20px;
                    }

                    .card {
                    max-width: 500px;
                    margin: auto;
                    background: #ffffff;
                    border-radius: 10px;
                    padding: 25px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                    }

                    .title {
                    text-align: center;
                    color: #0d6efd;
                    margin-bottom: 20px;
                    }

                    .text {
                    color: #555;
                    font-size: 14px;
                    line-height: 1.5;
                    }

                    .btn {
                    display: inline-block;
                    margin: 20px 0;
                    padding: 12px 20px;
                    background: #0d6efd;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    }

                    .footer {
                    font-size: 12px;
                    color: #999;
                    text-align: center;
                    margin-top: 20px;
                    }
                </style>
                </head>

                <body>

                <div class="wrapper">
                    <div class="card">

                    <h2 class="title">🔐 Réinitialisation du mot de passe</h2>

                    <p class="text">
                        Vous avez demandé la réinitialisation de votre mot de passe.
                    </p>

                    <div style="text-align:center;">
                        <a href="${link}" class="btn">
                        Réinitialiser mon mot de passe
                        </a>
                    </div>

                    <p class="text">
                        Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.
                    </p>

                    <p class="footer">
                        Ce lien expire dans 15 minutes.
                    </p>

                    </div>
                </div>

                </body>
                </html>
            `;
            // const inlineCssAsync = promisify(inlineCss);

            const finalHtml = await inlineCss(message, {
                url: ' '
            });

            await sendAlert([user.email], finalHtml, "Réinitialisation de mot de passe", "One Love");

            return res.redirect("/notFound?msg=envoyer");
        } catch (error) {
            return res.redirect("/notFound?msg=serveur");
        }
    });

}

// Route : GET /reset-password/:token
resetPasswordForm = (app) => {

    app.get('/resetPasswordForm/:token',async (req, res) => {
        const { token } = req.params;
        //========================================
        const user = await Personnel.findOne({
            where: {
            resetToken: token,
            resetTokenExpiration: {
                [Op.gt]: new Date()
            }
            }
        });

        if (!user) {
            return res.redirect("/notFound?msg=invalide");
        }

        res.render('restPwdEmail', { token:token, msg: req.query.msg });
        //==========================================
    });
}

// Route : POST /reset-password/:token
resetPassword = (app) => {

    app.post('/resetPassword/:token',async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;

        try {
            // Trouver l'utilisateur avec ce token ET vérifier si l'heure n'est pas passée
            const user = await Personnel.findOne({ 
                where: { 
                    resetToken: token,
                    resetTokenExpiration: { [Op.gt]: new Date() } // Op.gt veut dire "plus grand que maintenant"
                } 
            });

            if (!user) {
                return res.redirect("/notFound?msg=invalide");
            }

            // Mettre à jour le mot de passe (pense à le hasher avec bcrypt !)
            user.mdp = await bcrypt.hash(password, 10);
            user.resetToken = null; // On efface le token
            user.resetTokenExpiration = null;
            await user.save();

            return res.redirect("/notFound?msg=mdpsuccess");
        } catch (error) {
            console.error(error);
            return res.redirect("/notFound?msg=serveur");
        }
    });

}

module.exports = { forgotPassword, resetPassword, resetPasswordForm };