const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const CuisineJournal = sequelize.define('CuisineJournal', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        montant_verser: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        manquant: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE')
        },
        comentaire: {
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
            beforeCreate: async (cuisineJournal) => {
                cuisineJournal.slug_id = await CuisineJournal.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    CuisineJournal.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CUJ-${year}-${randomStr}`;

            const exists = await CuisineJournal.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return CuisineJournal;
}