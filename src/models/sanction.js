const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Sanction = sequelize.define('Sanction', {
        id_sanction: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        motif: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        montan_defalquer: {
            type: DataTypes.FLOAT,
            allowNull: true
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
            beforeCreate: async (sanction) => {
                sanction.slug_id = await Sanction.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Sanction.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `MC-${year}-${randomStr}`;

            const exists = await Sanction.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Sanction;
}