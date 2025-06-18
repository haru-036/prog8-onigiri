import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import Group from "./Group.tsx";
import NewGroup from "./NewGroup.tsx";
import TaskDetail from "./TaskDetail.tsx";
import Layout from "./components/layout.tsx";
import Result from "./Result.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/result" element={<Result />} />
        <Route element={<Layout />}>
          <Route path="/new-group" element={<NewGroup />} />
          <Route path="/group" element={<Group />} />
          <Route path="/group/:taskId" element={<TaskDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
