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

    return fetch(
      `http${node.https ? "s" : ""}://${node.host}:${
        node.port
      }/loadtracks?identifier=${term}`,
      {
        headers: {
          authentication: node.password,
        },
      }
    ).then((res) => res.json())
  }
}

export interface Manager {
  /**
   * When a socket has emitted the ready event
   * @param {"socketReady"} event 
   * @param {(socket: Socket) => any} listener 
   * @return {this}
   */
  on(event: "socketReady", listener: (socket: Socket) => any): this;

  /**
   * When the socket has emitted the closed event
   * @param {"socketClosed"} event 
   * @param {(socket: Socket, code?: number, reason?: string) => any} listener
   * @return {this} 
   */
  on(event: "socketClosed", listener: (socket: Socket, code?: number, reason?: string) => any): this;

  /**
   * When the websocket errors
   * @param {"socketError"} event 
   * @param {(socket: Socket, error: Error) => any} listener
   * @return {this} 
   */
  on(event: "socketError", listener: (socket: Socket, error: Error) => any): this;
}