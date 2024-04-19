const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { glob } = require("glob");
const { promisify } = require("util");
const { prefix } = require('../../config.json');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "about",
    description: 'Information about the bot owner.',
  aliases: ['ab'],
    cooldown: 5000,
    async execute(client, message, args) {
      try {
        let embed = new EmbedBuilder()
          embed.setAuthor({ name: `About: ${client.user.username}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) }) 
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        embed.setDescription(`**__About Developer__**\n\n**__Name:__** [𝐌𝐚𝐆𝐝𝐄𝐞](https://discord.com/users/1150890847768936458) \n**__Age:__** \`21\` \n**__Country:__** [Egypt](https://youtu.be/BapSQFJPMM0?si=ZFcfSNLn3RMdZdbw) \n**__City:__** [Cairo](https://youtu.be/BapSQFJPMM0?si=ZFcfSNLn3RMdZdbw) \n**__Birthday:__** \`11/12/2002\` \n**__Email:__** \`magdee178@gmail.com\`\n\n**__About Bot__**\n\n**__Bot Name:__** \`${client.user.username}\`\n**__Bot ID:__** \`${client.user.id}\`\n**__Bot Prefix:__** \`${prefix}\`\n**__Bot Ping:__** \`${client.ws.ping}ms\`\n**__Up Time:__** <t:${parseInt(client.readyTimestamp / 1000)}:R>\n**__Bot Created Time:__** <t:${parseInt(client.user.createdTimestamp / 1000)}:R>`)
          embed.setFooter({ text: `Made By 𝐌𝐚𝐆𝐝𝐄𝐞`, iconURL: message.guild.iconURL({ dynamic: true })})
        .setImage("https://cdn.discordapp.com/attachments/1220651731503812649/1227026634838900746/YY52ytm.gif?ex=6626e89a&is=6614739a&hm=593a1dee0b455a53f9cec85cf5a379516708fdb885c646a397d6ab4299194c1d&")
          embed.setTimestamp();
        let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
  .setEmoji(`<:link_ma:1229652824472948809>`)
                        .setLabel('bio.link')
                        .setURL(`https://bio.link/magdee`))
        message.reply({ embeds: [embed], components: [row] })
      } catch (err) {
            console.log(err)
      }
    },
     };
