"use client";

import { useState } from "react";
import {
	IconMail,
	IconLock,
	IconUser,
	IconFingerprint,
} from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { authClient } from "~/server/better-auth/client";
import { useSession } from "~/components/auth-provider";

interface AuthModalProps {
	trigger: React.ReactNode;
}

export function AuthModal({ trigger }: AuthModalProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { isAuthenticated } = useSession();

	const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		try {
			const result = await authClient.signIn.email({
				email,
				password,
			});

			if (result.error) {
				setError(result.error.message || "Sign in failed");
			} else {
				setOpen(false);
			}
		} catch (err) {
			setError("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		try {
			const result = await authClient.signUp.email({
				email,
				password,
				name,
			});

			if (result.error) {
				setError(result.error.message || "Sign up failed");
			} else {
				setOpen(false);
			}
		} catch (err) {
			setError("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasskeySignIn = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await authClient.signIn.passkey();

			if (result.error) {
				setError(result.error.message || "Passkey sign in failed");
			} else {
				setOpen(false);
			}
		} catch (err) {
			setError("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	if (isAuthenticated) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Welcome</DialogTitle>
					<DialogDescription>
						Sign in to your account or create a new one.
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="signin" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="signin">Sign In</TabsTrigger>
						<TabsTrigger value="signup">Sign Up</TabsTrigger>
					</TabsList>
					<TabsContent value="signin">
						<div className="space-y-4">
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={handlePasskeySignIn}
								disabled={isLoading}
							>
								<IconFingerprint className="mr-2 h-4 w-4" />
								{isLoading ? "Signing in..." : "Sign in with Passkey"}
							</Button>
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-background px-2 text-muted-foreground">
										Or continue with
									</span>
								</div>
							</div>
							<form onSubmit={handleSignIn} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="signin-email">Email</Label>
									<div className="relative">
										<IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="signin-email"
											name="email"
											type="email"
											placeholder="Enter your email"
											className="pl-10"
											required
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="signin-password">Password</Label>
									<div className="relative">
										<IconLock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="signin-password"
											name="password"
											type="password"
											placeholder="Enter your password"
											className="pl-10"
											required
										/>
									</div>
								</div>
								{error && (
									<div className="text-sm text-destructive">{error}</div>
								)}
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "Signing in..." : "Sign In"}
								</Button>
							</form>
						</div>
					</TabsContent>
					<TabsContent value="signup">
						<form onSubmit={handleSignUp} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="signup-name">Name</Label>
								<div className="relative">
									<IconUser className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signup-name"
										name="name"
										type="text"
										placeholder="Enter your name"
										className="pl-10"
										required
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="signup-email">Email</Label>
								<div className="relative">
									<IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signup-email"
										name="email"
										type="email"
										placeholder="Enter your email"
										className="pl-10"
										required
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="signup-password">Password</Label>
								<div className="relative">
									<IconLock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="signup-password"
										name="password"
										type="password"
										placeholder="Enter your password"
										className="pl-10"
										required
									/>
								</div>
							</div>
							{error && <div className="text-sm text-destructive">{error}</div>}
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Creating account..." : "Sign Up"}
							</Button>
						</form>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
