const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const PaiementSalaire = sequelize.define('PaiementSalaire', {
        id_paisal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        montant: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        id_salaire: {
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
            beforeCreate: async (paiementSalaire) => {
                paiementSalaire.slug_id = await PaiementSalaire.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    PaiementSalaire.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `PASA-${year}-${randomStr}`;

            const exists = await PaiementSalaire.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return PaiementSalaire;
}