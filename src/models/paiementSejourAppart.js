const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const PaiementSejourAppart = sequelize.define('PaiementSejourAppart', {
        id_pais: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        montant: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        id_journal: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        modePaiment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE')
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
                instance.slug_id = await PaiementSejourAppart.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    PaiementSejourAppart.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `PASP-${year}-${randomStr}`;

            const exists = await PaiementSejourAppart.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return PaiementSejourAppart;
}