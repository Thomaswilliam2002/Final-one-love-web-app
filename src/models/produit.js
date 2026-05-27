const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Produit = sequelize.define('Produit', {
        id_produit: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        quantiter: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        seuil: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        id_categ: {
            type: DataTypes.INTEGER,
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
        },
        lastCheck: {
            type: DataTypes.DATEONLY,
            allowNull: true
        }
    },
    {
        hooks: {
            beforeCreate: async (produit) => {
                produit.slug_id = await Produit.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Produit.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `MC-${year}-${randomStr}`;

            const exists = await Produit.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Produit;
}