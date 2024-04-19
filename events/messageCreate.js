const { prefix } = require('../config.json');
const { Collection, Permissions, MessageEmbed, MessageActionRow, MessageButton, EmbedBuilder } = require('discord.js');
const delay = new Collection();
const db = require('quick.db');
const ms = require('ms');
const axios = require("axios").default;
const { Utils } = require("devtools-ts");
const utilites = new Utils();


module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    try {
      
      if(message.content.startsWith(prefix+"sn")){
        if(message.author.id != "1150890847768936458") return
        let args = message.content.split(" ").slice(1).join(" ")
        if(!args)return message.reply("**أدخل الأسم الجديد**")
        let gg = client.user.setUsername(args).then(() =>{
            message.reply(` تم تغيير الأسم إلى: \`${args}\``)
        })
          let embed = new EmbedBuilder()
        embed.setColor("#2f3136")
        embed.setDescription("> `❌` | **ماذا؟! الأسم طويل جداً جداً**\n\n> **الحد الأقصى للأسم: `32` حرف**")
gg.catch(async err => await message.reply({ embeds: [embed] }))
  }else
    if(message.content.startsWith(prefix+"sa")){
        if(message.author.id != "1150890847768936458") return
        let args = message.content.split(" ")
        if(!args[1])return message.reply("**أحتاج إلى رابط الصورة**")
        let gg = client.user.setAvatar(args[1]).then(() =>{
            message.reply(`**تم تغيير الأفاتار إلى:**\n\`${args[1]}\``)
        })
            let embed = new EmbedBuilder()
        embed.setColor("#2f3136")
        embed.setDescription("> `❌` | **ماذا؟ هل هذا آفاتار؟**")
        gg.catch(err => message.reply({ embeds: [embed] }))
    }
      //console.log(client)
      if (!message.content.startsWith(prefix) || message.author.bot) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();
      try {
        let commandFiles = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));
        if (!commandFiles) return;
        if (commandFiles) {
          if (commandFiles.cooldown) {

            if (delay.has(`${commandFiles.name}-${message.author.id}`)) return message.reply(`You can use this command again after **${ms(delay.get(`${commandFiles.name}-${message.author.id}`) - Date.now(), { long: true }).includes('ms') ? '0 second' : ms(delay.get(`${commandFiles.name}-${message.author.id}`) - Date.now(), { long: true })}**`);

            commandFiles.execute(client, message, args);

            delay.set(`${commandFiles.name}-${message.author.id}`, Date.now() + commandFiles.cooldown);
            setTimeout(() => {
              delay.delete(`${commandFiles.name}-${message.author.id}`);
            }, commandFiles.cooldown);
          } else {
            commandFiles.execute(client, message, args);
          }
        }
      } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
      }
    } catch (err) {
      console.log(err)
    }
  }
  }
