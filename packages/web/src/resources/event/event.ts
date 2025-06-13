import { APIResource, APIPromise, APIError } from "../../resource";
import { z } from "zod/v4-mini";

export class EventAPI extends APIResource {
  track<Payload extends {}>(request: EventTrackRequest<Payload>): APIPromise<EventTrackResponse> {
    const validatedRequest = eventTrackRequestSchema.safeParse(request);
    if (!validatedRequest.success) {
      throw new APIError(400, validatedRequest.error.message);
    }
    return this._post(`/events/track`, validatedRequest.data);
  }
}

export const eventTrackRequestSchema = z.object({
  type: z.string(),
  payload: z.optional(z.record(z.string(), z.any())),
});

export type EventTrackRequest<Payload extends {} = {}> = {
  /**
   * The event type
   */
  type: string;
  /**
   * The event payload
   */
  payload?: Payload;
};

export type EventTrackResponse = {
  status: "success";
}