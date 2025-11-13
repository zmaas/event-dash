"use client";
import { Button } from "~/components/ui/button";
import { seed } from "~/server/db/seed";

export default function SettingsPage() {
	return (
		<div className="p-4 space-8 ">
			<h1 className="text-2xl font-bold">Settings</h1>
			<Button onClick={() => seed()} className="hover:cursor-pointer">
				Populate Database
			</Button>
		</div>
	);
}
