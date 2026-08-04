-- Add the two new MessageTemplateCategory enum values.
-- NOTE: new enum values cannot be USED in the same transaction they are added in,
-- so the follow-up update / template reset / enabled column live in the next migration.
ALTER TYPE "MessageTemplateCategory" ADD VALUE IF NOT EXISTS 'ESTIMATE_UPDATED';
ALTER TYPE "MessageTemplateCategory" ADD VALUE IF NOT EXISTS 'FOLLOW_UP';
