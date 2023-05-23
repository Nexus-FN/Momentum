export { }

import { Hash } from "crypto";
import { EmbedBuilder } from "discord.js";
import Asteria from "asteriasdk";
import { DataTypes, Model, Sequelize } from 'sequelize';
const asteria = new Asteria({
    collectAnonStats: true,
    throwErrors: true,
});

const { SlashCommandBuilder } = require('discord.js');
const Users = require('../../../model/user');
const gresUser = require('../../../model/user-gres');

const Profiles = require('../../../model/profiles');
const gresProfiles = require('../../../model/profiles-gres');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('Shows you your account information'),

    async execute(interaction) {
        const user = await gresUser.findOne({ where: { discordId: interaction.user.id } });
        console.log("user: ", user);
        if (!user) return interaction.reply({ content: "You are not registered!", ephemeral: true });

        const profile = await gresProfiles.findOne({ where: { accountId: user.accountId } });

        const selectedSkin = profile.profiles.athena.stats.attributes.favorite_character;
        const selectedSkinSplit = selectedSkin.split(":") || "CID_005_Athena_Commando_M_Default";

        let cosmetic: { images: { icon: string; }; } = { images: { icon: "" } };

        try {
            cosmetic = await asteria.getCosmetic("name", selectedSkinSplit[1], true);
        } catch (err) {
            cosmetic = { images: { icon: "https://nexusassets.zetax.workers.dev/ceba508f24a70c50bd8782d08bd530b0d0df82e0baf7e357bcfd01ac81898297.gif" } }
        }

        if(!cosmetic) cosmetic = { images: { icon: "https://nexusassets.zetax.workers.dev/ceba508f24a70c50bd8782d08bd530b0d0df82e0baf7e357bcfd01ac81898297.gif" } }

        let icon = cosmetic.images.icon;

        const embed = new EmbedBuilder()
            .setTitle("Your account")
            .setDescription("These are your account details")
            .setColor("#2b2d31")
            .addFields([
                {
                    name: "Username",
                    value: user.username,
                    inline: true
                },
                {
                    name: "Email",
                    value: user.email,
                    inline: true
                },
                {
                    name: "Account ID",
                    value: user.accountId
                },
            ])
            .setThumbnail(icon)
            .setFooter({
                text: "Momentum",
                iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
            })
            .setTimestamp();

        interaction.reply({ embeds: [embed], ephemeral: true });

    },
};