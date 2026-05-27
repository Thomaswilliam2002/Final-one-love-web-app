const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Fournisseur = sequelize.define('Fournisseur', {
        id_fournisseur: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        pseudo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        numero1: {
            type: DataTypes.STRING,
            allowNull: true
        },
        numero2: {
            type: DataTypes.STRING,
            allowNull: true
        },
        adresse: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true
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
            beforeCreate: async (fournisseur) => {
                fournisseur.slug_id = await Fournisseur.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Fournisseur.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `FNS-${year}-${randomStr}`;

            const exists = await Fournisseur.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Fournisseur;
}