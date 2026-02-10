import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import { GlobalProvider } from "./GlobalContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GlobalProvider>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </GlobalProvider>
);
