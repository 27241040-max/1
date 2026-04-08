import path from "node:path";
import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

type TestUserRole = "admin" | "agent";

type EnsureCredentialUserOptions = {
  email: string;
  password: string;
  name: string;
  role: TestUserRole;
};

let envLoaded = false;

function ensurePlaywrightEnv() {
  if (envLoaded) {
    return;
  }

  loadEnv({
    path: path.join(process.cwd(), "server", ".env.playwright"),
    override: false,
  });

  envLoaded = true;
}

export async function ensureCredentialUser({
  email,
  password,
  name,
  role,
}: EnsureCredentialUserOptions) {
  ensurePlaywrightEnv();

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Playwright user setup.");
  }

  const client = new Client({ connectionString });
  const passwordHash = await hashPassword(password);

  await client.connect();

  try {
    const existingUser = await client.query<{ id: string }>(
      'SELECT id FROM "user" WHERE email = $1',
      [email],
    );

    const now = new Date();

    if (existingUser.rowCount && existingUser.rows[0]) {
      const userId = existingUser.rows[0].id;

      await client.query(
        'UPDATE "user" SET name = $1, role = $2::"UserRole", "updatedAt" = $3 WHERE id = $4',
        [name, role, now, userId],
      );

      const existingAccount = await client.query<{ id: string }>(
        'SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = $2 LIMIT 1',
        [userId, "credential"],
      );

      if (existingAccount.rowCount && existingAccount.rows[0]) {
        await client.query(
          'UPDATE "account" SET password = $1, "updatedAt" = $2 WHERE id = $3',
          [passwordHash, now, existingAccount.rows[0].id],
        );
        return;
      }

      await client.query(
        'INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [randomUUID(), userId, "credential", userId, passwordHash, now, now],
      );
      return;
    }

    const userId = randomUUID();

    await client.query(
      'INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::"UserRole", $5, $6, $7)',
      [userId, name, email, role, false, now, now],
    );

    await client.query(
      'INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [randomUUID(), userId, "credential", userId, passwordHash, now, now],
    );
  } finally {
    await client.end();
  }
}
