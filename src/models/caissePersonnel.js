const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const CaissePersonnel = sequelize.define('CaissePersonnel', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_caisse: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_personnel: {
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
            beforeCreate: async (caissePersonnel) => {
                caissePersonnel.slug_id = await CaissePersonnel.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    CaissePersonnel.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CP-${year}-${randomStr}`;

            const exists = await CaissePersonnel.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return CaissePersonnel;
}