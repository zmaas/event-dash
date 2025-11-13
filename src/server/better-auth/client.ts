import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	plugins: [passkeyClient(), adminClient()],
});

export type Session = typeof authClient.$Infer.Session;
