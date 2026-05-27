const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const SalonPrive = sequelize.define('SalonPrive', {
        id_salon: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prix: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE') // Tu peux aussi utiliser: DataTypes.NOW
        },
        adresse: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        commantaire: {
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
                    instance.slug_id = await SalonPrive.generateCustomId();
                }
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    SalonPrive.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `SP-${year}-${randomStr}`;

            const exists = await SalonPrive.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };
    
    return SalonPrive;
}