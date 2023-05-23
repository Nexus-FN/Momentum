import { Hash } from "crypto";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { DataTypes, Model, Sequelize, json } from 'sequelize';
export { }

const { SlashCommandBuilder } = require('discord.js');
const functions = require('../../../structs/functions.js');
const Users = require('../../../model/user-gres');
const Profiles = require('../../../model/profiles-gres');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vbucks')
		.setDescription('Lets you change a users amount of vbucks')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to change the vbucks of')
                .setRequired(true))
		.addStringOption(option =>
			option.setName('vbucks')
				.setDescription('The amount of vbucks you want to give (Can be a negative number to take vbucks)')
				.setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.setDMPermission(false),


	async execute(interaction) {

        const selectedUser = interaction.options.getUser('user');
        const selectedUserId:Number = selectedUser.id;
		let currentVbucks = 0, newVbucks = 0;
		const vbucks = interaction.options.getString('vbucks');

		//Await user then find profile
		const user = await Users.findOne({ where: { discordId: selectedUserId } });
		if (!user) return interaction.reply({ content: "User not found", ephemeral: true });
		
		const profile = await Profiles.findOne({ where: { accountId: user.accountId } }).then((profile) => {
			if (!profile) return interaction.reply({ content: "User profile not found", ephemeral: true });
			
			const profiles = profile.profiles; // Assuming 'common_core' is the JSON column name
			currentVbucks = parseInt(profiles.common_core.items['Currency:MtxPurchased'].quantity.toString());
			profiles.common_core.items['Currency:MtxPurchased'].quantity = currentVbucks + parseInt(vbucks);
			newVbucks = profiles.common_core.items['Currency:MtxPurchased'].quantity;
			Profiles.update({ profiles: profiles }, { where: { accountId: user.accountId } });

	
		});
		

		

		const embed = new EmbedBuilder()
		.setTitle("vBucks changed")
		.setDescription("Successfully changed the amount of vbucks for <@" + selectedUserId + "> by " + vbucks + " the account now has " + newVbucks + " vbucks")
		.setColor("#2b2d31")
		.setFooter({
			text: "Momentum",
			iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
		})
		.setTimestamp();

		await interaction.reply({ embeds: [embed], ephemeral: true });

        
        // Find the the users profile and update the vbucks

	},
};