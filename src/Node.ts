import { O_APPEND } from "constants";
import { EventEmitter } from "events";
import ws, { Data } from "ws";

export interface NodeType {
  id: string;
  address: string;
  port: number;
  password?: string;
}

interface Stats {
  memory: MemoryStats;
  cpu: CPUStats;
  uptime: number;
}

interface MemoryStats {
  reservable: number;
  used: number;
  free: number;
  allocated: number;
}

interface CPUStats {
  cores: number;
  systemLoad: number;
  lavalinkLoad: number;
}

export class Node extends EventEmitter {
  public userID: string;
  public connected = false;

  public stats!: Stats;

  public id: string;
  public address: string;
  public port: number;
  private password?: string;

  private socket!: ws;
  private shards: number;

  public constructor(options: NodeType, userID: string, shards = 1) {
    super();

    this.userID = userID;
    this.shards = shards;

    this.password = options.password = options.password ?? "youshallnotpass";
    this.address = options.address;
    this.port = options.port;
    this.id = options.id;
  }

  public connect() {
    // connect to the websocket
    this.socket = new ws(`ws://${this.address}:${this.port}`, {
      headers: {
        Authorization: this.password,
        "User-Id": this.userID,
        "Num-Shards": this.shards,
      },
    });

    // set the listeners
    this.socket
      .on("open", (data: Data) => this.emit("opened", this))
      .on("error", (err) => this.emit("error", err))
      .on("close", (code, reason) => this.emit("closed", code, reason))
      .on("message", (data) => this._message(data));

    this.on("opened", () => (this.connected = true));
  }

  private _message(data: any) {
    try {
      data = JSON.parse(data.toString());
    } catch {
      this.emit("error", new Error("Could not parse recieved data"));
    }

    switch (data.op) {
      case "stats":
        const { memory, cpu, uptime } = data;

        this.stats = {
          memory,
          cpu,
          uptime,
        };
        break;
    }

    //console.log(data);
  }
}
