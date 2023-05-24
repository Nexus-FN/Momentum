import { Hash } from "crypto";
import { EmbedBuilder } from "discord.js";

export { }

const { SlashCommandBuilder } = require('discord.js');
const functions = require('../../../structs/functions.js');
const Users = require('../../../model/user-gres');
const bcrypt = require('bcrypt');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('username')
		.setDescription('Lets you change your userame')
		.addStringOption(option =>
			option.setName('username')
				.setDescription('Your desired username')
				.setRequired(true)),


	async execute(interaction) {
        const user = await Users.findOne({where: { discordId: interaction.user.id }});
        if (!user) return interaction.reply({ content: "You are not registered!", ephemeral: true });

		let accessToken = global.accessTokens.find(i => i.accountId == user.accountId);
        if (accessToken) return interaction.editReply({ content: "Failed to change username as you are currently logged in to Fortnite.\nRun the /sign-out-of-all-sessions command to sign out.", ephemeral: true });

		const username = interaction.options.getString('username');
            
		await user.update({
			username: username,
		});

		const embed = new EmbedBuilder()
			.setTitle("Username changed")
			.setDescription("Your account username has been changed to " + username + "")
			.setColor("#2b2d31")
			.setFooter({
				text: "Momentum",
				iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
			})
			.setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

	},
};