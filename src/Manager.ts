import { EventEmitter } from "events";
import { Node, NodeType } from "./Node";

import { Player } from "./Player";

interface ManagerOptions {
  nodes: NodeType[];
  shards?: number;
  userID: string;
  send: ((guild: string, data: Record<string, any>) => any);
}

export class Manager extends EventEmitter {
  public options: ManagerOptions;
  
  public nodes = new Map<string, Node>();
  public players = new Map<string, Player>();

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
      const node = new Node(this, supplied);
      node.connect();

      this.nodes.set(node.id, node);
    }
  }

  public spawn(guild: string, node: Node) {
    let player = this.players.get(guild);
    if (player) {
      return player;
    }

    player = new Player(node, this, guild);
    this.players.set(guild, player);

    return player;
  }
}
