import type { SenditlyTagPlugin, SenditlyTag } from "@senditly/tag";

type Payload = {
  obj: {
    context: {
      event: {
        type: "identify";
        traits?: {
          [key: string]: any;
        }
      }
    }
  }
}
type Context = {
  payload: Payload;
  next: (payload: Payload) => void;
}
type Middleware = (context: Context) => void;
type SegmentAnalytics = {
  addSourceMiddleware: (middleware: Middleware) => void;
}
type Window = {
  analytics?: SegmentAnalytics;
}

export type SegmentPluginOptions = {
  /**
   * The email field name in the identify event traits object.
   * @default "email"
   */
  emailFieldName?: string;
  /**
   * The properties field names in the identify event traits object.
   * @default []
   */
  propertiesFieldNames?: string[];
  /**
   * Timeout for waiting for segment analytics to be ready
   * @default 10000 // 10 seconds
   */
  timeout?: number;
}

/**
 * Segment plugin for Senditly Tag.
 *
 * - This plugin will find the segment analytics in the window object, and listen the `identify` event.
 * - If the identify event has `email` property, it will call the `identify` method of the senditly tag.
 */
export class SegmentPlugin implements SenditlyTagPlugin {
  private options: Required<SegmentPluginOptions>;
  constructor(options: SegmentPluginOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 10000,
      emailFieldName: options.emailFieldName ?? "email",
      propertiesFieldNames: options.propertiesFieldNames ?? [],
      ...options,
    };
  }

  init(tag: SenditlyTag) {
    retryUntil(() => {
      return addMiddleware(tag, this.options);
    }, this.options.timeout).catch((err) => {
      console.error("Failed to proxy segment analytics", err);
    });
  }
}

async function retryUntil(condition: () => boolean, timeout = 5000) {
  const startTime = Date.now();
  while (!condition()) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for segment analytics to be ready");
    }
  }
}

function addMiddleware(tag: SenditlyTag, options: Required<SegmentPluginOptions>): boolean {
  const analytics = (window as Window).analytics;
  if (!analytics || !analytics.addSourceMiddleware) {
    return false;
  }
  analytics.addSourceMiddleware(({ payload, next }) => {
    const { event } = payload.obj.context;
    if (event.type === "identify") {
      const email = event.traits?.[options.emailFieldName];
      if (email) {
        const properties = options.propertiesFieldNames.reduce((acc, fieldName) => {
          const value = event.traits?.[fieldName];
          if (value) {
            acc[fieldName] = value;
          }
          return acc;
        }, {} as Record<string, any>);
        tag.identify({
          email,
          properties,
        }).catch((err) => {
          console.error("Failed to identify", err);
        });
      }
    }
    next(payload);
  })
  return true;
}