import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Policies from "./pages/Policies";
import ThreatLogs from "./pages/ThreatLogs";
import LiveDemo from "./pages/LiveDemo";
import AgentStudioPage from "./pages/AgentStudioPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AccountPage from "./pages/AccountPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="policies" element={<Policies />} />
          <Route path="studio" element={<AgentStudioPage />} />
          <Route path="threats" element={<ThreatLogs />} />
          <Route path="demo" element={<LiveDemo />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}