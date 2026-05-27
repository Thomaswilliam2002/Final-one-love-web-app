const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const CaisseJournal = sequelize.define('CaisseJournal', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        recette: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        origine_fond: {
            type: DataTypes.TEXT,
            allowNull: true
        }, 
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE')
        },
        commentaire: {
            type: DataTypes.TEXT,
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
            beforeCreate: async (caisseJournal) => {
                caisseJournal.slug_id = await CaisseJournal.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    CaisseJournal.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CJ-${year}-${randomStr}`;

            const exists = await CaisseJournal.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return CaisseJournal;
}