import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// find an HTML element with the ID "root" in the DOM
// 
createRoot(document.getElementById("root")!).render(<App />);
