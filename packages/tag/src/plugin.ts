import type { SenditlyTag } from "./tag";

export interface SenditlyTagPlugin {
  init(tag: SenditlyTag): void;
}