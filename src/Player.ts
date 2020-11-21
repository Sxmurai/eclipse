import { EventEmitter } from "events";
import { Manager } from "./Manager";
import { Node } from "./Node";

interface PlayOptions {
  startTime?: number;
  endTime?: number;
  replace?: boolean;
}

interface ConnectOptions {
  deaf?: boolean;
  // idfk why youd want this but aight, whatever you say lavalink
  mute?: boolean;
}

export class Player extends EventEmitter {
  public playing = false;
  public paused = false;
  public volume = 100;
  public position = 0;
  public connected = false;
  public track!: string;

  public node: Node;
  public manager: Manager;

  public guild: string;
  public channel?: string;

  private _server: any;
  private _state: any;

  public constructor(node: Node, manager: Manager, guild: string) {
    super();

    this.node = node;
    this.manager = manager;
    this.guild = guild;
  }

  public provide(update: any) {
    if ("token" in update) {
      this._server = update
    } else {
      this._state = update;
    }

    return;
  }

  private sendVoiceUpdate() {
    if (!this._state || !this._server) {
      return;
    }

    this.send("voiceUpdate", {
      sessionId: this._state.session_id,
      event: this._server
    })

    delete this._server;
    delete this._state;
  }

  public connect(channel?: string, options: ConnectOptions = {}) {
    this.manager.options.send(this.guild, {
      op: 4,
      d: {
        guild_id: this.guild,
        channel_id: channel ?? null,
        self_deaf: options.deaf ?? false,
        self_mute: options.mute ?? false
      }
    });

    this.channel = channel;
    return this.connected = true;
  }

  public play(track: string, options: PlayOptions = {}) {
    this.send("play", {
      track,
      ...options
    });

    this.playing = true;
    this.track = track;
  }

  public stop() {
    return this.send("stop");
  }

  public pause(pause = true) {
    this.paused = pause;
    return this.send("pause", { pause });
  }

  public resume() {
    return this.pause(false);
  }

  public seek(position: number) {
    return this.send("seek", { position });
  }

  public setVolume(volume: number) {
    this.volume = volume;
    return this.send("volume", { volume });
  }

  public send(op: string, data?: Record<string, any>) {
    return this.node.send(op, { guildId: this.guild, ...data });
  }
}
