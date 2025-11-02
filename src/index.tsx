import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
);
