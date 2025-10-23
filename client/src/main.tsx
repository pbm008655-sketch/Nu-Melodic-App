import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service Worker temporarily disabled to fix caching issues
// Uncomment when SW is properly configured with cache versioning
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('Service Worker registered successfully:', registration.scope);
//       })
//       .catch((error) => {
//         console.log('Service Worker registration failed:', error);
//       });
//   });
// }

createRoot(document.getElementById("root")!).render(<App />);
