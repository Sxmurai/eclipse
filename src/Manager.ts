import type { ManagerOptions } from "./index";
import { EventEmitter } from "events";

import { Socket } from "./Socket";
import { Player } from "./Player";

import fetch from "node-fetch";
import { parse } from "url";

export class Manager extends EventEmitter {
  public options: ManagerOptions;

  public sockets = new Map<string, Socket>();
  public players = new Map<string, Player>();

  public constructor(options: ManagerOptions) {
    super();

    options.shards = options.shards
      ? options.shards < 1
        ? (options.shards = 1)
        : options.shards
      : 1;

    options.resume = options.resume ?? { enabled: false };

    this.options = options;
  }

  public update(voice: Record<string, any>) {
    const player = this.players.get(voice.guild_id);

    if (player) {
      player.handleVoice(voice);
    }
  }

  public connect() {
    if (!this.options.nodes.length) {
      this.emit(
        "error",
        new Error("No nodes were provided to connect to. ManagerOptions#nodes")
      );
    }

    for (const node of this.options.nodes) {
      const socket = new Socket(this, node);
      socket.connect();

      this.sockets.set(socket.id, socket);
    }
  }

  public spawn(guild: string, node?: Socket) {
    node = node ?? [...this.sockets.values()][0];

    let player = this.players.get(guild);
    if (!player) {
      player = new Player(this, node, guild);
      this.players.set(guild, player);
    }

    return player;
  }

  public search(term: string, node?: Socket) {
    node = node ?? [...this.sockets.values()][0];

    if (!["https:", "http:"].includes(parse(term).protocol!)) {
      term = ["ytsearch:", "scearch:"].includes(term)
        ? term
        : `ytsearch:${encodeURIComponent(term)}`;
    }

    return fetch(
      `http${node.https ? "s" : ""}://${node.host}:${
        node.port
      }/loadtrack?identifier=${term}`,
      {
        headers: {
          authentication: node.password,
        },
      }
    ).then((res) => res.json())
  }
}
