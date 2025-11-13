import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { useMemo } from "react";

import { Badge } from "~/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

import {
	getEventsLast24Hours,
	getEventsLast24HoursWithComparison,
} from "~/server/db/queries";

const TrendIndicator = ({ percentage }: { percentage: number }) => {
	percentage = percentage.toFixed(1) as unknown as number;
	if (percentage >= 0) {
		return (
			<Badge variant="outline">
				<IconTrendingUp />+{percentage}%
			</Badge>
		);
	} else {
		return (
			<Badge variant="outline">
				<IconTrendingDown />
				{percentage}%
			</Badge>
		);
	}
};

const EventsCard = (props: { events: number; change: number }) => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Events (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{props.events}
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={props.change} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique users</div>
			</CardFooter>
		</Card>
	);
};

const ErrorsCard = (props: { errors: number; change: number }) => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Errors (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{props.errors}
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={props.change} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique endpoints</div>
			</CardFooter>
		</Card>
	);
};

const WarningsCard = (props: { warnings: number; change: number }) => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Warnings (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{props.warnings}
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={props.change} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique endpoints</div>
			</CardFooter>
		</Card>
	);
};

const UsersCard = (props: { users: number; change: number }) => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Users (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{props.users}
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={props.change} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique endpoints</div>
			</CardFooter>
		</Card>
	);
};

export async function SectionCards() {
	const eventsStats = await getEventsLast24Hours();
	const diffStats = await getEventsLast24HoursWithComparison();
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<EventsCard
				events={eventsStats.totalEvents}
				change={diffStats.percentChange.totalEvents}
			/>
			<WarningsCard
				warnings={eventsStats.warnings}
				change={diffStats.percentChange.warnings}
			/>
			<ErrorsCard
				errors={eventsStats.errors}
				change={diffStats.percentChange.errors}
			/>
			<UsersCard
				users={eventsStats.uniqueUsers}
				change={diffStats.percentChange.uniqueUsers}
			/>
		</div>
	);
}
