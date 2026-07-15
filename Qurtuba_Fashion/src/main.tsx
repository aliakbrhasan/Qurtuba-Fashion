
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/browser-compatibility.css";
  import "./styles/tailwind-compatibility.css";
  import "./sync";

  // Suppress aria-hidden warnings from Radix UI components (expected behavior)
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Blocked aria-hidden')) {
      // Suppress Radix UI aria-hidden warnings as they are expected behavior
      return;
    }
    originalError.apply(console, args);
  };

  createRoot(document.getElementById("root")!).render(<App />);
  