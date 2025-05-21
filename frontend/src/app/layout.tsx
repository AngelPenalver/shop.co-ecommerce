"use client";
import { Poppins } from "next/font/google";
import "./globals.css";
import RouteChangeHandler from "./components/RouteChangeHandler";
import NavBar from "./components/NavBar/NavBar";
import AddToCartModal from "./components/addToCartModal/AddToCartModal";
import AuthModal from "./components/auth/AuthModal/AuthModal";
import ReduxProvider from "./lib/ProviderRedux";
import { AlertManager } from "./components/AlertManager";
import AuthInitializer from "./components/AuthInitializer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <ReduxProvider>
          <AuthInitializer />
          <RouteChangeHandler />
          <AddToCartModal />
          <AuthModal />
          <NavBar />
          <AlertManager />
          <main>{children}</main>
        </ReduxProvider>
      </body>
    </html>
  );
}
