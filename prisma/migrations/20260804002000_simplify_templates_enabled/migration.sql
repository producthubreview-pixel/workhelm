-- Phase 1: simplified template system (part 2 — uses the enum values added in
-- 20260804001348_add_template_categories, which must be committed first).

-- 1. Point existing follow-up rows at the new unified FOLLOW_UP category.
UPDATE "FollowUp" SET "templateCategory" = 'FOLLOW_UP'
WHERE "templateCategory" IN ('FOLLOW_UP_1', 'FOLLOW_UP_2');

-- 2. Drop all saved templates so the app auto-seeds one fresh template per
--    category with the new content and the new category set.
DELETE FROM "MessageTemplate";

-- 3. Add the enabled toggle column.
ALTER TABLE "MessageTemplate" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
