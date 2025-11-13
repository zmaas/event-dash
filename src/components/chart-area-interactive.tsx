"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "~/hooks/use-mobile";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Skeleton } from "~/components/ui/skeleton";

export const description = "An interactive area chart";

type EventData = {
	date: string;
	low: number;
	medium: number;
	high: number;
	critical: number;
};

const chartConfig = {
	events: {
		label: "Events",
	},
	low: {
		label: "Low",
		color: "var(--chart-3)",
	},
	medium: {
		label: "Medium",
		color: "var(--chart-2)",
	},
	high: {
		label: "High",
		color: "var(--chart-4)",
	},
	critical: {
		label: "Critical",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function ChartAreaInteractive() {
	const isMobile = useIsMobile();
	const [timeRange, setTimeRange] = React.useState("90d");
	const [data, setData] = React.useState<EventData[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const fetchData = React.useCallback(async (days: number) => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(`/api/events/timeseries?days=${days}`);
			if (!response.ok) {
				throw new Error("Failed to fetch event data");
			}
			const result = await response.json();
			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		if (isMobile) {
			setTimeRange("7d");
		}
	}, [isMobile]);

	React.useEffect(() => {
		const days = timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7;
		fetchData(days);
	}, [timeRange, fetchData]);

	const getTimeRangeLabel = () => {
		switch (timeRange) {
			case "90d":
				return "last 3 months";
			case "30d":
				return "last 30 days";
			case "7d":
				return "last 7 days";
			default:
				return "last 3 months";
		}
	};

	if (error) {
		return (
			<Card className="@container/card">
				<CardHeader>
					<CardTitle>Event Activity</CardTitle>
					<CardDescription>Failed to load event data</CardDescription>
				</CardHeader>
				<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
					<div className="flex items-center justify-center h-[250px] text-muted-foreground">
						{error}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="@container/card">
			<CardHeader>
				<CardTitle>Event Activity</CardTitle>
				<CardDescription>
					<span className="hidden @[540px]/card:block">
						Total events for the {getTimeRangeLabel()}
					</span>
					<span className="@[540px]/card:hidden">{getTimeRangeLabel()}</span>
				</CardDescription>
				<CardAction>
					<ToggleGroup
						type="single"
						value={timeRange}
						onValueChange={setTimeRange}
						variant="outline"
						className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
					>
						<ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
						<ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
						<ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
					</ToggleGroup>
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger
							className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
							size="sm"
							aria-label="Select a value"
						>
							<SelectValue placeholder="Last 3 months" />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="90d" className="rounded-lg">
								Last 3 months
							</SelectItem>
							<SelectItem value="30d" className="rounded-lg">
								Last 30 days
							</SelectItem>
							<SelectItem value="7d" className="rounded-lg">
								Last 7 days
							</SelectItem>
						</SelectContent>
					</Select>
				</CardAction>
			</CardHeader>
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				{loading ? (
					<div className="aspect-auto h-[250px] w-full space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-4 w-2/3" />
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[250px] w-full"
					>
						<AreaChart data={data}>
							<defs>
								<linearGradient id="fillLow" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-low)"
										stopOpacity={1.0}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-low)"
										stopOpacity={0.1}
									/>
								</linearGradient>
								<linearGradient id="fillMedium" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-medium)"
										stopOpacity={1.0}
									/>
									<stop
										offset="95%0"
										stopColor="var(--color-medium)"
										stopOpacity={0.1}
									/>
								</linearGradient>
								<linearGradient id="fillHigh" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-high)"
										stopOpacity={1.0}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-high)"
										stopOpacity={0.1}
									/>
								</linearGradient>
								<linearGradient id="fillCritical" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-critical)"
										stopOpacity={1.0}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-critical)"
										stopOpacity={0.1}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={32}
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									});
								}}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={(value) => {
											return new Date(value).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											});
										}}
										indicator="dot"
									/>
								}
							/>
							<Area
								dataKey="low"
								type="natural"
								fill="url(#fillLow)"
								stroke="var(--color-low)"
								stackId="a"
							/>
							<Area
								dataKey="medium"
								type="natural"
								fill="url(#fillMedium)"
								stroke="var(--color-medium)"
								stackId="a"
							/>
							<Area
								dataKey="high"
								type="natural"
								fill="url(#fillHigh)"
								stroke="var(--color-high)"
								stackId="a"
							/>
							<Area
								dataKey="critical"
								type="natural"
								fill="url(#fillCritical)"
								stroke="var(--color-critical)"
								stackId="a"
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
