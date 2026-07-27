import "./globals.css";

export const metadata = {
  title: "Split & Settle",
  description:
    "Track shared expenses with roommates and friends, and let an AI mediator draft the fair, awkward-free settlement message.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
