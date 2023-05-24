import { DataTypes, Model, Sequelize } from 'sequelize';
const sequelize = new Sequelize('postgres://server:Munano123@localhost:5432/fortniteserver');

const ApiSchema = sequelize.define('api', {
    created: { type: DataTypes.DATE, allowNull: false },
    apiKey: { type: DataTypes.STRING, allowNull: false, unique: true },
    access: { type: DataTypes.STRING, allowNull: false, defaultValue: "user" }
});

const model = sequelize.model('api');

module.exports = model;