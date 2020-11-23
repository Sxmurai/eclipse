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
    const headers: any = {
      Authorization: this.password,
      "User-Id": this.manager.options.user,
      "Num-Shards": this.manager.options.shards,
    };

    if (
      this.manager.options.resume!.enabled &&
      this.manager.options.resume!.key
    ) {
      headers["Resume-Key"] = this.manager.options.resume!.key;
    }

    this.#ws = new ws(
      `ws${this.https ? "s" : ""}://${this.host}:${this.port}`,
      {
        headers,
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
    if (this.manager.options.resume?.enabled) {
      this.manager.options.resume!.key =
        this.manager.options.resume!.key ?? Math.random().toString(36);

      this.manager.options.resume!.timeout =
        this.manager.options.resume!.timeout ?? 60;

      this.send("configureResuming", {
        key: this.manager.options.resume.key,
        timoeut: this.manager.options.resume.timeout,
      });
    }

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

    const player = this.manager.players.get(data.guildId);

    switch (data.op) {
      case "event":
        switch (data.type) {
          case "TrackStartEvent":
            player!.track = data.track;
            player!.emit("start", player!.track);
            break;

          case "TrackEndEvent":
            //@ts-expect-error
            player!.track = null;
            player!.emit("end", data.reason);
            break;

          case "TrackExceptionEvent":
            player!.emit("error", new Error(data.error));
            break;

          case "TrackStuckEvent":
            player!.emit("stuck", data.thresholdMs);
            break;

          case "WebSocketClosedEvent":
            player!.emit("closed", {
              reason: data.reason,
              code: data.code,
              remote: data.byRemote,
            });
            break;

          default:
            console.warn(
              `Unknown event type, here is the raw data:\n\n${JSON.stringify(
                data
              )}`
            );
            break;
        }
        break;

      case "stats":
        this.stats = {
          memory: data.memory,
          cpu: data.cpu,
          uptime: data.uptime,
          playingPlayers: data.playingPlayers,
          players: data.players,
        };
        break;

      case "playerUpdate":
        if (player) {
          player.position = data.state.position;
        }
        break;
    }
  }

  public send(op: string, data?: Record<string, any>) {
    return this.#ws.send(JSON.stringify({ op, ...data }));
  }
}
