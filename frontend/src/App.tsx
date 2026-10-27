import { Link, Route, Routes } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Shell } from "./components/AppShell";
import { Heading } from "./components/shared";
import { AccountDetail } from "./pages/AccountDetail";
import { Accounts } from "./pages/Accounts";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route
          path="*"
          element={
            <div className="content">
              <Heading title="Page not found" />
              <Link to="/" className="text-link">
                Go to dashboard <ArrowRight />
              </Link>
            </div>
          }
        />
      </Routes>
    </Shell>
  );
}