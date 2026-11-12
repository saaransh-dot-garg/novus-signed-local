import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fieldnotes/ui/styles.css";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

// Boot Novus once with an anonymous visitor. AuthProvider identifies the signed-in user.
pendo.initialize({ visitor: { id: "" } });

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
