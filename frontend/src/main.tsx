import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Correct imports
import Layout from "./components/Layout";
import { Assignments, Grading, Settings, Dashboard, Stub } from "./pages";
import "./index.css";
import React from "react";

export function App(): React.JSX.Element {
  return (
    <Router basename="/khoury-classroom">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="assignments" element={<Assignments />} />
          <Route path="grading" element={<Grading />} />
          <Route path="settings" element={<Settings />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stub" element={<Stub />} />
        </Route>
      </Routes>
    </Router>
  );
}

// Safely handle the root element -> Enforced by eslint
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Unable to render React app.");
}

ReactDOM.createRoot(rootElement).render(<App />);
