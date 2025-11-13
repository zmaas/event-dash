"use client";
import { Button } from "~/components/ui/button";
import { seed } from "~/server/db/seed";
import { useSession } from "~/components/auth-provider";
import { AuthModal } from "~/components/auth-modal";

export default function SettingsPage() {
	const { isAuthenticated, isPending } = useSession();

	if (isPending) {
		return (
			<div className="p-4 space-8">
				<h1 className="text-2xl font-bold">Settings</h1>
				<div className="h-10 bg-muted rounded animate-pulse" />
			</div>
		);
	}

	return (
		<div className="p-4 space-8">
			<h1 className="text-2xl font-bold">Settings</h1>
			{isAuthenticated ? (
				<Button onClick={() => seed()} className="hover:cursor-pointer">
					Populate Database
				</Button>
			) : (
				<div className="space-y-4">
					<p className="text-muted-foreground">Sign In to Access Settings</p>
					<AuthModal
						trigger={
							<Button variant="outline">Sign In to Populate Database</Button>
						}
					/>
				</div>
			)}
		</div>
	);
}
