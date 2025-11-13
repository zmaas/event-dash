"use client";

import * as React from "react";
import {
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconCircleCheckFilled,
	IconDotsVertical,
	IconGripVertical,
	IconLayoutColumns,
	IconLoader,
	IconPlus,
	IconTrendingUp,
} from "@tabler/icons-react";
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	Row,
	SortingState,
	useReactTable,
	VisibilityState,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "~/hooks/use-mobile";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "~/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const eventSchema = z.object({
	id: z.string(),
	eventType: z.enum([
		"auth_attempt",
		"api_call",
		"admin_action",
		"data_access",
		"config_change",
	]),
	severity: z.enum(["low", "medium", "high", "critical"]),
	userId: z.string().nullable(),
	ipAddress: z.string(),
	endpoint: z.string().nullable(),
	httpMethod: z.string().nullable(),
	statusCode: z.number().nullable(),
	occurredAt: z.date(),
	metadata: z.record(z.unknown()).nullable(),
});

const columns: ColumnDef<z.infer<typeof eventSchema>>[] = [
	{
		accessorKey: "occurredAt",
		header: "Time",
		cell: ({ row }) => <EventDetails event={row.original} />,
	},
	{
		accessorKey: "eventType",
		header: "Event Type",
		cell: ({ row }) => (
			<Badge variant="outline" className="text-muted-foreground px-1.5">
				{row.original.eventType.replace("_", " ")}
			</Badge>
		),
	},
	{
		accessorKey: "severity",
		header: "Severity",
		cell: ({ row }) => {
			const severity = row.original.severity;
			const colorClass = {
				low: "text-green-600",
				medium: "text-yellow-600",
				high: "text-orange-600",
				critical: "text-red-600",
			}[severity];

			return (
				<Badge variant="outline" className={`${colorClass} px-1.5`}>
					{severity.toUpperCase()}
				</Badge>
			);
		},
	},
	{
		accessorKey: "userId",
		header: "User",
		cell: ({ row }) => (
			<div className="text-sm">{row.original.userId || "Anonymous"}</div>
		),
	},
	{
		accessorKey: "endpoint",
		header: "Endpoint",
		cell: ({ row }) => (
			<div className="text-sm font-mono">{row.original.endpoint || "-"}</div>
		),
	},
	{
		accessorKey: "statusCode",
		header: "Status",
		cell: ({ row }) => (
			<div className="text-sm">{row.original.statusCode || "-"}</div>
		),
	},
	{
		accessorKey: "ipAddress",
		header: "IP Address",
		cell: ({ row }) => (
			<div className="text-sm font-mono">{row.original.ipAddress}</div>
		),
	},
];

export function DataTable({
	data: initialData,
}: {
	data: z.infer<typeof eventSchema>[];
}) {
	const [data] = React.useState(() => initialData);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			columnFilters,
			pagination,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-end px-4 lg:px-6">
				<div className="flex items-center gap-2 pb-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<IconLayoutColumns />
								<span className="hidden lg:inline">Customize Columns</span>
								<span className="lg:hidden">Columns</span>
								<IconChevronDown />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{table
								.getAllColumns()
								.filter(
									(column) =>
										typeof column.accessorFn !== "undefined" &&
										column.getCanHide(),
								)
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

const chartData = [
	{ month: "January", desktop: 186, mobile: 80 },
	{ month: "February", desktop: 305, mobile: 200 },
	{ month: "March", desktop: 237, mobile: 120 },
	{ month: "April", desktop: 73, mobile: 190 },
	{ month: "May", desktop: 209, mobile: 130 },
	{ month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--primary)",
	},
	mobile: {
		label: "Mobile",
		color: "var(--primary)",
	},
} satisfies ChartConfig;

function EventDetails({ event }: { event: z.infer<typeof eventSchema> }) {
	const isMobile = useIsMobile();

	return (
		<Drawer direction={isMobile ? "bottom" : "right"}>
			<DrawerTrigger asChild>
				<Button variant="link" className="text-foreground w-fit px-0 text-left">
					{new Date(event.occurredAt).toLocaleString()}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>Event Details</DrawerTitle>
					<DrawerDescription>Event ID: {event.id}</DrawerDescription>
				</DrawerHeader>
				<div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
					<div className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-xs font-medium text-muted-foreground">
									Event Type
								</Label>
								<div className="mt-1">
									<Badge
										variant="outline"
										className="text-muted-foreground px-1.5"
									>
										{event.eventType.replace("_", " ")}
									</Badge>
								</div>
							</div>
							<div>
								<Label className="text-xs font-medium text-muted-foreground">
									Severity
								</Label>
								<div className="mt-1">
									<Badge
										variant="outline"
										className={`px-1.5 ${
											event.severity === "critical"
												? "text-red-600"
												: event.severity === "high"
													? "text-orange-600"
													: event.severity === "medium"
														? "text-yellow-600"
														: "text-green-600"
										}`}
									>
										{event.severity.toUpperCase()}
									</Badge>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-xs font-medium text-muted-foreground">
									User ID
								</Label>
								<div className="mt-1 font-mono text-sm">
									{event.userId || "Anonymous"}
								</div>
							</div>
							<div>
								<Label className="text-xs font-medium text-muted-foreground">
									IP Address
								</Label>
								<div className="mt-1 font-mono text-sm">{event.ipAddress}</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-xs font-medium text-muted-foreground">
									HTTP Method
								</Label>
								<div className="mt-1 font-mono text-sm">
									{event.httpMethod || "-"}
								</div>
							</div>
							<div>
								<Label className="text-xs font-medium text-muted-foreground">
									Status Code
								</Label>
								<div className="mt-1 font-mono text-sm">
									{event.statusCode || "-"}
								</div>
							</div>
						</div>

						<div>
							<Label className="text-xs font-medium text-muted-foreground">
								Endpoint
							</Label>
							<div className="mt-1 font-mono text-sm break-all">
								{event.endpoint || "-"}
							</div>
						</div>

						<div>
							<Label className="text-xs font-medium text-muted-foreground">
								Occurred At
							</Label>
							<div className="mt-1 text-sm">
								{new Date(event.occurredAt).toLocaleString()}
							</div>
						</div>

						{event.metadata && Object.keys(event.metadata).length > 0 && (
							<div>
								<Label className="text-xs font-medium text-muted-foreground">
									Metadata
								</Label>
								<div className="mt-1">
									<pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
										{JSON.stringify(event.metadata, null, 2)}
									</pre>
								</div>
							</div>
						)}
					</div>
				</div>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
