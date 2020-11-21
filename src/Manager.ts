import type { ManagerOptions } from "./index";
import { EventEmitter } from "events";

import { Socket } from "./Socket";
import { Player } from "./Player";

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
}