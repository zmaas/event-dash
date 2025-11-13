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

const TrendIndicator = ({ percentage }: { percentage: number }) => {
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

const EventsCard = () => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Events (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					5329
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={12} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique users</div>
			</CardFooter>
		</Card>
	);
};

const ErrorsCard = () => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Errors (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					5329
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={-8} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique endpoints</div>
			</CardFooter>
		</Card>
	);
};

const WarningsCard = () => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Warnings (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					5329
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={-20} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique endpoints</div>
			</CardFooter>
		</Card>
	);
};

const AnomaliesCard = () => {
	return (
		<Card className="@container/card">
			<CardHeader>
				<CardDescription>Anomalies (24hr)</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					5329
				</CardTitle>
				<CardAction>
					<TrendIndicator percentage={5} />
				</CardAction>
			</CardHeader>
			<CardFooter className="flex-col items-start gap-1.5 text-sm">
				<div className="text-muted-foreground">From X unique endpoints</div>
			</CardFooter>
		</Card>
	);
};

export function SectionCards() {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<EventsCard />
			<WarningsCard />
			<ErrorsCard />
			<AnomaliesCard />
		</div>
	);
}
