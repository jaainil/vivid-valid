import { createRoot } from "react-dom/client";
import "@fontsource-variable/syne";
import "@fontsource/outfit";
import "@fontsource/dm-mono";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
