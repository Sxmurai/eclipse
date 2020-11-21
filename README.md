<div align="center">
  <h1>eclipse.js</h1>
  <h4>A generic lavalink client</h4>
</div>

## Disclaimers

This package is in beta, therefore the player events (such as when the track ends) is not implemented. So until then, don't use this.

## Examples

eris:

```js
const { Client } = require("eris");
const { Manager } = require("eclipse.js");

const fetch = require("node-fetch");

const client = new Client("token");
client.music = new Manager({
  nodes: [
    {
      id: "Node 1",
      host: "localhost",
      port: 2333,
    },
  ],
  shards: 1,
  user: "your bots user id",
  send(id, payload) {
    const guild = client.guilds.get(id);
    if (guild) {
      guild.shard.sendWS(payload.op, payload.d, false);
    }

    return;
  },
});

const fetchTrack = (search) => {
  return fetch(
    `http://localhost:2333/loadtracks?identifier=${encodeURIComponent(
      `ytsearch: The Kid LAROI - So Done`
    )}`,
    {
      authorization: "youshallnotpass",
    }
  ).then((res) => res.json());
};

client
  .on("ready", () => console.log(`${client.user.username} is ready.`))
  .on("rawWS", (packet) => {
    if (
      packet.op === 0 &&
      ["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(packet.t)
    ) {
      const player = bot.music.players.get(packet.d.guild_id);
      if (player) {
        bot.music.update(packet.d);
      }
    }
  })
  .on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith("?")) {
      return;
    }

    const [cmd, ...args] = message.content.slice(1).trim().split(/ +/g);

    switch (cmd) {
      case "play":
      case "p":
        if (!args[0]) {
          return message.channel.createMessage("Please provide a song name");
        }

        if (!message.member.voiceState.channelID) {
          return message.channel.createMessage("Please join a voice channel");
        }

        let player = client.music.players.get(message.guildID);
        if (player && player.playing) {
          return message.channel.createMessage(
            "There is already something playing!"
          );
        }

        const { tracks } = await fetchTrack(args.join(" "));
        if (!tracks.length) {
          return message.channel.createMessage(
            "Couldn't find anything for that."
          );
        }

        player = client.music.spawn(message.guildID);

        if (!player.connected) {
          player.connect(message.member.voiceState.channelID);
        }

        message.channel.createMessage(`Playing: ${tracks[0].info.title}`);

        if (!player.playing && !player.paused) {
          player.play(tracks[0].track);
        }
        break;
    }
  });

client.music.connect();
client.connect();
```

---

> Under a GPL-3.0 license