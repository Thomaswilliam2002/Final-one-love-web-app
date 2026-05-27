const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const AppartFondJournal = sequelize.define('AppartFondJournal', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_appart: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        recette: {
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
        commentaire: {
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
            beforeCreate: async (appartFondJournal) => {
                appartFondJournal.slug_id = await AppartFondJournal.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    AppartFondJournal.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `APPFJ-${year}-${randomStr}`;

            const exists = await AppartFondJournal.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return AppartFondJournal
}