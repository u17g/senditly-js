import { APIResource, APIPromise, APIError } from "../../resource";
import { z } from "zod";
import { localeSchema } from "../locale";

export class TransactionalAPI extends APIResource {
  send(request: TransactionalSendRequest): APIPromise<TransactionalSendResponse> {
    const validatedRequest = transactionalSendRequestSchema.safeParse(request);
    if (!validatedRequest.success) {
      throw new APIError(400, validatedRequest.error.message);
    }
    return this._post(`/transactional/send`, validatedRequest.data);
  }
}

const baseTransactionalSendRequestSchema = z.object({
  id: z.optional(z.string()),
  to: z.string(),
  variables: z.optional(z.record(z.string(), z.any())),
  locale: z.optional(localeSchema),
  addToContacts: z.optional(z.boolean()),
  failOnTimeout: z.optional(z.boolean()),
  asyncSend: z.optional(z.boolean()),
});
export const transactionalSendRequestWithTemplateIdSchema = baseTransactionalSendRequestSchema.extend({
  templateId: z.string(),
});
export type TransactionalSendRequestWithTemplateId = z.infer<typeof transactionalSendRequestWithTemplateIdSchema>;
export const transactionalSendRequestSchema = transactionalSendRequestWithTemplateIdSchema;
export type TransactionalSendRequest = z.infer<typeof transactionalSendRequestSchema>;

export type TransactionalSendResponse = {
  id: string;
}
