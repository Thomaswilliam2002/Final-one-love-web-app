const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const ChambreJournal = sequelize.define('ChambreJournal', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        loyer: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        manquant: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        motif: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: sequelize.literal('CURRENT_DATE')
        },
        date: {
            type: DataTypes.DATEONLY,
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
            beforeCreate: async (chambreJournal) => {
                chambreJournal.slug_id = await ChambreJournal.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    ChambreJournal.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CHJ-${year}-${randomStr}`;

            const exists = await ChambreJournal.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return ChambreJournal;
}