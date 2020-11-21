import { EventEmitter } from "events";
import ws, { Data } from "ws";

export interface NodeType {
  id: string;
  address: string;
  port: number;
  password?: string;
}

export class Node extends EventEmitter {
  public options: NodeType;
  public userID: string;
  public connected = false;

  private socket!: ws;
  private shards: number;

  public constructor(options: NodeType, userID: string, shards = 1) {
    super();

    this.userID = userID;
    this.shards = shards;

    options.password = options.password ?? "youshallnotpass";
    this.options = options;
  }

  public connect() {
    // connect to the websocket
    this.socket = new ws(`ws://${this.options.address}:${this.options.port}`, {
      headers: {
        Authorization: this.options.password,
        "User-Id": this.userID,
        "Num-Shards": this.shards,
      },
    });

    // set the listeners
    this.socket
      .on("open", (data: Data) => this.emit("opened", data))
      .on("error", (err) => this.emit("error", err))
      .on("close", (code, reason) => this.emit("closed", code, reason))
      .on("message", (data) => this._message(data));

    this.on("opened", () => (this.connected = true));
  }

  private _message(data: Data) {
    try {
      data = JSON.parse(data.toString());
    } catch {
      this.emit("error", new Error("Could not parse recieved data"));
    }

    console.log(data);
  }
}
