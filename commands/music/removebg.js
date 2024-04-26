const { MessageEmbed, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
  name: "removebg",
  description: "Removes the background from an image.",
  cooldown: 5000,
  aliases: ['removebg','remove-bg'],
  async execute(client, message, args) {
    try {
      const imageUrl = args[0];

      if (!imageUrl) {
        return message.reply({ content: "Please provide an image URL." });
      }
      const response = await fetch(`https://api.remove.bg/v1.0/removebg`,{
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          size: 'auto',
        })
      })
      .catch(error => {
        console.error('Error during fetch:', error);
        return message.reply({ content: "An error occurred while processing the request." });
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const attachment = new AttachmentBuilder(buffer, { name: 'removebg.png' });
      const embed = new EmbedBuilder()
        .setTitle('Removed your image background')
        .setImage('attachment://removebg.png')
        .setColor('Blurple')
        .setFooter({ text: `Requested by: ${message.guild.members.cache.get(message.author.id).displayName}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      message.reply({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error('An error occurred:', error);
      return message.reply({ content: "An error occurred while processing the request." });
    }
  }
          }
