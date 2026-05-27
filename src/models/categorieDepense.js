const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const CategorieDepense = sequelize.define('CategorieDepense', {
        id_categ: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        slug_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    },
    {
        hooks: {
            beforeCreate: async (categorieDepense) => {
                categorieDepense.slug_id = await CategorieDepense.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    CategorieDepense.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CATD-${year}-${randomStr}`;

            const exists = await CategorieDepense.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return CategorieDepense;
}