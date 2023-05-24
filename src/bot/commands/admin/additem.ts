export { }

import { Hash } from "crypto";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import Asteria from "asteriasdk";

const { SlashCommandBuilder } = require('discord.js');
const functions = require('../../../structs/functions.js');
const Users = require('../../../model/user-gres');
const Profiles = require('../../../model/profiles-gres');

const asteria = new Asteria({
    collectAnonStats: true,
    throwErrors: true,
});

let id: string;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcosmetic')
        .setDescription('Allows you to give a user any skin, pickaxe, glider, etc.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to give the cosmetic to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('cosmeticname')
                .setDescription('The name of the cosmetic you want to give')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),


    async execute(interaction) {

        const selectedUser = interaction.options.getUser('user');
        const selectedUserId: Number = selectedUser.id;

        const user = await Users.findOne({where: { discordId: selectedUserId }});
        const profile = await Profiles.findOne({where: { accountId: user.accountId }});
        if (!user) return interaction.reply({ content: "That user does not own an account", ephemeral: true });

        const cosmeticname: string = interaction.options.getString('cosmeticname');

        //check if user already has the cosmetic
        const cosmeticCheck = await asteria.getCosmetic("name", cosmeticname, false);

        if(cosmeticname.toLowerCase() === cosmeticname) return interaction.reply({ content: "Please check for correct casing. E.g 'renegade raider' is wrong, but 'Renegade Raider' is correct.", ephemeral: true })

        let cosmetic: any = {};

        try {
            cosmetic = await asteria.getCosmetic("name", cosmeticname, false);
        } catch (err) {
            console.log(err);
            return await interaction.reply({ content: "That cosmetic does not exist", ephemeral: true });
        } finally {
            if (profile.profiles.athena.items[`${cosmeticCheck.type.backendValue}:${cosmeticCheck.id}`]) return interaction.reply({ content: "That user already has that cosmetic", ephemeral: true });
        }
        
        const toUpdateProfile = await Profiles.findOne({where: { accountId: user.accountId }}).then((toUpdateProfile) => {
         const profiles = toUpdateProfile.profiles;
         profiles.athena.items[`${cosmetic.type.backendValue}:${cosmetic.id}`] = {
                templateId: `${cosmetic.type.backendValue}:${cosmetic.id}`,
                attributes: {
                    item_seen: false,
                    variants: [],
                    favorite: false,
                },
                "quantity": 1,
            };
        Profiles.update({ profiles: profiles }, { where: { accountId: user.accountId } });

            
        });
        
        const embed = new EmbedBuilder()
            .setTitle("Cosmetic added")
            .setDescription("Successfully gave the user the cosmetic: " + cosmetic.name)
            .setThumbnail(cosmetic.images.icon)
            .setColor("#2b2d31")
            .setFooter({
                text: "Momentum",
                iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

    },
};