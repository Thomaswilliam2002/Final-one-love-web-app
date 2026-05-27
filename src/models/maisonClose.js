const  crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const MaisonClose = sequelize.define('MaisonClose', {
        id_mclose: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: true
        },
        adresse: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        nb_chambre: {
            type: DataTypes.INTEGER,
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
            beforeCreate: async (maisonClose) => {
                maisonClose.slug_id = await MaisonClose.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    MaisonClose.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `MC-${year}-${randomStr}`;

            const exists = await MaisonClose.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return MaisonClose;
}