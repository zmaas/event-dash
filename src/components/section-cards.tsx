import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

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

const MetricCard = ({
	title,
	value,
	change,
	footerText,
}: {
	title: string;
	value: number;
	change: number;
	footerText: string;
}) => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>{title}</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{value}
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={change} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">{footerText}</div>
			</CardFooter>
		</Card>
	);
};

export async function SectionCards() {
	const eventsStats = await getEventsLast24Hours();
	const diffStats = await getEventsLast24HoursWithComparison();
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<MetricCard
				title="Events (24hr)"
				value={eventsStats.totalEvents}
				change={diffStats.percentChange.totalEvents}
				footerText=""
			/>
			<MetricCard
				title="Warnings (24hr)"
				value={eventsStats.warnings}
				change={diffStats.percentChange.warnings}
				footerText=""
			/>
			<MetricCard
				title="Errors (24hr)"
				value={eventsStats.errors}
				change={diffStats.percentChange.errors}
				footerText=""
			/>
			<MetricCard
				title="Users (24hr)"
				value={eventsStats.uniqueUsers}
				change={diffStats.percentChange.uniqueUsers}
				footerText=""
			/>
		</div>
	);
}
