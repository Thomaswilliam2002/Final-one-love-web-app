const crypto = require('crypto')
module.exports = (sequelize, DataTypes) => {
    const Occupe = sequelize.define('Occupe', {
        id_occupe: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        salaire: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        debut_periode: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: sequelize.literal('CURRENT_DATE')
        },
        fin_periode: {
            type: DataTypes.DATEONLY,
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
            beforeCreate: async (occupe) => {
                occupe.slug_id = await Occupe.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Occupe.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `OCC-${year}-${randomStr}`;

            const exists = await Occupe.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Occupe;
}