import "./globals.css";

export const metadata = { title: "MAXIMUS — Beyond the ordinary", description: "An immersive cinematic experience. Explore Maximus through scroll-driven storytelling and your own frame sequences." };
export const viewport = { themeColor: "#0c0d0c" };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
