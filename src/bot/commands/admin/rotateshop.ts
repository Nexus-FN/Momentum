
import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";


import shop from '../../../utilities/shop.js';

export const data = new SlashCommandBuilder()
    .setName('rotateshop')
    .setDescription('Rotate the item shop manually.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const updatedItems = await shop.updateShop();
        if (!Array.isArray(updatedItems) || updatedItems.length === 0) {
            throw new Error('No items were updated or an error occurred.');
        }

        const embed = new EmbedBuilder()
            .setTitle(`Shop Rotated Successfully`)
            .setDescription(`${updatedItems.length} items were updated in the shop.`)
            .setColor("#2b2d31")
            .setFooter({
            	text: "Momentum",
            	iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        await interaction.editReply({ content: `Failed to rotate the shop: ${error.message}`, ephemeral: true });
    }
}
