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

  end(request: SessionEndRequest): APIPromise<SessionEndResponse> {
    const validatedRequest = sessionEndRequestSchema.safeParse(request);
    if (!validatedRequest.success) {
      throw new APIError(400, validatedRequest.error.message);
    }
    return this._post(`/sessions/end`, validatedRequest.data);
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

export const sessionEndRequestSchema = z.object({});

export type SessionEndRequest = {}

export type SessionEndResponse = {
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
