import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AirtimeData from "./pages/AirtimeData";
import CableTV from "./pages/CableTV";
import Electricity from "./pages/Electricity";
import BulkSMS from "./pages/BulkSMS";
import EduPins from "./pages/EduPins";
import Referral from "./pages/Referral";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedWithLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedWithLayout><Dashboard /></ProtectedWithLayout>} />
            <Route path="/services/airtime" element={<ProtectedWithLayout><AirtimeData /></ProtectedWithLayout>} />
            <Route path="/services/cable" element={<ProtectedWithLayout><CableTV /></ProtectedWithLayout>} />
            <Route path="/services/electricity" element={<ProtectedWithLayout><Electricity /></ProtectedWithLayout>} />
            <Route path="/services/sms" element={<ProtectedWithLayout><BulkSMS /></ProtectedWithLayout>} />
            <Route path="/services/edu" element={<ProtectedWithLayout><EduPins /></ProtectedWithLayout>} />
            <Route path="/referral" element={<ProtectedWithLayout><Referral /></ProtectedWithLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
