import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./components/ui/theme-provider";
import App from "./App";
import "./index.css";

// Suppress Supabase "Failed to fetch" errors when Supabase is not configured
// This allows the app to function with test users without console spam
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to fetch') || 
      event.reason?.name === 'AuthRetryableFetchError') {
    event.preventDefault();
    // Silently ignore Supabase connection errors
  }
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="cadet-theme">
    <App />
  </ThemeProvider>
);
