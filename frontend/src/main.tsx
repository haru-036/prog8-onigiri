import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import Group from "./Group.tsx";
import NewGroup from "./NewGroup.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/group" element={<Group />} />
        <Route path="/new-group" element={<NewGroup />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
