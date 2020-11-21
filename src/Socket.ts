import { Manager } from "./Manager";
import ws from "ws";

import { Node, SocketStats } from "./index";

export class Socket {
  /**
   * The manager the socket is using
   * @type {Manager}
   */
  public manager: Manager;

  /**
   * The stats of the connected socket
   * @type {SocketStats}
   */
  public stats!: SocketStats;

  /**
   * If the socket is connected or not
   * @type {boolean}
   */
  public connected = false;

  /**
   * The ID of the node
   * @type {string}
   */
  public id!: string;

  /**
   * The host (address) to connect to
   * @type {string}
   */
  public host!: string;

  /**
   * The port lavalink is running on
   * @type {number}
   */
  public port!: number;

  /**
   * The password to authenticate with
   * @type {string}
   */
  public password = "youshallnotpass";

  /**
   * If to use a secure connection (https) when connecting
   * @type {boolean}
   */
  public https = false;

  /**
   * The websocket used to communicate with lavalink
   * @type {ws}
   */
  #ws!: ws;

  public constructor(manager: Manager, node: Node) {
    this.manager = manager;

    for (const [key, val] of Object.entries(node)) {
      //@ts-expect-error
      this[key] = val;
    }
  }

  /**
   * Connects to lavalink
   */
  public connect() {
    this.#ws = new ws(
      `ws${this.https ? "s" : ""}://${this.host}:${this.port}`,
      {
        headers: {
          Authorization: this.password,
          "User-Id": this.manager.options.user,
          "Num-Shards": this.manager.options.shards,
        },
      }
    );

    this.#ws
      .on("open", this._open.bind(this))
      .on("close", (code, reason) => this._close(code, reason))
      .on("error", (err) => this._error(err))
      .on("message", (data) => this._message(data));
  }

  /**
   * When the websocket opens
   * @private
   */
  private _open() {
    this.connected = true;
    this.manager.emit("socketConnected", this);
  }

  /**
   * When the websocket closes
   * @param {number} code The close code
   * @param {string} reason The reason the websocket closed
   * @private
   */
  private _close(code: number, reason: string) {
    this.manager.emit("socketClosed", this, code, reason);
  }

  /**
   * When the websocket errors
   * @param {Error} error the error
   * @private
   */
  private _error(error: Error) {
    this.manager.emit("socketError", this, error);
  }

  private _message(data: any) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      this.manager.emit(
        "socketError",
        this,
        new Error("Could not parse response from lavalink")
      );
    }

    switch (data.op) {
      case "stats":
        this.stats = data;

        //@ts-expect-error
        delete this.stats.op;
        break;

      case "playerUpdate":
        const player = this.manager.players.get(data.guildId);
        if (player) {
          player.position = data.state.position;
        }
        break;
    }
  }

  public send(op: string, data?: Record<string, any>) {
    return this.#ws.send(JSON.stringify({ op, ...data }))
  }
}