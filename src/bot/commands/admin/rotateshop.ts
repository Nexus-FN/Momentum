
import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";


import shop from '../../../utilities/shop.js';

export const data = new SlashCommandBuilder()
    .setName('rotateshop')
    .setDescription('Rotate the item shop manually.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const shopItems = await shop.updateShop();
    const rowCount = 2; // Number of rows
    const maxItemsPerRow = Math.ceil(shopItems.length / rowCount);
    const rowWidth = 800; // Maximum width for each row
    const columnHeight = 540; // Maximum height for each column
    const canvasWidth = rowWidth * Math.ceil(shopItems.length / rowCount);
    const canvasHeight = columnHeight * rowCount;

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    const backgroundImage = await Canvas.loadImage('https://i.redd.it/zs2ec4w041251.png');
    context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    const imagePromises = shopItems.map(async (item, i) => {
        const imageBuffer = await fetch(item.images.icon).then((res: any) => res.arrayBuffer());
        const loadImage = await Canvas.loadImage(imageBuffer);

        const aspectRatio = loadImage.width / loadImage.height;
        const imageHeight = columnHeight;
        const imageWidth = imageHeight * aspectRatio;

        const rowIndex = Math.floor(i / maxItemsPerRow);
        const columnIndex = i % maxItemsPerRow;
        const xOffset = columnIndex * rowWidth;
        const yOffset = rowIndex * columnHeight;

        // Save the canvas state before drawing the image
        context.save();

        // Translate the canvas to the correct position and scale it to the correct size
        context.translate(xOffset, yOffset);
        context.scale(imageWidth / loadImage.width, imageHeight / loadImage.height);

        // Draw the image
        context.drawImage(loadImage, 0, 0);

        // Restore the canvas state after drawing the image
        context.restore();
    });

    await Promise.all(imagePromises);

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'combined_shop.png' });
    
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
