import { DataTypes, Model, Sequelize } from 'sequelize';


const sequelize = new Sequelize('postgres://server:Munano123@10.0.30.55:5432/fortniteserver');

const FriendsSchema = sequelize.define('friends', {
    created: { type: DataTypes.DATE, allowNull: false },
    accountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    list: { type: DataTypes.JSONB, allowNull: false, defaultValue: { accepted: [], incoming: [], outgoing: [], blocked: [] } }
});

sequelize.sync();

const model = sequelize.model('friends');

module.exports = model;