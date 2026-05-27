const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {

    const Notification = sequelize.define('Notification', {
        id_notif: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        objet: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE')
        },
        heure: {
            type: DataTypes.TIME, 
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

            beforeCreate: async (instance) => {
                if (!instance.slug_id) {
                    instance.slug_id = await Notification.generateCustomId();
                }
            }

        },

        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    });

    // ✅ FONCTION DE CLASSE → BON ENDROIT
    Notification.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `NTF-${year}-${randomStr}`;

            const exists = await Notification.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Notification;
};