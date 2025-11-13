import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins/passkey";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg", // or "pg" or "mysql"
	}),
	emailAndPassword: {
		enabled: true,
	},
	passkey: {
		enabled: true,
	},
	socialProviders: {},
	plugins: [passkey()],
});

export type Session = typeof auth.$Infer.Session;
