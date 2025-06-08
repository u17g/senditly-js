import Senditly, { EventTrackRequest, SenditlyConfig, SessionIdentifyRequest } from "@senditly/web";
import { isBot } from "./utils/bot";
import { listenUrlChange } from "./utils/observer";

export type SenditlyTagConfig = SenditlyConfig & {
  /**
   * Whether to track page view events automatically.
   * true by default.
   */
  autoTrackPageView?: boolean;
};

export class SenditlyTag {
  private readonly client: Senditly;
  private readonly isBot: boolean;
  private readonly waitForInit: Promise<void>;

  constructor(config: SenditlyTagConfig) {
    const { autoTrackPageView, ...rest } = config;
    this.client = new Senditly(rest);
    this.isBot = isBot();
    this.waitForInit = this.initSession();

    if (autoTrackPageView !== false) {
      this.page();
      listenUrlChange(() => {
        this.page();
      });
    }
  }

  private async initSession() {
    if (this.isBot) {
      return;
    }
    await this.client.session.start({});
  }

  /**
   * Identify the user with an email.
   * @param email - The email of the user.
   * @param properties - The properties of the user.
   * @param mailingLists - The mailing lists that the user is subscribed to.
   */
  async identify<Properties extends {} = {}, MailingLists extends { [key: string]: boolean } = {}>(event: SessionIdentifyRequest<Properties, MailingLists>) {
    if (this.isBot) {
      return;
    }
    await this.waitForInit;
    await this.client.session.identify(event);
  }

  async track<Payload extends {} = {}>(event: EventTrackRequest<Payload>) {
    if (this.isBot) {
      return;
    }
    await this.waitForInit;
    await this.client.event.track(event);
  }

  /**
   * Track a page_view event.
   * @param url - The URL of the page that was viewed. If not provided, the current page URL will be used.
   */
  async page<Payload extends {} = {}>(name?: string, additionalPayload: Payload = {} as Payload) {
    if (this.isBot) {
      return;
    }
    await this.waitForInit;
    await this.client.event.track({
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

export default SenditlyTag;