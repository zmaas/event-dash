import { DataTable } from "~/components/data-table";
import { getRecentEvents } from "~/server/db/queries";

export default async function EventsPage() {
	const events = await getRecentEvents(1000);

	return (
		<div className="space-y-4">
			<div className="px-4 lg:px-6">
				<h1 className="text-2xl font-bold">Events</h1>
				<p className="text-muted-foreground">
					View and manage all system events with detailed filtering and
					pagination.
				</p>
			</div>
			<DataTable data={events} />
		</div>
	);
}
