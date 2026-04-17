-- CreateEnum
CREATE TYPE "TicketReplySource" AS ENUM ('agent', 'ai_auto_resolution');

-- AlterTable
ALTER TABLE "ticket" ALTER COLUMN "status" SET DEFAULT 'new';

-- AlterTable
ALTER TABLE "ticket_reply"
ADD COLUMN "authorLabel" TEXT,
ADD COLUMN "source" "TicketReplySource" NOT NULL DEFAULT 'agent',
ALTER COLUMN "authorUserId" DROP NOT NULL;

UPDATE "ticket_reply" tr
SET "authorLabel" = COALESCE(u."name", 'Agent')
FROM "user" u
WHERE tr."authorUserId" = u."id";

UPDATE "ticket_reply"
SET "authorLabel" = 'Agent'
WHERE "authorLabel" IS NULL;

ALTER TABLE "ticket_reply"
ALTER COLUMN "authorLabel" SET NOT NULL;
