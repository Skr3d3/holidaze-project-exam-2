import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";
import { HashRouter } from "react-router-dom";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppProviders>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </AppProviders>
  </React.StrictMode>
);
