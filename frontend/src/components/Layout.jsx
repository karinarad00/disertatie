import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ user }) => {
  const location = useLocation();

  // Paths where navbar/footer should be hidden
  const noNavFooterPaths = ["/login", "/register", "/cerere-angajator"];
  const isCerereAction = /^\/cerere\/[^/]+\/(aproba|respinge)$/.test(location.pathname);
  const hideNavbarFooter = noNavFooterPaths.includes(location.pathname) || isCerereAction;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!hideNavbarFooter && <Navbar user={user} />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideNavbarFooter && <Footer />}
    </div>
  );
};

export default Layout;
