import { ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Canvas from '@napi-rs/canvas';
import shop from '../../../utilities/shop.js';

export const data = new SlashCommandBuilder()
    .setName('rotateshop')
    .setDescription('Rotate the item shop manually.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const shopItems = await shop.updateShop();
    const rowCount = 2;
    const maxItemsPerRow = Math.ceil(shopItems.length / rowCount);
    const rowWidth = 800;
    const columnHeight = 540;
    const canvasWidth = rowWidth * Math.ceil(shopItems.length / rowCount);
    const canvasHeight = columnHeight * rowCount;

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);
    const backgroundImage = await Canvas.loadImage('https://i.redd.it/zs2ec4w041251.png');
    context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    const imagePromises = shopItems.map(async (item, index) => {
        const imageBuffer = await fetch(item.images.icon).then(res => res.arrayBuffer());
        const loadImage = await Canvas.loadImage(imageBuffer);

        const aspectRatio = loadImage.width / loadImage.height;
        const imageHeight = columnHeight;
        const imageWidth = imageHeight * aspectRatio;

        const rowIndex = Math.floor(index / maxItemsPerRow);
        const columnIndex = index % maxItemsPerRow;
        const xOffset = columnIndex * rowWidth;
        const yOffset = rowIndex * columnHeight;

        context.save();
        context.translate(xOffset, yOffset);
        context.scale(imageWidth / loadImage.width, imageHeight / loadImage.height);
        context.drawImage(loadImage, 0, 0);
        context.restore();
    });

    await Promise.all(imagePromises);

    const currentChannelEmbed = new EmbedBuilder()
        .setTitle(`Shop Rotated Successfully`)
        .setDescription(`${shopItems.length} items were updated in the shop.`)
        .setColor("#2b2d31")
        .setFooter({
            text: "Momentum",
            iconURL: "https://cdn.discordapp.com/app-assets/432980957394370572/1084188429077725287.png",
        })
        .setTimestamp();

    await interaction.editReply({ embeds: [currentChannelEmbed], ephemeral: true });

    const specifiedChannelEmbed = new EmbedBuilder()
        .setTitle(`Item Shop Update`)
        .setColor("#2b2d31")
        .setFooter({
            text: new Date().toLocaleDateString(),
        })
        .setImage('attachment://combined_shop.png');

    const targetChannelId = 'YOUR_CHANNEL_ID_HERE';
    const channel = await interaction.client.channels.fetch(targetChannelId);
    if (!channel) throw new Error('Channel not found');
    
    await channel.send({ 
        embeds: [specifiedChannelEmbed], 
        files: [new AttachmentBuilder(await canvas.encode('png'), { name: 'combined_shop.png' })] 
    });

    log.shop("Shop has been manually rotated.");
}
