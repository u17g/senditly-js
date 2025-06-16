"use client";

import { createContext, useContext, useMemo } from "react";
import SenditlyTag, { type SenditlyTagConfig, type Senditly, type SenditlyConfig } from "@senditly/tag";

const SenditlyTagContext = createContext<SenditlyTag | null>(null);

export type { SenditlyTagConfig, Senditly, SenditlyConfig };

export type SenditlyTagProviderProps = {
  children: React.ReactNode;
  config: SenditlyTagConfig;
};

export function SenditlyTagProvider({ children, config }: SenditlyTagProviderProps) {
  const senditly = useMemo(() => {
    return new SenditlyTag(config);
  }, []);
  return <SenditlyTagContext.Provider value={senditly}>{children}</SenditlyTagContext.Provider>;
}

export function useSenditlyTag(): SenditlyTag {
  const senditlyTag = useContext(SenditlyTagContext);
  if (!senditlyTag) {
    throw new Error(
      "useSenditlyTag must be used within a SenditlyProvider. " +
      "Please wrap your component with <SenditlyProvider config={...}>."
    );
  }
  return senditlyTag;
}
