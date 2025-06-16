import { APIResource, APIPromise, APIError } from "../../resource";
import { z } from "zod/v4-mini";

export class SessionAPI extends APIResource {
  start(request: SessionStartRequest): APIPromise<SessionStartResponse> {
    const validatedRequest = sessionStartRequestSchema.safeParse(request);
    if (!validatedRequest.success) {
      throw new APIError(400, validatedRequest.error.message);
    }
    return this._post(`/sessions/start`, validatedRequest.data);
  }

  close(request: SessionCloseRequest): APIPromise<SessionCloseResponse> {
    const validatedRequest = sessionCloseRequestSchema.safeParse(request);
    if (!validatedRequest.success) {
      throw new APIError(400, validatedRequest.error.message);
    }
    return this._post(`/sessions/close`, validatedRequest.data);
  }

  identify(request: SessionIdentifyRequest): APIPromise<SessionIdentifyResponse> {
    const validatedRequest = sessionIdentifyRequestSchema.safeParse(request);
    if (!validatedRequest.success) {
      throw new APIError(400, validatedRequest.error.message);
    }
    return this._post(`/sessions/identify`, validatedRequest.data);
  }
}

export const sessionStartRequestSchema = z.object({});

export type SessionStartRequest = {}

export type SessionStartResponse = {
  success: true;
}

export const sessionCloseRequestSchema = z.object({});

export type SessionCloseRequest = {}

export type SessionCloseResponse = {
  success: true;
}

export const sessionIdentifyRequestSchema = z.object({
  email: z.email(),
  properties: z.optional(z.record(z.string(), z.any())),
  mailingLists: z.optional(z.record(z.string(), z.boolean())),
});

export type SessionIdentifyRequest<Properties extends {} = {}, MailingLists extends { [key: string]: boolean } = {}> = {
  email: string;
  properties?: Properties;
  // the mailing lists that the user is subscribed to.
  mailingLists?: MailingLists;
};

export type SessionIdentifyResponse = {
  success: true;
};
