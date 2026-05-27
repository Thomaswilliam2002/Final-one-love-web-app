const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    const Presence = sequelize.define('Presence', {
        id_presence: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: true // Modifié : peut être nul au début
        },
        heure_arriver: {
            type: DataTypes.TIME,
            allowNull: true // Modifié : nul si c'est une absence
        },
        heure_deppart: {
            type: DataTypes.TIME,
            allowNull: true // Modifié : nul tant qu'il n'est pas parti
        },
        justification_absence: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        etat_presence: { // Present, Absent
            type: DataTypes.STRING,
            allowNull: false
        },
        depart_enticiper: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'non'
        },
        id_personnel: { // Clé étrangère vers l'employé
            type: DataTypes.INTEGER,
            allowNull: false
        },
        pointeur: { // ID de l'admin qui fait l'action
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
    }, {
        hooks: {
            beforeCreate: async (presence) => {
                presence.slug_id = await Presence.generateCustomId();
            }
        },
        timestamps: true,
        createdAt: 'created',
        updatedAt: 'updated'
    })
    
    Presence.generateCustomId = async function () {
        let newId;
        let created = false;

        while (!created) {
            const year = new Date().getFullYear();
            const randomStr = crypto.randomBytes(5).toString('hex').toUpperCase();
            newId = `PRC-${year}-${randomStr}`;

            const exists = await Presence.findOne({ where: { slug_id: newId } });
            if (!exists) created = true;
        }

        return newId;
    };

    return Presence;
}