import { DataTypes, Model, Sequelize } from 'sequelize';


import sequelize from '../index';

const FriendsSchema = sequelize.define('friends', {
    created: { type: DataTypes.DATE, allowNull: false },
    accountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    list: { type: DataTypes.JSONB, allowNull: false, defaultValue: { accepted: [], incoming: [], outgoing: [], blocked: [] } }
});

sequelize.sync();

const model = sequelize.model('friends');

module.exports = model;