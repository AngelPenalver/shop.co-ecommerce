"use client";
import { Suspense } from "react";
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

function RouteChangeFallback() {
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className}>
      <head>
        <title>Funiro</title>
        <link rel="shortcut icon" href="./" type="image/x-icon" />
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <ReduxProvider>
          <AuthInitializer />
          <Suspense fallback={<RouteChangeFallback />}>
            <RouteChangeHandler />
          </Suspense>
          <AddToCartModal />
          <AuthModal />
          <Suspense fallback={<RouteChangeFallback />}>
            <NavBar />
          </Suspense>
          <AlertManager />
          <main>{children}</main>
        </ReduxProvider>
      </body>
    </html>
  );
}
