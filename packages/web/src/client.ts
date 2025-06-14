import { EventAPI, SessionAPI } from "./resources";

export type SenditlyConfig = {
  workspaceId: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export class Senditly {
  readonly config: Required<SenditlyConfig>;
  constructor(config: SenditlyConfig) {
    this.config = {
      ...config,
      fetch: config.fetch || window.fetch.bind(window),
      baseUrl: config.baseUrl || "https://api.senditly.ai/web/v1",
    };
  }

  private _event?: EventAPI;
  get event() {
    return this._event ??= new EventAPI(this);
  }

  private _session?: SessionAPI;
  get session() {
    return this._session ??= new SessionAPI(this);
  }
}
