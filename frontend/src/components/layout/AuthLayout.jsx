import { Outlet, ScrollRestoration } from "react-router-dom";
import Navbar from "./Navbar";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}