import { DataTypes, Model, Sequelize } from 'sequelize';
import faker from 'faker';
const sequelize = new Sequelize('postgres://server:Munano123@10.0.30.55:5432/fortniteserver');

const User = sequelize.define('User', {
    created: { type: DataTypes.DATE, allowNull: false },
    banned: { type: DataTypes.BOOLEAN, defaultValue: false },
    discordId: { type: DataTypes.STRING, allowNull: false, unique: true },
    accountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    username_lower: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    mfa: { type: DataTypes.BOOLEAN, defaultValue: false },
    gameserver: { type: DataTypes.STRING, defaultValue: null },
    canCreateCodes: { type: DataTypes.BOOLEAN, defaultValue: false },
    isServer: { type: DataTypes.BOOLEAN, defaultValue: false }
},
{
    schema: 'server',
}
);

sequelize.sync();


// const fakeUser = {
//     created: faker.date.past(),
//     banned: faker.datatype.boolean(),
//     discordId: "hey",
//     accountId: faker.datatype.uuid(),
//     username: faker.internet.userName(),
//     username_lower: faker.internet.userName().toLowerCase(),
//     email: faker.internet.email(),
//     password: faker.internet.password(),
//     mfa: faker.datatype.boolean(),
//     gameserver: faker.internet.ip(),
//     canCreateCodes: faker.datatype.boolean(),
//     isServer: faker.datatype.boolean()
// };

const model = sequelize.model('User');

module.exports = model;