import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AuthProvider } from "~/components/auth-provider";

export const metadata: Metadata = {
	title: "Event Dashboard Demo",
	description: "Demo app by Zach Maas",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

// Note: we suppress hydration warnings here because dark mode creates a mismatch
export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>
						<SidebarProvider
							style={
								{
									"--sidebar-width": "calc(var(--spacing) * 72)",
									"--header-height": "calc(var(--spacing) * 12)",
								} as React.CSSProperties
							}
						>
							<AppSidebar variant="inset" />
							<SidebarInset>
								<SiteHeader />
								<div className="flex flex-1 flex-col">
									<div className="@container/main flex flex-1 flex-col gap-2">
										<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
											{children}
										</div>
									</div>
								</div>
							</SidebarInset>
						</SidebarProvider>
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
