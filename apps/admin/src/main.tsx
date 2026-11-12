import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fieldnotes/ui/styles.css";
import { App } from "./App";
import { AdminAuthProvider } from "./auth/AdminAuthContext";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

// Boot Novus once with an anonymous visitor. AdminAuthProvider identifies the signed-in admin.
pendo.initialize({ visitor: { id: "" } });

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
