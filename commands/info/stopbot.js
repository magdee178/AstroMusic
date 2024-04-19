const { MessageEmbed, EmbedBuilder } = require('discord.js');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "stopbot",
    description: "Stops the bot.",
    cooldown: 5000,
    aliases: [],
    async execute(client, message, args) {
        try {
                  let embed = new EmbedBuilder()
        embed.setColor("#2f3136")
        embed.setDescription("`❌` | **Only the bot owner can use this command!**")
      embed.setFooter({ text: `Requested by:  ${message.guild.members.cache.get(message.author.id).displayName}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
      if(message.author.id != "1150890847768936458") return message.channel.send({ embeds: [embed] }).then(msg => {
      });
          
        message.reply({ content: `:white_check_mark: Bot is stopping...` }).then(msg => { process.exit(); })
           // setTimeout(() => {
                //process.exit();
           // })
          
          console.log(`Bot has been stopped by: ${message.author.tag} (${message.author.id})`)
        } catch (err) {
            console.log(err)
    }
},
};
