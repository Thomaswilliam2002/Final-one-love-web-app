const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Appartement = sequelize.define('Appartement', {
        id_appart: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom_appart: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prix_appart: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        adresse_appart: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        desc_appart: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        dispo_appart: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
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
                    instance.slug_id = await Appartement.generateCustomId();
                }
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Appartement.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `APP-${year}-${randomStr}`;

            const exists = await Appartement.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };
    
    return Appartement;
}