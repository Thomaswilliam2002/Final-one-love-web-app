const crypto = require('crypto')
module.exports = (sequelize, DataTypes) => {
    const HistSortie = sequelize.define('HistSortie', {
        id_hist: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        quantiter: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        prix_unit: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        id_caisse: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_probal: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        receveur: { // celui qui recois 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type_lieu_receveur:{
            type: DataTypes.STRING,
            allowNull: false
        },
        commantaire: { // celui qui recois 
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
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE')
        }
    },
    {
        hooks: {
            beforeCreate: async (histSortie) => {
                histSortie.slug_id = await HistSortie.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    HistSortie.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `HS-${year}-${randomStr}`;

            const exists = await HistSortie.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return HistSortie;

}