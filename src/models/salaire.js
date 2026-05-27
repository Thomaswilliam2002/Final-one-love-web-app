const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Salaire = sequelize.define('Salaire', {
        id_salaire: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_occupe: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_personnel: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        montant_net: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        primes: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        deductions: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'EN COURS'
        },
        debut_periode: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: sequelize.literal('CURRENT_DATE')
        },
        fin_periode: {
            type: DataTypes.DATEONLY,
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
            beforeCreate: async (instance) => {
                instance.slug_id = await Salaire.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Salaire.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `SLR-${year}-${randomStr}`;

            const exists = await Salaire.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Salaire
}