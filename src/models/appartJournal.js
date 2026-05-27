const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const AppartJournal = sequelize.define('AppartJournal', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        date_fin_reel: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        loyer: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        nuiter: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        motif: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        id_client: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'EN COURS'
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
            beforeCreate: async (appartJournal) => {
                appartJournal.slug_id = await AppartJournal.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    AppartJournal.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `APPJ-${year}-${randomStr}`;

            const exists = await AppartJournal.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return AppartJournal
}