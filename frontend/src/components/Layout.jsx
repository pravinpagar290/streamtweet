import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default Layout;
