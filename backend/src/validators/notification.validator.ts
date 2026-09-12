import { z } from "zod";

export const markNotificationReadSchema = z.object({
  isRead: z.boolean(),
});