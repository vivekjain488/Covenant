import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WalletProvider } from "./context/WalletContext";
import "./index.css";
import App from "./App.jsx";

const rootElement = document.getElementById("root");

createRoot(rootElement).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>,
);
