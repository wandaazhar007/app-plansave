// src/pages/app/AppLayout.tsx
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../../components/navbar/Navbar";
import Sidebar from "../../components/sidebar/Sidebar";
import Footer from "../../components/footer/Footer";

import styles from "./AppLayout.module.scss";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className={styles.body}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={styles.main}>
          <div className="container page">
            <Outlet />
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}