const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const ReadNotification = sequelize.define('ReadNotification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_notif: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_personnel: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        heure: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        lu: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
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
        hooks:{
            beforeCreate: async (instance, options) => {
                instance.slug_id = await ReadNotification.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })
    
    ReadNotification.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `MC-${year}-${randomStr}`;

            const exists = await ReadNotification.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return ReadNotification;
}