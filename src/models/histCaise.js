const crypto = require('crypto')
module.exports = (sequelize, DataTypes) => {
    const HistCaisse = sequelize.define('HistCaisse', {
        id_hist: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        quantiter: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        prix_unit: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        id_probal: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_caisse: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_caissier: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        slug_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        hooks: {
            beforeCreate: async (histCaise) => {
                histCaise.slug_id = await HistCaisse.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    HistCaisse.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `HC-${year}-${randomStr}`;

            const exists = await HistCaisse.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return HistCaisse;
}