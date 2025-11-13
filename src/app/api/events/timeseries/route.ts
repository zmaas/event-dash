import { NextRequest, NextResponse } from "next/server";
import { getEventsTimeSeries } from "~/server/db/queries";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const days = parseInt(searchParams.get("days") || "90", 10);

		// Validate days parameter
		if (days < 1 || days > 365) {
			return NextResponse.json(
				{ error: "Days must be between 1 and 365" },
				{ status: 400 },
			);
		}

		const data = await getEventsTimeSeries(days);
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching events time series:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
