const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const JournalEmprunt = sequelize.define('JournalEmprunt', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_creancier: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        montant: {
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
            beforeCreate: async (instance) => {
                instance.slug_id = await JournalEmprunt.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    JournalEmprunt.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `JEM-${year}-${randomStr}`;

            const exists = await JournalEmprunt.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return JournalEmprunt;
}