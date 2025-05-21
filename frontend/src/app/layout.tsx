"use client";
import { Suspense } from "react"; // Asegúrate de importar Suspense
import { Poppins } from "next/font/google";
import "./globals.css";
import RouteChangeHandler from "./components/RouteChangeHandler"; // O RouteHandler si es el nombre correcto del archivo
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

// Un fallback simple para el Suspense
function RouteChangeFallback() {
  // Este fallback no debe usar usePathname, useSearchParams, etc.
  // Podría ser null o un spinner muy básico si fuera necesario,
  // pero para un handler de ruta, null podría ser suficiente
  // si no quieres mostrar nada mientras se "suspende".
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
