const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const CrazyClub = sequelize.define('CrazyClub', {
        id_cclub: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        adresse: {
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
            beforeCreate: async (crazyClub) => {
                crazyClub.slug_id = await CrazyClub.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    CrazyClub.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CC-${year}-${randomStr}`;

            const exists = await CrazyClub.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return CrazyClub;
}