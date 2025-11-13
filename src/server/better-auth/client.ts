import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	plugins: [passkeyClient()],
});

export type Session = typeof authClient.$Infer.Session;
