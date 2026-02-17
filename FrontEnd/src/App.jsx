// src/App.jsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import ScrollToTop from "./components/ScrollToTop";
import {HeroUIProvider} from "@heroui/react"

export default function App() {
  return (
      <BrowserRouter>
        <ScrollToTop behavior="smooth" />
        <AppRouter />
      </BrowserRouter>
  );
}
