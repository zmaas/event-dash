"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { seed } from "~/server/db/seed";
import { useSession } from "~/components/auth-provider";
import { AuthModal } from "~/components/auth-modal";
import { authClient } from "~/server/better-auth/client";
import { IconFingerprint, IconTrash } from "@tabler/icons-react";
import type { Passkey } from "better-auth/plugins/passkey";

export default function SettingsPage() {
	const { isAuthenticated, isPending } = useSession();
	const [passkeys, setPasskeys] = useState<Passkey[]>([]);
	const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);

	const loadPasskeys = useCallback(async () => {
		setIsLoadingPasskeys(true);
		try {
			const result = await authClient.passkey.listUserPasskeys();
			if (result.data) {
				setPasskeys(result.data);
			}
		} catch (error) {
			console.error("Failed to load passkeys:", error);
		} finally {
			setIsLoadingPasskeys(false);
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			loadPasskeys();
		}
	}, [isAuthenticated, loadPasskeys]);

	const handleAddPasskey = async () => {
		try {
			const name = prompt("Enter a name for your passkey:");
			if (!name) return;

			const result = await authClient.passkey.addPasskey({ name });
			if (result?.error) {
				alert("Failed to add passkey: " + result.error.message);
			} else {
				// Success - result is undefined when successful
				loadPasskeys(); // Refresh the list
			}
		} catch (error) {
			console.error("Failed to add passkey:", error);
			alert("Failed to add passkey");
		}
	};

	const handleDeletePasskey = async (passkeyId: string) => {
		if (!confirm("Are you sure you want to delete this passkey?")) return;

		try {
			const result = await authClient.passkey.deletePasskey({ id: passkeyId });
			if (result?.error) {
				alert("Failed to delete passkey: " + result.error.message);
			} else {
				loadPasskeys(); // Refresh the list
			}
		} catch (error) {
			console.error("Failed to delete passkey:", error);
			alert("Failed to delete passkey");
		}
	};

	if (isPending) {
		return (
			<div className="p-4 space-y-8">
				<h1 className="text-2xl font-bold">Settings</h1>
				<div className="h-10 bg-muted rounded animate-pulse" />
			</div>
		);
	}

	return (
		<div className="p-4 space-y-8">
			<h1 className="text-2xl font-bold">Settings</h1>
			{isAuthenticated ? (
				<div className="space-y-6">
					<div className="flex gap-4">
						<Button onClick={() => seed()} className="hover:cursor-pointer">
							Populate Database
						</Button>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<IconFingerprint className="h-5 w-5" />
								Passkeys
							</CardTitle>
							<CardDescription>
								Manage your passkeys for passwordless authentication
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button onClick={handleAddPasskey} variant="outline">
								<IconFingerprint className="mr-2 h-4 w-4" />
								Add Passkey
							</Button>

							{isLoadingPasskeys ? (
								<div className="text-sm text-muted-foreground">
									Loading passkeys...
								</div>
							) : passkeys.length > 0 ? (
								<div className="space-y-2">
									{passkeys.map((passkey) => (
										<div
											key={passkey.id}
											className="flex items-center justify-between p-3 border rounded-lg"
										>
											<div className="flex items-center gap-3">
												<IconFingerprint className="h-4 w-4 text-muted-foreground" />
												<div>
													<div className="font-medium">
														{passkey.name || "Unnamed Passkey"}
													</div>
													<div className="text-sm text-muted-foreground">
														Created {passkey.createdAt.toLocaleDateString()}
													</div>
												</div>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeletePasskey(passkey.id)}
												className="text-destructive hover:text-destructive"
											>
												<IconTrash className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="text-sm text-muted-foreground">
									No passkeys registered yet. Add one to enable passwordless
									sign-in.
								</div>
							)}
						</CardContent>
					</Card>
				</div>
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
