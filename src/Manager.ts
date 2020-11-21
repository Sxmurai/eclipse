import { EventEmitter } from "events";
import { Node, NodeType } from "./Node";

interface ManagerOptions {
  nodes: NodeType[];
  shards?: number;
  userID: string;
}

export class Manager extends EventEmitter {
  public options: ManagerOptions;
  public nodes = new Map<string, Node>();

  public constructor(options: ManagerOptions) {
    super();

    options.shards = options.shards ?? 1;
    if (options.shards < 1) {
      options.shards = 1;
    }

    this.options = options;
  }

  public connect() {
    if (!this.options.nodes.length) {
      this.emit("error", new Error("No nodes were provided"));
    }

    for (const supplied of this.options.nodes) {
      const node = new Node(supplied, this.options.userID, this.options.shards);

      node
        .on("error", (err: Error) => this.emit("error", err))
        .on("opened", (data: any) => this.emit("opened", data))
        .on("closed", (code, reason) => this.emit("closed", code, reason));

      this.nodes.set(node.id, node);

      node.connect();
    }
  }
}
