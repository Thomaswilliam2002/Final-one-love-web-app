const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const JournalSalonPrive = sequelize.define('JournalSalonPrive', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_salon: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        montant: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        marqueur: { // l'id du marqueur qui a marque la danse
            type: DataTypes.INTEGER,
            allowNull: false
        },
        danseuse: { // celui qui danse
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE') // Tu peux aussi utiliser: DataTypes.NOW
        },
        heure: {
            type: DataTypes.TIME,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIME')
        },
        commantaire: {
            type: DataTypes.STRING,
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
            beforeCreate: async (instance) => {
                // 🔥 génération du slug ici
                if (!instance.slug_id) {
                    instance.slug_id = await JournalSalonPrive.generateCustomId();
                }
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    JournalSalonPrive.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `JSP-${year}-${randomStr}`;

            const exists = await JournalSalonPrive.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };
    
    return JournalSalonPrive;
}