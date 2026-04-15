CREATE TABLE "ticket_reply" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_reply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ticket_reply_ticketId_idx" ON "ticket_reply"("ticketId");
CREATE INDEX "ticket_reply_authorUserId_idx" ON "ticket_reply"("authorUserId");

ALTER TABLE "ticket_reply" ADD CONSTRAINT "ticket_reply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_reply" ADD CONSTRAINT "ticket_reply_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
