const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const JournalSalaire = sequelize.define('JournalSalaire', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_poste: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_personnel: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        reste: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        payer: {
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
            beforeCreate: async (JournalSalaire) => {
                JournalSalaire.slug_id = await JournalSalaire.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    JournalSalaire.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `JSL-${year}-${randomStr}`;

            const exists = await JournalSalaire.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return JournalSalaire
}