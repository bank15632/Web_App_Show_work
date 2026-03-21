import { z } from "zod";

import {
  bucketOrder,
  contextOptions,
  reviewSteps,
  type GtdBucket,
  type GtdContext,
} from "@/lib/gtd-system";

const gtdBucketSchema = z.enum(bucketOrder as [GtdBucket, ...GtdBucket[]]);
const gtdContextSchema = z.enum(
  ["", ...contextOptions.filter((option) => option.value !== "all").map((option) => option.value)] as [
    GtdContext,
    ...GtdContext[],
  ],
);
const gtdPrioritySchema = z.enum(["high", "medium", "low"]);

export const gtdItemCreateSchema = z.object({
  text: z.string().trim().min(1),
  bucket: gtdBucketSchema.optional(),
  context: gtdContextSchema.optional(),
  priority: gtdPrioritySchema.optional(),
  dueDate: z.string().trim().nullable().optional(),
  note: z.string().trim().optional(),
  linkedProjectId: z.string().trim().nullable().optional(),
  linkedTaskId: z.string().trim().nullable().optional(),
  done: z.boolean().optional(),
  doneAt: z.string().trim().nullable().optional(),
});

export const gtdItemPatchSchema = z
  .object({
    text: z.string().trim().min(1).optional(),
    bucket: gtdBucketSchema.optional(),
    context: gtdContextSchema.optional(),
    priority: gtdPrioritySchema.optional(),
    dueDate: z.string().trim().nullable().optional(),
    note: z.string().trim().optional(),
    linkedProjectId: z.string().trim().nullable().optional(),
    linkedTaskId: z.string().trim().nullable().optional(),
    done: z.boolean().optional(),
    doneAt: z.string().trim().nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one GTD field is required.",
  });

export const gtdReviewPatchSchema = z
  .object({
    steps: z.record(z.string(), z.boolean()).optional(),
    focus: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    lastCompletedAt: z.string().trim().nullable().optional(),
    reset: z.boolean().optional(),
  })
  .superRefine((payload, context) => {
    if (Object.keys(payload).length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one review field is required.",
      });
    }

    if (payload.steps) {
      const validKeys = new Set<string>(reviewSteps.map((step) => step.id));
      for (const key of Object.keys(payload.steps)) {
        if (!validKeys.has(key)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown review step: ${key}`,
            path: ["steps", key],
          });
        }
      }
    }
  });
