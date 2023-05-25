import { DataTypes, Model, Sequelize } from 'sequelize';
import sequelize from '../index';

const ApiSchema = sequelize.define('api', {
    created: { type: DataTypes.DATE, allowNull: false },
    apiKey: { type: DataTypes.STRING, allowNull: false, unique: true },
    access: { type: DataTypes.STRING, allowNull: false, defaultValue: "user" }
});

const model = sequelize.model('api');

module.exports = model;