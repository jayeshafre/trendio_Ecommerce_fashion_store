import { Outlet, ScrollRestoration } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget  from "@components/ai/ChatWidget";

export default function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <ScrollRestoration />
      <Footer/>
      <ChatWidget />
    </div>
  );
}
