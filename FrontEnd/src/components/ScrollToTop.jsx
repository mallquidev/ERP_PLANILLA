// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop({ behavior = "smooth" }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollWindow = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior });
      } catch {
        window.scrollTo(0, 0);
      }

      const docEl = document.scrollingElement || document.documentElement;
      if (docEl) docEl.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };

    const scrollCommonContainers = () => {
      const selectors = [
        "#content",
        ".content",
        ".main-content",
        ".layout-content",
        "main",
        "#root",
        "#app",
      ];
      selectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        try {
          el.scrollTo({ top: 0, left: 0, behavior });
        } catch {
          el.scrollTop = 0;
        }
      });
    };

    const scrollScrollableElementsHeuristic = () => {
      // Busca cualquier elemento con overflow que sea realmente scrolleable
      const all = Array.from(document.querySelectorAll("*"));
      for (const el of all) {
        const st = window.getComputedStyle(el);
        const mayScroll =
          /(auto|scroll)/.test(st.overflow + " " + st.overflowY + " " + st.overflowX);
        if (mayScroll && el.scrollHeight > el.clientHeight + 2) {
          try {
            el.scrollTo({ top: 0, left: 0, behavior: "auto" });
          } catch {
            el.scrollTop = 0;
          }
        }
      }
    };

    // 1) Inmediato
    scrollWindow();
    scrollCommonContainers();
    scrollScrollableElementsHeuristic();

    // 2) Tras el render/pintado (por si el contenido aparece luego)
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollWindow();
        scrollCommonContainers();
        scrollScrollableElementsHeuristic();
      }, 0);
    });
  }, [pathname, behavior]);

  return null;
}
