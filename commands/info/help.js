const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder } = require("discord.js");
const { glob } = require("glob");
const { promisify } = require("util");
const { prefix } = require('../../config.json');
const { Utils } = require("devtools-ts");
const utilites = new Utils();

module.exports = {
    name: "help",
    description: 'Feeling lost?',
    cooldown: 5000,
    async execute(client, message, args) {
        try {
            const globPromise = promisify(glob);
            const commandFiles = await globPromise(`${process.cwd()}/commands/music/**/*.js`);

            let embed = new EmbedBuilder()
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            commandFiles.map((value) => {
                const file = require(value);
                const splitted = value.split("/");
                const directory = splitted[splitted.length - 2];

                if (file.name) {
                    const properties = { directory, ...file };
                  
                  embed.setAuthor({ name: `${message.guild.name}`, iconURL: message.guild.iconURL({ dynamic: true })})
                  embed.setDescription(`**__Prefix:__** \`${prefix}\`\n**__Commands:__** \`${client.commands.size}\`\n**__Slash:__** \`${client.slashCommands.size}\`\n**__Developer:__** [𝐌𝐚𝐆𝐝𝐄𝐞](https://discord.com/users/1150890847768936458)\n`)
                    embed.addFields({ name: `<:line_ma:1229863001058840708> ${prefix}${properties.name} (${properties.aliases})` , value: `------------------`, inline: false})
                }
            });

            //let row = new ActionRowBuilder()
                /*.addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel('Invite Bot')
                        .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`))

                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel('Server Support')
                        .setURL(`https://discord.gg/developer-tools`)) */
          embed.setFooter({ text: `Requested by:  ${message.guild.members.cache.get(message.author.id).displayName}`, iconURL: message.author.displayAvatarURL({ dynamic: true })});

            message.reply({ embeds: [embed] })
        } catch (err) {
            console.log(err)
        }
    },
};
