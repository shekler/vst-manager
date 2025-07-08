// server/utils/db.ts
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

// This global variable is used to prevent multiple instances of PrismaClient
// during development with Nuxt's hot-reloading, which can cause connection issues.
declare global {
	// eslint-disable-next-line no-var
	var __db__: PrismaClient;
}

if (process.env.NODE_ENV === "production") {
	prisma = new PrismaClient();
} else {
	if (!global.__db__) {
		global.__db__ = new PrismaClient();
	}
	prisma = global.__db__;
}

export { prisma as db };
