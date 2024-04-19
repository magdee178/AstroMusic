const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Events,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectBuilder,
} = require("discord.js");
const client = require("../index");
const prefix = require('../config.json');
const config = require("../config.json");
const { DisTube, Song, SearchResultVideo } = require("distube");
const { DeezerPlugin } = require("@distube/deezer");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const wait = require('node:timers/promises').setTimeout;
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { Utils } = require("devtools-ts");
const utilites = new Utils();
const db = require(`quick.db`);
const { red } = require("colors");
const PlayerMap = new Map();

let spotifyoptions = {
	parallel: true,
	emitEventsAfterFetching: false,
};
if (config.spotify_api.enabled) {
	spotifyoptions.api = {
		clientId: config.spotify_api.clientId,
		clientSecret: config.spotify_api.clientSecret,
	};
}

const distube = new DisTube(client, {
	emitNewSongOnly: true,
	leaveOnEmpty: false,
	leaveOnFinish: false,
	leaveOnStop: false,
	savePreviousSongs: true,
	emitAddSongWhenCreatingQueue: true,
	emitAddListWhenCreatingQueue: true,
	searchSongs: 0,
	youtubeCookie: config.youtubeCookie,
	nsfw: false,
	emptyCooldown: 0,
	ytdlOptions: {
		highWaterMark: 1024 * 1024 * 64,
		quality: "highestaudio",
		format: "audioonly",
		liveBuffer: 60000,
		dlChunkSize: 1024 * 1024 * 4,
	},
	plugins: [
		new SpotifyPlugin(spotifyoptions),
		new SoundCloudPlugin(),
		new DeezerPlugin(),
	],
});

const status = (queue) => {
	try {
		`Volume: \`${queue.volume}%\` | Loop: \`${queue.repeatMode
			? queue.repeatMode === 2
				? "All Queue"
				: "This Song"
			: "Off"
			}\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\` | Filter: \`${queue.filters.join(", ") || "Off"
			}\``;
	} catch (err) {
		console.log(err);
	}
};

distube.on("initQueue", (queue) => {
	queue.autoplay = true;
	queue.volume = 100;
});

distube.on(`playSong`, async (queue, track) => {
	try {
		var newQueue = distube.getQueue(queue.id);
		var newTrack = track;
		var data = receiveQueueData(newQueue, newTrack);
		//Send message with buttons
		let currentSongPlayMsg = await queue.textChannel.send(data).then((msg) => {
			PlayerMap.set(`currentmsg`, msg.id);
			return msg;
		});

		//create a collector for the thinggy
		var collector = currentSongPlayMsg.createMessageComponentCollector({
			filter: (i) =>
				i.isButton() && i.user && i.message.author.id == client.user.id,
			time: track.duration > track.duration * 1000 * 60,
		});
		let lastEdited = false;
		/**
		 * @INFORMATION - EDIT THE SONG MESSAGE EVERY 10 SECONDS!
		 */
		try {
			clearInterval(songEditInterval);
		} catch (e) { }
		songEditInterval = setInterval(async () => {
			if (!lastEdited) {
				try {
					var newQueue = distube.getQueue(queue.id);
					var newTrack = newQueue.songs[0];
					var data = receiveQueueData(newQueue, newTrack);
					await currentSongPlayMsg.edit(data).catch((e) => { });
				} catch (e) {
					clearInterval(songEditInterval);
				}
			}
		}, 7000);

		collector.on("collect", async (i) => {
			lastEdited = true;
			setTimeout(() => {
				lastEdited = false
			}, 7000)

			//pause/resume
			if (i.customId == `3`) {
				let { member } = i;

				const { channel } = member.voice;

				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});

				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});

				if (newQueue.playing) {
					await distube.pause(i.guild.id);
					var data = receiveQueueData(
						distube.getQueue(queue.id),
						newQueue.songs[0]
					);
					currentSongPlayMsg.edit(data).catch((e) => {
						console.log(e);
					});

					i.reply({
						content: `:notes: Requests by **\`${member.user.tag}\`** - Paused!`
					});
					await wait(7000);
					await i.deleteReply()
				} else {
					//pause the player
					await distube.resume(i.guild.id);
					var data = receiveQueueData(
						distube.getQueue(queue.id),
						newQueue.songs[0]
					);
					currentSongPlayMsg.edit(data).catch((e) => {
						console.log(e);
					});

					i.reply({
						content: `:notes: Requests by **\`${member.user.tag}\`** - Resumed!`,
					});
					await wait(7000);
					await i.deleteReply()
				}
			}
			//Forward
			if (i.customId == `8`) {
				let { member } = i;

				const { channel } = member.voice;

				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});

				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});
				let seektime = newQueue.currentTime + 10;
				if (seektime >= newQueue.songs[0].duration)
					seektime = newQueue.songs[0].duration - 1;
				await newQueue.seek(Number(seektime));

				i.reply({
					content: `:notes: Requests by **\`${member.user.tag}\`** - Forwarded the song for \`10 Seconds\`!`
				});
				await wait(7000);
				await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
			}
      			if (i.customId == `0`) {
				let { member } = i;

				const { channel } = member.voice;

				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});

				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});
     var embed = new EmbedBuilder()
			.setAuthor({ name: `${client.user.username}`, url: `${client.user.avatarURL({ dynamic: true })}` })
			.setColor("#ff0000")
			.setDescription(`**للتواصل مع المطور:** __[اضغط هنا](https://discord.com/users/1150890847768936458)__\n**سيرفر الدعم الفني:** __[SOON](https://twitch.tv/4egy)__`);
		i.reply({ embeds: [embed], ephemeral: true })
			/*	i.reply({
					content: `hi`
				});*/
				//await wait(7000);
			//	await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
            }
			//Rewind
			if (i.customId == `9`) {
				let { member } = i;

				const { channel } = member.voice;

				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});

				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});
				let seektime = newQueue.currentTime - 10;
				if (seektime < 0) seektime = 0;
				if (seektime >= newQueue.songs[0].duration - newQueue.currentTime)
					seektime = 0;
				await newQueue.seek(Number(seektime));
				i.reply({
					content: `:notes: Requests by **\`${member.user.tag}\`** - Rewinded the song for \`10 Seconds\`!`
				});
				await wait(7000);
				await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
			}
			//volume +10
			if (i.customId == `11`) {
				let { member } = i;
				const { channel } = member.voice;
				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});
				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});

				let newvolume = newQueue.volume + 10;
				let oldvolume = newQueue.volume;
				if (newvolume >= newQueue.songs[0].duration)
					newvolume = newQueue.songs[0].duration - 1;

				if (newvolume < 0 || newvolume > 150 || isNaN(newvolume))
					return i.reply({
						content:
							":no_entry_sign: **Volume must be a valid integer between 0 and 150!**",
						ephemeral: true,
					});
				if (newvolume < 0) newvolume = 0;
				if (newvolume > 150) newvolume = 150;

				await newQueue.setVolume(Number(newvolume));
				i.reply({
					content: `:loud_sound: Requests by **\`${member.user.tag}\`** - Volume changed from \`${oldvolume}\` to \`${newvolume}\``
				});
				await wait(7000);
				await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
			}
			//volume -10
			if (i.customId == `12`) {
				let { member } = i;
				const { channel } = member.voice;
				if (!channel)
					return i.reply({
						content: `:no_entry_sign: You must join a voice channel to use that!`,
						ephemeral: true,
					});
				if (channel.id !== newQueue.voiceChannel.id)
					return i.reply({
						content: `:no_entry_sign: You must be listening in \`${channel.name}\` to use that!`,
						ephemeral: true,
					});

				let newvolume = newQueue.volume - 10;
				let oldvolume = newQueue.volume;
				if (newvolume >= newQueue.songs[0].duration)
					newvolume = newQueue.songs[0].duration - 1;

				if (newvolume < 0 || newvolume > 150 || isNaN(newvolume))
					return i.reply({
						content:
							":no_entry_sign: **Volume must be a valid integer between 0 and 150!**",
						ephemeral: true,
					});
				if (newvolume < 0) newvolume = 0;
				if (newvolume > 150) newvolume = 150;

				await newQueue.setVolume(Number(newvolume));
				i.reply({
					content: `:loud_sound: Requests by **\`${member.user.tag}\`** - Volume changed from \`${oldvolume}\` to \`${newvolume}\``
				});
				await wait(7000);
				await i.deleteReply()
				var data = receiveQueueData(
					distube.getQueue(queue.id),
					newQueue.songs[0]
				);
				currentSongPlayMsg.edit(data).catch((e) => {
					console.log(e);
				});
			}
		});
	} catch (err) {
		console.log(err);
	}
});


distube.on("addSong", (queue, song) => {
	try {
		queue.textChannel.send({
			embeds: [
				new EmbedBuilder()

					.setAuthor({ name: `Add song` })
					.setThumbnail(`https://cdn.discordapp.com/attachments/1209398050074796042/1229652573095723058/Picsart_24-04-16_06-28-37-009.png?ex=66307633&is=661e0133&hm=3c9bd14cd6047a10b18f20a7b68720db3ded924f3f5673ee2768007ffb140def&`)
					.setDescription(`**_Song Name:_** [${song.name}](${song.url})\n**_Duraion:_**   [\`${song.formattedDuration}\`]\n**_Added by:_**\n${song.user}`)
        .setTimestamp()
					.setFooter({
            text: `${queue.textChannel.guild.name}`,
            iconURL: `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`
					}),
			],
		},
			console.log(`addSong ${song.name}`)
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("playList", (message, queue, playlist, song) => {
	try {
		queue.textChannel.send(
			{
				embeds: [
					new EmbedBuilder()

						.setAuthor({ name: `Playling playlist` })
						.setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
						.addFields(
							{
								name: "Playlist:",
								value: `\`${playlist.name}\`  -  \`${playlist.songs.length} songs\``,
								inline: true,
							},
							{
								name: "playing Song:",
								value: `\`${song.name}\`  -  \`${song.formattedDuration}\``,
								inline: true,
							}
						)
						.setFooter({
							text: `Added by  ${song.user.username}`,
							iconURL: song.user.avatarURL(),
						}),
				],
			},
			console.log(`playList ${playlist.name} - ${playlist.songs.length}`)
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("addList", (queue, playlist) => {
	try {
		queue.textChannel.send(
			{
				embeds: [
					new EmbedBuilder()

						.setAuthor({ name: `Add List` })
						.setThumbnail(`https://img.youtube.com/vi/${playlist.id}/mqdefault.jpg`)

						.setDescription(`**Added [${playlist.name}](${playlist.url}) playlist (${playlist.songs.length}) songs**`)
						.setFooter({
							text: `Added by ${playlist.user.username}   |  Duration: [${playlist.formattedDuration}]`,
							iconURL: playlist.user.avatarURL(),
						}),
				],
			},
			console.log(`addList ${playlist.name} - ${playlist.songs.length - 1}`)
		);
	} catch (err) {
		console.log(err);
	}
});

distube.on("noRelated", (queue) => {
	try {
		console.log("Can't find related video to play.");
	} catch (err) {
		console.log(err);
	}
});

distube.on("error", (message, textChannel, e) => {
	try {
		var embed = new EmbedBuilder()
			.setAuthor({ name: `Error` })
			.setColor("#470000")
			.setDescription(e);
		message.reply({ embeds: [embed] })
	} catch (err) {
		console.log(e);
	}
});

distube.on(`deleteQueue`, (queue) => {
	try {

		var embed = new EmbedBuilder()
			.setAuthor({ name: `Finish Queue` })
			.setDescription(`There are no more songs to play.\nYou can activate \`/autoplay\` so that the queue never ends`)
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					if (queue.songs.length == 0) {
						currentSongPlayMsg.edit({ embeds: [embed], components: [] })
					}
				}, 1000)
			}).catch((e) => { }),
			console.log(`finish queue`);
	} catch (err) {
		console.log(err);
	}
});

distube.on("finish", (queue) => {
	try {
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ components: [] })
				}, 1000)
			}).catch((e) => { }),
			console.log(`finish`);
	} catch (err) {
		console.log(err);
	}
});

distube.on(`finishSong`, (queue, song) => {
	try {
		var embed = new EmbedBuilder()
			.setAuthor({ name: `Finish Song` })
			.setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
			.setDescription(`**[${song.name}](${song.url})**\n`)
			.setFooter({
				text: `Added by ${song.user.username}  |  Duration: [${song.formattedDuration}]`,
				iconURL: song.user.avatarURL(),
			});
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ embeds: [embed], components: [] })
				}, 1000)
			}).catch((e) => { }),

			console.log(`finishSong ${song.name}`);
	} catch (err) {
		console.log(err);
	}
});

distube.on("disconnect", (queue) => {
	try {
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ components: [] })
				}, 1000)
			}).catch((e) => { }),
			console.log(`The voice channel is Disconnected! Leaving the voice channel!`);
	} catch (err) {
		console.log(err);
	}
});

distube.on("empty", (queue) => {
	try {
		queue.textChannel.messages
			.fetch(PlayerMap.get(`currentmsg`))
			.then((currentSongPlayMsg) => {
				setTimeout(() => {
					currentSongPlayMsg.edit({ components: [] })
				}, 1000)
			}).catch((e) => { }),
			console.log(`The voice channel is empty! Leaving the voice channel!`);
	} catch (err) {
		console.log(err);
	}
});

// DisTubeOptions.searchSongs > 1
distube.on("searchResult", (message, result) => {
	try {
		let i = 0;
		message.channel.send({
			embeds: [
				new EmbedBuilder()

					.setDescription(
						`${result
							.map(
								(song) =>
									`**${++i}**. ${song.name} - \`${song.formattedDuration}\``
							)
							.join("\n")}`
					)
					.setFooter({
						text: `Enter anything else or wait 30 seconds to cancel`,
					}),
			],
			content: `Choose an option from below`,
		});
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchCancel", (message) => {
	try {
		message.channel.send("Searching canceled");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchInvalidAnswer", (message) => {
	try {
		message.channel.send("Invalid number of result.");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchNoResult", (message) => {
	try {
		message.channel.send("No result found!");
	} catch (err) {
		console.log(err);
	}
});

distube.on("searchDone", () => { });

function receiveQueueData(newQueue, newTrack) {
	try {
		if (!newTrack) return textChannel.send({ content: `No song found!` });

		var embed = new EmbedBuilder()

			.setAuthor({ name: `Now Playing` })
			.setThumbnail(`https://cdn.discordapp.com/attachments/1209398050074796042/1229652560575594536/Picsart_24-04-16_06-30-23-925.png?ex=66307630&is=661e0130&hm=be46fbb77e59aad6d16e3aef3092aaa9cb07e732125a0483259e83d02fe8b9b8&`)
			.setDescription(`**_Song Name:_** [${newTrack.name}](${newTrack.url})`)
			.addFields({
				name: `Current Duration:`,
				value: `\`${newQueue.formattedCurrentTime}/${newTrack.formattedDuration}\``,
				inline: true,
			})
      .addFields({
        name: `Reqeuster:`,
        value: `<@${newTrack.user.id}>`,
        inline: true,
      })
			.setFooter({
				text: `Volume: ${newQueue.volume}%`,
				iconURL: newTrack.user.avatarURL(),
			})
    .setTimestamp();
    
		let pause = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("3")
      .setLabel("P/R")
			.setEmoji("<:pause_ma:1229652940004786261>");

		/*let forward = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("8")
			.setEmoji("1024997006382473288"); //.setLabel(`+10 Sec`)
		let rewind = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("9")
			.setEmoji("1024997936196751430"); //.setLabel(`-10 Sec`) */
		let volumeup = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("11")
      .setLabel("Vol_UP")
			.setEmoji("<:Vol_up:1229653118996713522>");
		let volumedown = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("12")
      .setLabel("Vol_Down")
			.setEmoji("<:vol_down:1229653227721588746>");
    let about = new ButtonBuilder()
			.setStyle("Secondary")
			.setCustomId("0")
      .setLabel("Developer")
			.setEmoji("<:dev_ma:1229652686711033856>");

		const row = new ActionRowBuilder().addComponents([
			volumedown,
		//	rewind,
			pause,
			//forward,
			volumeup,
      about,
		]);

		return {
			embeds: [embed],
			components: [row],
		};
	} catch (err) {
		console.log(err);
	}
}

module.exports = distube;
		
