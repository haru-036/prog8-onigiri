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
import Extraction from "./Extraction.tsx";
import GroupsList from "./GroupsList.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />

          <Route element={<Layout />}>
            <Route path="/new-group" element={<NewGroup />} />

            <Route path="/groups" element={<GroupsList />} />
            <Route path="/groups/:groupId" element={<Group />} />
            <Route path="/groups/:groupId/:taskId" element={<TaskDetail />} />

            <Route
              path="/groups/:groupId/extraction"
              element={<Extraction />}
            />
            <Route path="/groups/:groupId/result" element={<Result />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
