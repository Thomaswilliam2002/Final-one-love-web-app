const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Cuisine = sequelize.define('Cuisine', {
        id_cuisine: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom_cuisine: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nom_locataire: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prenom_locataire: {
            type: DataTypes.STRING,
            allowNull: false
        },
        adresse_locataire: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        email_locataire: {
            type: DataTypes.STRING,
            allowNull: true
        },
        numero_locataire: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
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
            beforeCreate: async (cuisine) => {
                cuisine.slug_id = await Cuisine.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Cuisine.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CU-${year}-${randomStr}`;

            const exists = await Cuisine.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Cuisine;
}