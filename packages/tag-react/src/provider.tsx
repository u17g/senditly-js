"use client";

import { createContext, useContext, useMemo } from "react";
import SenditlyTag, { type SenditlyTagConfig } from "@senditly/tag";

const SenditlyContext = createContext<SenditlyTag | null>(null);

export type SenditlyProviderProps = {
  children: React.ReactNode;
  config: SenditlyTagConfig;
};

export function SenditlyProvider({ children, config }: SenditlyProviderProps) {
  const senditly = useMemo(() => {
    return new SenditlyTag(config);
  }, []);
  return <SenditlyContext.Provider value={senditly}>{children}</SenditlyContext.Provider>;
}

export function useSenditlyTag(): SenditlyTag {
  const senditlyTag = useContext(SenditlyContext);
  if (!senditlyTag) {
    throw new Error(
      "useSenditlyTag must be used within a SenditlyProvider. " +
      "Please wrap your component with <SenditlyProvider config={...}>."
    );
  }
  return senditlyTag;
}
