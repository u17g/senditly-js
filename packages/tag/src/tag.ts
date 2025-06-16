import Senditly, { EventTrackRequest, SenditlyConfig, SessionIdentifyRequest } from "@senditly/web";
import { isBot } from "./utils/bot";
import { listenUrlChange } from "./utils/observer";
import type { SenditlyTagPlugin } from "./plugin";

export type { SessionIdentifyRequest, EventTrackRequest };

export type SenditlyTagOptions = {
  /**
   * Whether to track page view events automatically.
   * true by default.
   */
  autoTrackPageView?: boolean;
  /**
   * plugins
   */
  plugins?: SenditlyTagPlugin[];
}
export type SenditlyTagConfig = (SenditlyConfig | { client: Senditly }) & SenditlyTagOptions;

export class SenditlyTag {
  private readonly _client: Senditly;
  public get client(): Senditly {
    return this._client;
  }

  private readonly _isBot: boolean;
  private readonly _waitForInit: Promise<void>;
  private _initFailed: boolean;

  constructor(config: SenditlyTagConfig) {
    const { autoTrackPageView, plugins, ...rest } = config;
    this._client = "client" in config ? config.client : new Senditly(rest as SenditlyConfig);
    this._isBot = isBot();
    this._waitForInit = this.initSession();
    this._initFailed = false;

    if (plugins) {
      plugins.forEach((plugin) => {
        plugin.init(this);
      });
    }

    if (autoTrackPageView !== false) {
      this.page();
      listenUrlChange(() => {
        this.page();
      });
    }
  }

  private async initSession(): Promise<void> {
    if (this._isBot) {
      return;
    }
    await this._client.session.start({}).catch((error) => {
      this._initFailed = true;
      console.error("failed to init session", error);
    });
  }

  private async waitForReady(): Promise<boolean> {
    if (this._isBot) {
      return false;
    }
    await this._waitForInit;
    if (this._initFailed) {
      return false;
    }
    return true;
  }

  /**
   * Identify the user with an email.
   * @param email - The email of the user.
   * @param properties - The properties of the user.
   * @param mailingLists - The mailing lists that the user is subscribed to.
   */
  public async identify<Properties extends {} = {}, MailingLists extends { [key: string]: boolean } = {}>(event: SessionIdentifyRequest<Properties, MailingLists>) {
    if (!await this.waitForReady()) {
      return;
    }
    await this._client.session.identify(event);
  }

  public async track<Payload extends {} = {}>(event: EventTrackRequest<Payload>) {
    if (!await this.waitForReady()) {
      return;
    }
    await this._client.event.track(event);
  }

  /**
   * Track a page_view event.
   * @param url - The URL of the page that was viewed. If not provided, the current page URL will be used.
   */
  public async page<Payload extends {} = {}>(name?: string, additionalPayload: Payload = {} as Payload) {
    if (!await this.waitForReady()) {
      return;
    }
    await this._client.event.track({
      type: "page_view",
      payload: {
        name,
        url: window.location.href,
        title: document.title,
        pathname: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        ...additionalPayload,
      },
    });
  }
}
