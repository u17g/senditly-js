import type { SenditlyTagPlugin, SenditlyTag } from "@senditly/tag";

type KarteTagV2 = (...args: any[]) => void;
type KarteTagV1 = {
  track: (name: string, value: any) => void;
}
type Window = {
  krt?: KarteTagV2;
  tracker?: KarteTagV1;
}

export type KartePluginOptions = {
  /**
   * Timeout for waiting for karte tag to be ready
   * @default 10000 // 10 seconds
   */
  timeout?: number;
}

/**
 * Karte plugin for Senditly Tag.
 *
 * - This plugin will find the karte tag in the window object, and listen the `identify` event.
 * - If the identify event has `email` property, it will call the `identify` method of the senditly tag.
 * - Karte tag v1 and v2 are supported.
 */
export class KartePlugin implements SenditlyTagPlugin {
  private options: KartePluginOptions;
  constructor(options: KartePluginOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 10000,
      ...options,
    };
  }

  init(tag: SenditlyTag) {
    retryUntil(() => {
      return proxyKarteTag(tag);
    }, this.options.timeout).catch((err) => {
      console.error("Failed to proxy karte tag", err);
    });
  }
}

async function retryUntil(condition: () => boolean, timeout = 5000) {
  const startTime = Date.now();
  while (!condition()) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for karte tag to be ready");
    }
  }
}

function proxyKarteTag(tag: SenditlyTag): boolean {
  if ((window as Window).krt) {
    const karteTagV2 = (window as Window).krt as KarteTagV2;
    (window as Window).krt = function (...args: any[]) {
      if (args.length === 0) {
        return karteTagV2(...args);
      }
      const [method] = args;
      if (method !== "send") {
        return karteTagV2(...args);
      }
      const [_, name, value] = args;
      if (name !== "identify") {
        return karteTagV2(...args);
      }
      const hasEmail = value.email;
      if (!hasEmail) {
        return karteTagV2(...args);
      }
      karteTagV2("send", name, value);
      tag.identify(value.email);
    };
    return true;
  } else if ((window as Window).tracker) {
    const tracker = (window as Window).tracker as KarteTagV1;
    if (!tracker || !tracker.track) {
      return false;
    }
    const originalTrack = tracker.track;
    tracker.track = function (name: string, value: any) {
      if (name !== "identify") {
        return originalTrack(name, value);
      }
      const hasEmail = value.email;
      if (!hasEmail) {
        return originalTrack(name, value);
      }
      originalTrack(name, value);
      tag.identify(value.email);
    }
    return true;
  }
  return false;
}