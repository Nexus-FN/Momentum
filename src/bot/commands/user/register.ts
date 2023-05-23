import { EmbedBuilder } from "discord.js";
import log from "../../../structs/log";
const Users = require('../../../model/user-gres');

export { }

const { SlashCommandBuilder } = require('discord.js');
const functions = require('../../../structs/functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Creates an account for you')
		.addStringOption(option =>
			option.setName('username')
				.setDescription('The username you want to use')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('email')
				.setDescription('The email you want to use')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('password')
				.setDescription('The password you want to use')
				.setRequired(true)),


	async execute(interaction) {
		
		await interaction.deferReply({ ephemeral: true });

		const discordId = interaction.user.id;
		const username = interaction.options.getString('username');
		const email = interaction.options.getString('email');
		const plainPassword = interaction.options.getString('password');

		const user = await Users.findOne({ where: { discordId: interaction.user.id }});
        if (user) return interaction.editReply({ content: "You are already registered!", ephemeral: true });

		await functions.registerUser(discordId, username, email, plainPassword, false).then(async (res) => {

			const embed = new EmbedBuilder()
				.setTitle("Account created")
				.setDescription("Your account has been successfully created")
				.addFields(
					{
						name: "Username",
						value: username,
					},
					{
						name: "Email",
						value: email,
					},
				)
				.setColor("#2b2d31")
				.setFooter({
					text: "Momentum",
					iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
				})
				.setTimestamp();

				await interaction.editReply({ content: res.message, ephemeral: true });

				const publicEmbed = new EmbedBuilder()
					.setTitle("New registration")
					.setDescription("A new user has registered")
					.addFields(
						{
							name: "Username",
							value: username,
						}
					)
					.setColor("#2b2d31")
					.setFooter({
						text: "Momentum",
						iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
					})
					.setTimestamp();

				await interaction.channel.send({ embeds: [publicEmbed] });
		}).catch((err) => {
			log.error(err);
		});
	},
};