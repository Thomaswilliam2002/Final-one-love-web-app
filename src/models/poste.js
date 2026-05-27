const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Poste = sequelize.define('Poste', {
        id_poste: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom_poste: {
            type: DataTypes.STRING,
            allowNull: false
        },
        salaire: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        description: {
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
            beforeCreate: async (poste) => {
                poste.slug_id = await Poste.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Poste.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `PST-${year}-${randomStr}`;

            const exists = await Poste.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Poste;
}