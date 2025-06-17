import { Outlet } from "react-router";
import Header from "./header";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Outlet />
    </div>
  );
}
