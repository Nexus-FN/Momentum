import { Hash } from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export { }

const { SlashCommandBuilder } = require('discord.js');
const Users = require('../../../model/user-gres');
const Profiles = require('../../../model/profiles-gres');
const Friends = require('../../../model/friends-gres');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteaccount')
        .setDescription('Deletes your account (irreversible)'),

    async execute(interaction) {

        const user = await Users.findOne({ where:{ discordId: interaction.user.id }});
        if (!user) return interaction.reply({ content: "You are not registered!", ephemeral: true });

        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm Deletion')
            .setStyle(ButtonStyle.Danger);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(confirm, cancel);

        const confirmationEmbed = new EmbedBuilder()
            .setTitle(`Are you sure you want to delete your account?`)
            .setDescription("This action is irreversible, and will delete all your data.")
            .setColor("#2b2d31")
            .setFooter({
                text: "Momentum",
                iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
            })
            .setTimestamp();

        const confirmationResponse = await interaction.reply({ 
            embeds: [confirmationEmbed], 
            components: [row],
            ephemeral: true
        });

        const filter = (i) => i.user.id === interaction.user.id;

        try {
            const confirmation = await confirmationResponse.awaitMessageComponent({ filter, time: 10000 });

            if (confirmation.customId === 'confirm') {
                Users.findOne({ where: { discordId: interaction.user.id }}).then(user => user.destroy());
                Profiles.findOne({ where: { accountId: await user.accountId }}).then(profiles => profiles.destroy());
                Friends.findOne({ where: { accountId: await user.accountId }}).then(friends => friends.destroy());

                const embed = new EmbedBuilder()
                    .setTitle(`Account Deleted`)
                    .setDescription("Your account has been deleted, we're sorry to see you go! \n\nNote: The interaction has not actually failed, just discord being weird.")
                    .setColor("#2b2d31")
                    .setFooter({
                        text: "Momentum",
                        iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
                    })
                    .setTimestamp();
        
                interaction.followUp({ embeds: [embed], ephemeral: true });
            } else if (confirmation.customId === 'cancel') {
                const embed = new EmbedBuilder()
                    .setTitle(`Account Deletion Cancelled`)
                    .setDescription("Your account has not been deleted.")
                    .setColor("#2b2d31")
                    .setFooter({
                        text: "Momentum",
                        iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
                    })
                    .setTimestamp();
        
                interaction.followUp({ embeds: [embed], ephemeral: true });
            }
                

        } catch (err) {
            return interaction.followUp({ content: "You took too long to respond!", components: [] });
        }

    },
};