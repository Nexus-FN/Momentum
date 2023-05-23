import { DataTypes, Model, Sequelize } from 'sequelize';


const sequelize = new Sequelize('postgres://server:Munano123@10.0.30.55:5432/fortniteserver');

const Profiles = sequelize.define('profiles', {
    created: { type: DataTypes.DATE, allowNull: false },
    accountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    profiles: { type: DataTypes.JSONB, allowNull: false }
});

sequelize.sync();

const model = sequelize.model('profiles');
module.exports = model;