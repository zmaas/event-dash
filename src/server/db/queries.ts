import { desc, sql, and, gte, lt, count } from "drizzle-orm";
import { db } from "~/server/db/index";
import { events } from "~/server/db/schema";

const get24HoursAgo = () => {
	const date = new Date();
	date.setHours(date.getHours() - 24);
	return date;
};

export const getRecentEvents = async (limit = 100, offset = 0) => {
	return await db
		.select()
		.from(events)
		.orderBy(desc(events.occurredAt))
		.limit(limit)
		.offset(offset);
};

export const getStatsInWindow = async (window: Date) => {
	const [stats] = await db
		.select({
			totalEvents: count(),
			warnings: sql<number>`count(*) filter (where ${events.severity} = 'medium')`,
			errors: sql<number>`count(*) filter (where ${events.severity} IN ('high', 'critical'))`,
			uniqueUsers: sql<number>`count(distinct ${events.userId})`,
		})
		.from(events)
		.where(gte(events.occurredAt, window));

	if (!stats) {
		return {
			totalEvents: 0,
			warnings: 0,
			errors: 0,
			uniqueUsers: 0,
		};
	}

	return {
		totalEvents: Number(stats.totalEvents),
		warnings: Number(stats.warnings),
		errors: Number(stats.errors),
		uniqueUsers: Number(stats.uniqueUsers),
	};
};

export const getEventsLast24Hours = async () => {
	return await getStatsInWindow(get24HoursAgo());
};

// Helper to calculate percent change
const calculatePercentChange = (current: number, previous: number): number => {
	if (previous === 0) {
		return current > 0 ? 100 : 0;
	}
	return ((current - previous) / previous) * 100;
};

export const getEventsLast24HoursWithComparison = async () => {
	const now = new Date();
	const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

	// Get current period stats (last 24 hours)
	const currentStats = await getStatsInWindow(twentyFourHoursAgo);

	// Get previous period stats (24-48 hours ago)
	const [previousStatsRaw] = await db
		.select({
			totalEvents: count(),
			warnings: sql<number>`count(*) filter (where ${events.severity} = 'medium')`,
			errors: sql<number>`count(*) filter (where ${events.severity} IN ('high', 'critical'))`,
			uniqueUsers: sql<number>`count(distinct ${events.userId})`,
		})
		.from(events)
		.where(
			and(
				gte(events.occurredAt, fortyEightHoursAgo),
				lt(events.occurredAt, twentyFourHoursAgo),
			),
		);

	const previousStats = previousStatsRaw
		? {
				totalEvents: Number(previousStatsRaw.totalEvents),
				warnings: Number(previousStatsRaw.warnings),
				errors: Number(previousStatsRaw.errors),
				uniqueUsers: Number(previousStatsRaw.uniqueUsers),
			}
		: {
				totalEvents: 0,
				warnings: 0,
				errors: 0,
				uniqueUsers: 0,
			};

	return {
		current: currentStats,
		previous: previousStats,
		percentChange: {
			totalEvents: calculatePercentChange(
				currentStats.totalEvents,
				previousStats.totalEvents,
			),
			warnings: calculatePercentChange(
				currentStats.warnings,
				previousStats.warnings,
			),
			errors: calculatePercentChange(currentStats.errors, previousStats.errors),
			uniqueUsers: calculatePercentChange(
				currentStats.uniqueUsers,
				previousStats.uniqueUsers,
			),
		},
	};
};

export const getEventsTimeSeries = async (days: number = 90) => {
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - days);

	const result = await db
		.select({
			date: sql<string>`DATE(${events.occurredAt})`,
			low: sql<number>`count(*) filter (where ${events.severity} = 'low')`,
			medium: sql<number>`count(*) filter (where ${events.severity} = 'medium')`,
			high: sql<number>`count(*) filter (where ${events.severity} = 'high')`,
			critical: sql<number>`count(*) filter (where ${events.severity} = 'critical')`,
		})
		.from(events)
		.where(gte(events.occurredAt, startDate))
		.groupBy(sql`DATE(${events.occurredAt})`)
		.orderBy(sql`DATE(${events.occurredAt})`);

	return result.map((row) => ({
		date: row.date,
		low: Number(row.low),
		medium: Number(row.medium),
		high: Number(row.high),
		critical: Number(row.critical),
	}));
};
