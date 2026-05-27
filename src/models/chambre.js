const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Chambre = sequelize.define('Chambre', {
        id_chambre: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        loyer: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        disponibiliter: {
            type: DataTypes.STRING,
            allowNull: false
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
            beforeCreate: async (chambre) => {
                chambre.slug_id = await Chambre.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Chambre.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CH-${year}-${randomStr}`;

            const exists = await Chambre.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };
    
    return Chambre;
}