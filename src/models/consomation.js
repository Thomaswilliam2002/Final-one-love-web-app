const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Consommation = sequelize.define('Consommation', {
        id_conso: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        consommateur: { // l'id de celui qui consomme
            type: DataTypes.INTEGER,
            allowNull: false
        },
        marqueur: { // l'id du marqueur qui a marque la consommation
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type_consommateur: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lieu: { // le lieu de consommation
            type: DataTypes.STRING,
            allowNull: true
        },
        article: { // le produit/service/emballage consommé
            type: DataTypes.STRING,
            allowNull: false
        },
        quantiter: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        prix_unit: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE') // Tu peux aussi utiliser: DataTypes.NOW
        },
        heure: {
            type: DataTypes.TIME,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIME')
        },
        commantaire: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        slug_id: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true 
        }
    },
    {
        hooks: {
            beforeCreate: async (instance) => {
                // 🔥 génération du slug ici
                if (!instance.slug_id) {
                    instance.slug_id = await Consommation.generateCustomId();
                }
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Consommation.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CSN-${year}-${randomStr}`;

            const exists = await Consommation.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };
    
    return Consommation;
}