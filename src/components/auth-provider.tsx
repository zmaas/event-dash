"use client";

import { type ReactNode } from "react";
import { authClient } from "~/server/better-auth/client";

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	return <>{children}</>;
}

// Custom hook for session management
export function useSession() {
	const { data: session, isPending, error } = authClient.useSession();

	return {
		session,
		isPending,
		error,
		isAuthenticated: !!session,
		user: session?.user,
	};
}
