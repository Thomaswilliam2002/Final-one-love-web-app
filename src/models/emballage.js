const crypto = require('crypto')
module.exports = (sequelize, DataTypes) => {
    const Emballage = sequelize.define('Emballage', {
        id_emballage: {
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
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        hooks: {
            beforeCreate: async (emballage) => {
                emballage.slug_id = await Emballage.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Emballage.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `EMB-${year}-${randomStr}`;

            const exists = await Emballage.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Emballage;
}