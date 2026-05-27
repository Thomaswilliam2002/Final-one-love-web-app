const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const CollectFondSalonPrive = sequelize.define('CollectFondSalonPrive', {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        recette: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        manquant: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        commentaire: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_DATE')
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
                instance.slug_id = await CollectFondSalonPrive.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    CollectFondSalonPrive.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CFSP-${year}-${randomStr}`;

            const exists = await CollectFondSalonPrive.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return CollectFondSalonPrive;
}