// src/Layout.jsx
import React, { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./components/TopBar";
import SidebarMenu from "./components/SidebarMenu";
import "./layout.css";

/**
 * Layout fijo: TopBar (arriba), Sidebar (izquierda), Contenido (derecha)
 * El Sidebar es el ÚNICO menú y no desaparece al navegar.
 * Ahora además: resetea el scroll del panel .content al cambiar de ruta.
 */
export default function Layout() {
  const contentRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    // 1) Scroll del panel de contenido (el que tiene overflow: auto)
    if (contentRef.current) {
      try {
        contentRef.current.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } catch {
        contentRef.current.scrollTop = 0;
      }
    }
    // 2) Por si acaso, también resetea la ventana
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <div className="app-shell">
      <TopBar />

      <div className="app-body">
        <aside className="sidebar">
          <SidebarMenu />
        </aside>

        {/* Este es el contenedor scrolleable según tu CSS (.content { overflow: auto; }) */}
        <main className="content" ref={contentRef}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
