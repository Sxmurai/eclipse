import { EventEmitter } from "events";
import { Manager } from "./Manager";
import { Socket } from "./Socket";

import { PlayOptions, ConnectOptions } from "./index";

export class Player extends EventEmitter {
  /**
   * If the player has been connected to a voice channel
   * @type {boolean}
   */
  public connected = false;

  /**
   * If the player is playing a track or not
   * @type {boolean}
   */
  public playing = false;

  /**
   * If the player has been paused
   * @type {boolean}
   */
  public paused = false;

  /**
   * The volume the player is at
   * @type {number}
   */
  public volume = 50;

  /**
   * The position of the currently playing track
   * @type {number}
   */
  public position = 0;

  /**
   * The current track
   * @type {string}
   */
  public track!: string;

  /**
   * The socket the player will use to send data
   * @type {Socket}
   */
  public socket: Socket;

  /**
   * The manager the player will use
   * @type {Manager}
   */
  public manager: Manager;

  /**
   * The guild the player was spawned in
   * @type {string}
   */
  public guild: string;

  /**
   * The voice channel ID the channel is connected to
   * @type {string}
   */
  public channel!: string;

  /**
   * The server update
   * @type {Record<string, any>}
   * @private
   */
  _server?: Record<string, any> | null;

  /**
   * The server update
   * @type {Record<string, any>}
   * @private
   */
  _state?: Record<string, any> | null;

  public constructor(manager: Manager, socket: Socket, guild: string) {
    super();

    this.manager = manager;
    this.socket = socket;
    this.guild = guild;
  }

  /**
   * Handles the voice packets from discord
   * @param {Record<string, any>} update
   */
  public handleVoice(update: Record<string, any>) {
    if (update.token) {
      this._server = update;
    } else {
      this._state = update
    }

    if (this._server && this._state) {
      this.sendVoiceUpdate();
    }
  }

  /**
   * Sends the voice updates
   * @private
   */
  private sendVoiceUpdate() {
    if (!this._state || !this._state) {
      return;
    }

    this.send("voiceUpdate", {
      sessionId: this._state.session_id,
      event: this._server
    })

    delete this._server;
    delete this._state;
  }

  public connect(channel: string, options: ConnectOptions = {}) {
    this.manager.options.send(this.guild, {
      op: 4,
      d: {
        guild_id: this.guild,
        channel_id: channel,
        self_deaf: options.deafen ?? false,
        self_mute: options.mute ?? false
      }
    });

    this.channel = channel;
    this.connected = true;

    this.setVolume(this.volume);

    return this;
  }

  public disconnect() {
    this.manager.options.send(this.guild, {
      op: 4,
      d: {
        guild_id: this.guild,
        channel_id: null,
        self_deaf: null,
        self_mute: null
      }
    });

    this.connected = false;

    return this.connected;
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

  public pause(state = true) {
    this.paused = state;
    return this.send("pause", { state });
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
    return this.socket.send(op, { guildId: this.guild, ...data });
  }
}

export interface Player {
  /**
   * When a new track has started
   * @param {"start"} event 
   * @param {(track: string) => any} listener 
   * @return {this}
   */
  on(event: "start", listener: (track: string) => any): this;

  /**
   * When a track has ended
   * @param {"end"} event 
   * @param {(reason?: string) => any} listener
   * @return {this} 
   */
  on(event: "end", listener: (reason?: string) => any): this;

  /**
   * When the track has emitted an error
   * @param {"error"} event 
   * @param {(error: Error) => any} listener
   * @return {this} 
   */
  on(event: "error", listener: (error: Error) => any): this;

  /**
   * When a track gets stuck
   * @param {"stuck"} event 
   * @param {(thresholdMs: number) => any} listener
   * @return {this} 
   */
  on(event: "stuck", listener: (thresholdMS: number) => any): this;

  /**
   * When the websocket closes during the track
   * @param {"closed"} event 
   * @param {(event: StuckEvent) => any} listener 
   * @return {this}
   */
  on(event: "closed", listener: (event: StuckEvent) => any): this;
}

interface StuckEvent {
  reason?: string;
  code?: number;
  byRemote?: boolean
}