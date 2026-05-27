const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Occupent = sequelize.define('Occupent', {
        id_occup: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom_prenom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        numero: {
            type: DataTypes.STRING,
            allowNull: true
        },
        id_mclose: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        id_chambre: {
            type: DataTypes.INTEGER,
            allowNull: true
        }, 
        date_arriver: {
            type: DataTypes.DATEONLY,
            allowNull: true
        }, 
        date_depart: {
            type: DataTypes.DATE,
            allowNull: true
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
            beforeCreate: async (occupent) => {
                occupent.slug_id = await Occupent.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Occupent.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `MC-${year}-${randomStr}`;

            const exists = await Occupent.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Occupent;
}