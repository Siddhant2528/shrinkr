import "./globals.css"
import { ToastProvider } from "@/hooks/useToast"
import { ThemeProvider } from "next-themes"

export const metadata = {
    title: {
        default: "Shrinkr — URL Shortener & Analytics",
        template: "%s | Shrinkr",
    },
    description:
        "A developer-focused URL shortener with real-time analytics, geo tracking, QR codes, and Redis caching. Built with FastAPI and Next.js.",
    keywords: ["url shortener", "link shortener", "analytics", "qr code", "short link"],
    authors: [{ name: "Shrinkr" }],
    openGraph: {
        title: "Shrinkr — URL Shortener & Analytics",
        description:
            "Shorten URLs, track clicks, view analytics by country, device, and browser.",
        type: "website",
        siteName: "Shrinkr",
    },
    twitter: {
        card: "summary",
        title: "Shrinkr — URL Shortener & Analytics",
        description: "Shorten URLs and track everything.",
    },
    metadataBase: new URL("https://shrinkr.vercel.app"),
}

export const viewport = {
    themeColor: "#3B82F6",
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var savedTheme = localStorage.getItem('theme');
                                    var isDark = savedTheme === 'dark';
                                    if (isDark) {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className="bg-shrinkr-bg min-h-screen">
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}