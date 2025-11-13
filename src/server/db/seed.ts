"use server";
import { env } from "~/env";
import { db } from "./index";
import { events } from "./schema";
import { faker } from "@faker-js/faker";

const EVENT_TYPES = [
	"auth_attempt",
	"api_call",
	"admin_action",
	"data_access",
	"config_change",
] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const ENDPOINTS = [
	"/api/users",
	"/api/auth/login",
	"/api/auth/logout",
	"/api/data/export",
	"/api/admin/users",
	"/api/admin/settings",
	"/api/config/update",
	"/api/reports",
];

function generateMetadataForEvent(eventType: (typeof EVENT_TYPES)[number]) {
	const base: Record<string, unknown> = {
		requestId: faker.string.uuid(),
		duration: faker.number.int({ min: 10, max: 5000 }),
	};

	switch (eventType) {
		case "auth_attempt":
			return {
				...base,
				success: faker.datatype.boolean(0.85),
				mfaUsed: faker.datatype.boolean(0.3),
				provider: faker.helpers.arrayElement(["local", "google", "github"]),
			};
		case "api_call":
			return {
				...base,
				responseSize: faker.number.int({ min: 100, max: 50000 }),
				cached: faker.datatype.boolean(0.2),
			};
		case "admin_action":
			return {
				...base,
				action: faker.helpers.arrayElement([
					"user_created",
					"user_deleted",
					"role_changed",
					"settings_updated",
				]),
				targetUserId: faker.string.uuid(),
			};
		case "data_access":
			return {
				...base,
				resource: faker.helpers.arrayElement([
					"users",
					"orders",
					"analytics",
					"logs",
				]),
				recordCount: faker.number.int({ min: 1, max: 1000 }),
			};
		case "config_change":
			return {
				...base,
				setting: faker.helpers.arrayElement([
					"feature_flags",
					"rate_limits",
					"permissions",
				]),
				oldValue: faker.lorem.word(),
				newValue: faker.lorem.word(),
			};
	}
}

export async function seed() {
	console.log("🌱 Seeding events table...");

	const count = 1000; // adjust as needed
	const batchSize = 1000;

	for (let i = 0; i < count; i += batchSize) {
		const batch = Array.from({ length: Math.min(batchSize, count - i) }, () => {
			const eventType = faker.helpers.arrayElement(EVENT_TYPES);
			const occurredAt = faker.date.recent({ days: 30 });
			const ingestedAt = new Date(
				occurredAt.getTime() + faker.number.int({ min: 100, max: 5000 }),
			);

			return {
				eventType,
				severity: faker.helpers.weightedArrayElement([
					{ weight: 60, value: "low" as const },
					{ weight: 25, value: "medium" as const },
					{ weight: 12, value: "high" as const },
					{ weight: 3, value: "critical" as const },
				]),
				userId: faker.datatype.boolean(0.8) ? faker.string.uuid() : null,
				ipAddress: faker.internet.ip(),
				userAgent: faker.internet.userAgent(),
				endpoint: faker.helpers.arrayElement(ENDPOINTS),
				httpMethod: faker.helpers.arrayElement(HTTP_METHODS),
				statusCode: faker.helpers.weightedArrayElement([
					{ weight: 70, value: 200 },
					{ weight: 10, value: 201 },
					{ weight: 5, value: 400 },
					{ weight: 5, value: 401 },
					{ weight: 3, value: 403 },
					{ weight: 3, value: 404 },
					{ weight: 2, value: 500 },
					{ weight: 2, value: 503 },
				]),
				metadata: generateMetadataForEvent(eventType),
				occurredAt,
				ingestedAt,
			};
		});

		await db.insert(events).values(batch);
		console.log(`  Inserted ${i + batch.length}/${count} events`);
	}

	console.log("✅ Seeding complete!");
}
