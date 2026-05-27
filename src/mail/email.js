const { CronJob } = require("cron");
const nodemailer = require('nodemailer');
const { Produit, Emballage, Notification, sequelize, ReadNotification, Personnel, Occupe, Poste } = require('../db/sequelize');
const { where, Op } = require("sequelize");
const puppeteer = require('puppeteer');
require('dotenv').config();
// --- 1. FONCTION D'ENVOI (MOTEUR) ---
const sendAlert = async (emails, message, sujet, from) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_HOST_USER,
          pass: process.env.EMAIL_HOST_PASSWORD        // TON PASS MAILTRAP (Vérifie bien ces 2 codes sur Mailtrap !)
        }
    });

    const mailOptions = {
        from: from, //"One Love Test" <test@onelove.com>
        to: emails.join(','),
        subject: sujet, //,
        html: message
    };

    try {
        await transporter.sendMail(mailOptions);
        // console.log("✅ Email envoyé à Mailpit !");
    } catch (error) {
        console.error("❌ Erreur d'envoi SMTP :", error.message);
    }
};

// --- 2. LOGIQUE DE SURVEILLANCE (CRON) ---
const admins = ["email@test.com"];

const buildStockEmail = (produits, emballages, pdfUrl, print=false) => {

    const renderRows = (items) => {
        return items.map(item => `
            <tr style="border-bottom:1px solid #dee2e6;">
                <td style="padding:10px; font-size:14px;">${item.nom}</td>
                <td style="padding:10px; text-align:center; color:#856404; background:#fff3cd; border-radius:4px;">
                    ${item.seuil}
                </td>
                <td style="padding:10px; text-align:center; font-weight:bold; color:#721c24; background:#f8d7da; border-radius:4px;">
                    ${item.quantiter}
                </td>
            </tr>
        `).join('');
    };

    return `
    <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">
        
        <div style="max-width:700px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">

            <!-- HEADER -->
            <div style="background:#dc3545; color:#ffffff; padding:15px; text-align:center; font-size:18px; font-weight:bold;">
                ⚠️ Alerte de rupture de stock
            </div>

            <div style="padding:20px;">

                <!-- PRODUITS -->
                ${produits.length ? `
                    <h3 style="margin-bottom:10px; color:#343a40;">Produits en alerte</h3>
                    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                        <thead>
                            <tr style="background:#343a40; color:#ffffff;">
                                <th style="padding:10px; text-align:left;">Produit</th>
                                <th style="padding:10px;">Seuil</th>
                                <th style="padding:10px;">Stock actuel</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${produits.length ? renderRows(produits) : `
                                <tr><td colspan="3" style="padding:10px; text-align:center; color:#28a745;">Aucun Produit en Rupture de Stock</td></tr>
                            `}
                        </tbody>
                    </table>
                    ` : `
                    <span></span>
                    `
                }

                <!-- EMBALLAGES -->
                ${emballages.length ? `
                    <h3 style="margin-bottom:10px; color:#343a40;">Emballages en alerte</h3>
                    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                        <thead>
                            <tr style="background:#343a40; color:#ffffff;">
                                <th style="padding:10px; text-align:left;">Emballage</th>
                                <th style="padding:10px;">Seuil</th>
                                <th style="padding:10px;">Stock actuel</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${emballages.length ? renderRows(emballages) : `
                                <tr><td colspan="3" style="padding:10px; text-align:center; color:#28a745;">Aucun Emballage en Rupture de Stock</td></tr>
                            `}
                        </tbody>
                    </table>
                    ` : 
                    `<span></span>`
                }

                <!-- ACTION -->
                ${print ? `
                    <span></span>
                ` : `
                    <div style="text-align:center; margin-top:20px;">
                        <a href="${pdfUrl}" 
                        style="display:inline-block; padding:12px 20px; background:#007bff; color:#ffffff; text-decoration:none; border-radius:5px; font-size:14px;">
                        📄 Télécharger le rapport en PDF
                        </a>
                    </div>
                `}

                ${!produits.length && !emballages.length ? `
                    <div style="text-align:center; margin-top:20px; color:#28a745; font-size:14px;">
                        Aucun produit ou emballage en rupture de stock.
                    </div>
                ` : `
                    <span></span>
                `}

            </div>

            <!-- FOOTER -->
            <div style="background:#f1f1f1; padding:10px; text-align:center; font-size:12px; color:#6c757d;">
                Stock One Love • Notification
            </div>

        </div>
    </div>
    `;
};

stockDown = (app) => {
    app.get('/stock/pdf', async (req, res) => {

        const [produits, emballages] = await Promise.all([
            Produit.findAll({ where: { is_active: true, quantiter: { [Op.lte]: sequelize.col('seuil') }} }),
            Emballage.findAll({
                where: {
                    is_active: true,
                    quantiter: { [Op.lte]: sequelize.col('seuil') }
                }
            })
        ]);
    
        const html = buildStockEmail(produits, emballages, null, true);
    
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
    
        await page.setContent(html);
    
        const pdf = await page.pdf({ 
            format: 'A4',
            printBackground: true, // ✅ Active les couleurs (rouge, gris, etc.)
            displayHeaderFooter: true, // ✅ Active l'en-tête et le pied de page
            margin: {
                top: '60px',    // Espace pour l'en-tête
                bottom: '60px', // Espace pour le pied de page
                left: '20px',
                right: '20px'
            },
            // HTML pour l'en-tête (Bordure haute + Titre)
            headerTemplate: `
                <div style="font-size: 10px; width: 100%; border-bottom: 2px solid #dc3545; padding-bottom: 5px; margin: 0 20px; font-family: Arial;">
                    <span style="color: #dc3545; font-weight: bold;">One Love Stock Management</span> - Rapport d'alerte
                </div>`,
            // HTML pour le pied de page (Pagination + Date)
            footerTemplate: `
                <div style="font-size: 10px; width: 100%; border-top: 1px solid #dee2e6; padding-top: 5px; margin: 0 20px; font-family: Arial; display: flex; justify-content: space-between;">
                    <span>Généré le ${new Date().toLocaleDateString()}</span>
                    <span>Page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
                </div>`
        });
    
        await browser.close();
    
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="stock.pdf"'
        });
    
        res.send(pdf);
    });
}

const stockJob = new CronJob('0 0 * * * *', async () => {
    // console.log("🔍 Vérification des seuils...");

    try {
        const today = new Date().toISOString().split('T')[0];

        const [produits, emballages] = await Promise.all([
            Produit.findAll({ where: { is_active: true, quantiter: { [Op.lte]: sequelize.col('seuil') }, lastCheck: { [Op.lt]: today }} }),
            Emballage.findAll({
                where: {
                    is_active: true,
                    quantiter: { [Op.lte]: sequelize.col('seuil') },
                    lastCheck: { [Op.lt]: today } // Mis en [Op.lt] pour être cohérent avec produits
                }
            })
        ]);

        if (!produits.length && !emballages.length) {
            // console.log("✅ Aucun problème de stock");
            return;
        }

        let msg = "";
        for (const p of produits) msg += `⚠️ Le produit ${p.nom} est en rupture de stock ! Il est actuellement à ${p.quantiter}.\n`;
        for (const e of emballages) msg += `⚠️ L'emballage ${e.nom} est en rupture de stock ! Il est actuellement à ${e.quantiter}.\n`;

        const existe = await Notification.findOne({
            where: { is_active: true, message: msg, date: today }
        });

        if (existe) return;

        //email de toute ceux qui doivent recevoire l'email
        const allReceverEmail = []

        // --- DÉBUT TRANSACTION SÉCURISÉE ---
        await sequelize.transaction(async (t) => {
            const now = new Date();
            // Formatage manuel robuste HH:mm:ss
            const formattedTime = [
                now.getHours().toString().padStart(2, '0'),
                now.getMinutes().toString().padStart(2, '0'),
                now.getSeconds().toString().padStart(2, '0')
            ].join(':');

            // 1. On crée d'abord la notification parente
            const notif = await Notification.create({
                objet: 'Rupture de stock',
                message: msg,
                date: today,
                heure: formattedTime
            }, { transaction: t });

            // 2. On récupère les personnels
            const conserner = await Occupe.findAll({
                include: [
                    { model: Personnel, where: { is_active: true } },
                    { model: Poste, where: { is_active: true, nom_poste: { [Op.in]: ['Admin', 'Comptable'] } } }
                ],
                where: { is_active: true },
                transaction: t
            });

            conserner.map(c => 
                allReceverEmail.push(c.Personnel.email)
            )

            // 3. On prépare TOUTES les promesses avec "const" et "return"
            const updateProduits = produits.map(p => 
                Produit.update({ lastCheck: today }, { where: { id_produit: p.id_produit }, transaction: t })
            );

            const updateEmballages = emballages.map(e => 
                Emballage.update({ lastCheck: today }, { where: { id_emballage: e.id_emballage }, transaction: t })
            );

            const addReadNotifs = conserner.map(c => 
                ReadNotification.create({
                    id_notif: notif.id_notif,
                    id_personnel: c.Personnel.id_personnel,
                    date: today,
                    heure: formattedTime,
                    lu: false
                }, { transaction: t })
            );

            // 4. On attend la résolution de TOUT avant le COMMIT automatique
            await Promise.all([...updateProduits, ...updateEmballages, ...addReadNotifs]);
        });
        // --- FIN TRANSACTION ---
        // console.log("✅ rupture de stock");
        const pdfUrl = '/stock/pdf';
        const html = buildStockEmail(produits, emballages, pdfUrl);
        await sendAlert(allReceverEmail, html, "⚠️ ALERTE : Seuil de stock atteint", process.env.DEFAULT_FROM_EMAIL);

    } catch (err) {
        console.error("❌ Erreur dans le calcul du Cron :", err.message);
    }
});

module.exports = { sendAlert,stockJob, stockDown };