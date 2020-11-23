export * from "./Manager";
export * from "./Socket";
export * from "./Player";

export interface Node {
  /**
   * The ID of the Node
   * @type {string}
   */
  id: string;

  /**
   * The host (address) to connect to
   * @type {string}
   */
  host: string;

  /**
   * The port that is running lavalink
   * @type {number}
   */
  port: number;

  /**
   * The password to authenticate with
   * @type {?string}
   */
  password?: string;

  /**
   * If to use a secure (https) connection
   * @type {?boolean}
   */
  https?: boolean;
}

export interface ManagerOptions {
  /**
   * The nodes to connect to
   * @type {Node[]}
   */
  nodes: Node[];
  
  /**
   * The shard count
   * @type {?number}
   */
  shards?: number;

  /**
   * The user ID to use
   * @type {string}
   */
  user: string;

    /**
   * The resume options
   * @type {?Resume}
   */
  resume?: Resume;

  /**
   * The function to send things to discord
   * @type {((id: string, payload: any) => any)}
   */
  send: ((id: string, payload: any) => any);
}

interface Resume {
  timeout?: number;
  key?: string;
  enabled: boolean
}

export interface ConnectOptions {
  /**
   * If to deafen the bot upon joining the voice channel
   * @type {?boolean}
   */
  deafen?: boolean;

  /**
   * If to mute the bot upon joining the voice channel
   * @type {?boolean}
   */
  mute?: boolean;
}

export interface PlayOptions {
  /**
   * The time in milliseconds to start the track
   * @type {?number}
   */
  startTime?: number;

  /**
   * The time in milliseconds to end the track at
   * @type {?number}
   */
  endTime?: number;

  /**
   * If to not replace the current track when Player#play is called
   * @type {?boolean}
   */
  noReplace?: boolean;
}

export interface SocketStats {
  /**
   * The memory being used
   * @type {MemoryStats}
   */
  memory: MemoryStats;

  /**
   * The CPU usage information
   * @type {CPUStats}
   */
  cpu: CPUStats;

  /**
   * The time the socket has been alive
   * @type {number}
   */
  uptime: number;

  /**
   * The amount of players that are playing
   * @type {number}
   */
  playingPlayers: number;

  /**
   * The amount of players that are spawned
   * @type {number}
   */
  players: number;
}

interface MemoryStats {
  /**
   * The amount of RAM that is reservable
   * @type {number}
   */
  reservable: number;

  /**
   * The amount of RAM that is being used
   * @type {number}
   */
  used: number;

  /**
   * The amount of RAM that is free
   * @type {number}
   */
  free: number;

  /**
   * The amount of RAM that is allocated to your computing device
   * @type {number}
   */
  allocated: number;
}

interface CPUStats {
  /**
   * The amount of cores your CPU has
   * @type {number}
   */
  cores: number;

  /**
   * The amount of CPU usage the system is using alone
   * @type {number}
   */
  systemLoad: number;
  
  /**
   * The amount of CPU usage that lavalink is using
   * @type {number}
   */
  lavalinkLoad: number;
}