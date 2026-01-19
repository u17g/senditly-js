import { TransactionalAPI } from "./resources/transactional";

export type SenditlyConfig = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}
export class SenditlyClient {
  readonly config: Required<SenditlyConfig>;
  constructor(config: SenditlyConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || "https://api.senditly.ai/v1",
      fetch: config.fetch || fetch.bind(globalThis),
    };
  }

  readonly transactional = new TransactionalAPI(this);
}

export const senditly = new SenditlyClient({
  apiKey: process.env.SENDITLY_API_KEY!,
});
