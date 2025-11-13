import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	pgTableCreator,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const events = createTable(
	"events",
	(d) => ({
		id: d.uuid("id").primaryKey().defaultRandom(),
		eventType: d
			.varchar("event_type", { length: 50 })
			.notNull()
			.$type<
				| "auth_attempt"
				| "api_call"
				| "admin_action"
				| "data_access"
				| "config_change"
			>(),
		severity: d
			.varchar("severity", { length: 20 })
			.notNull()
			.$type<"low" | "medium" | "high" | "critical">(),

		// Identity
		userId: d.varchar("user_id", { length: 100 }),
		ipAddress: d.inet("ip_address").notNull(),
		userAgent: text("user_agent"),

		// Request details
		endpoint: d.varchar("endpoint", { length: 255 }),
		httpMethod: d.varchar("http_method", { length: 10 }),
		statusCode: d.integer("status_code"),

		// Metadata
		metadata: d.jsonb("metadata").$type<Record<string, unknown>>(),

		// Timestamps
		occurredAt: d
			.timestamp("occurred_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		ingestedAt: d
			.timestamp("ingested_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		createdAt: d
			.timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	}),
	(t) => [
		index("idx_events_occurred_at").on(t.occurredAt.desc()),
		index("idx_events_severity").on(t.severity),
		index("idx_events_type").on(t.eventType),
		index("idx_events_ip").on(t.ipAddress),
		index("idx_events_user").on(t.userId),
	],
);

// Better Auth Tables, don't modify anything here unless you know what you're doing!
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified")
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
});

export const userRelations = relations(user, ({ many }) => ({
	account: many(account),
	session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));
