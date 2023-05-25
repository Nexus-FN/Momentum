import { DataTypes, Model, Sequelize } from 'sequelize';


import sequelize from '../index';

const Profiles = sequelize.define('profiles', {
    created: { type: DataTypes.DATE, allowNull: false },
    accountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    profiles: { type: DataTypes.JSONB, allowNull: false }
});

sequelize.sync();

const model = sequelize.model('profiles');
module.exports = model;