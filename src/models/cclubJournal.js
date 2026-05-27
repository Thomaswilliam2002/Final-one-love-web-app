const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const CClubJournal = sequelize.define('CClubJournal', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE')
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        slug_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    },
    {
        hooks: {
            beforeCreate: async (cclubJournal) => {
                if (!cclubJournal.slug_id) {
                    cclubJournal.slug_id = await CClubJournal.generateCustomId();
                }
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    CClubJournal.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CCJ-${year}-${randomStr}`;

            const exists = await CClubJournal.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return CClubJournal;
}