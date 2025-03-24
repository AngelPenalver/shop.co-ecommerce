"use client";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Provider } from "react-redux";
import { makeStore } from "./lib/store";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "400", "500", "600", "700", "800", "900"],
});

const store = makeStore();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Provider store={store}>
        <body className={`${poppins.className}`}>{children}</body>
      </Provider>
    </html>
  );
}
