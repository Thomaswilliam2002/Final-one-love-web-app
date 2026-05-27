const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Caisse = sequelize.define('Caisse', {
        id_caisse: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nom_lieu: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type_lieu: {
            type: DataTypes.STRING,
            allowNull: false
        },
        id_lieu: {
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
        }
    },
    {
        hooks: {
            beforeCreate: async (caisse) => {
                caisse.slug_id = await Caisse.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Caisse.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CAS-${year}-${randomStr}`;

            const exists = await Caisse.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Caisse;
}