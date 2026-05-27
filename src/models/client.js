const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id_client: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nom_client: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prenom_client: {
            type: DataTypes.STRING,
            allowNull: false
        },
        numero_client: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        comentaire_client: {
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
            allowNull: true,
            unique: true
        }
    },
    {
        hooks: {
            beforeCreate: async (client) => {
                client.slug_id = await Client.generateCustomId();
            },
            beforeUpdate: async (client) => {
                client.slug_id = await Client.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: false
    })

    Client.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `CLI-${year}-${randomStr}`;

            const exists = await Client.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Client;
}