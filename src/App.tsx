import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AirtimeData from "./pages/AirtimeData";
import CableTV from "./pages/CableTV";
import Electricity from "./pages/Electricity";
import BulkSMS from "./pages/BulkSMS";
import EduPins from "./pages/EduPins";
import Referral from "./pages/Referral";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/services/airtime" element={<ProtectedRoute><AirtimeData /></ProtectedRoute>} />
            <Route path="/services/cable" element={<ProtectedRoute><CableTV /></ProtectedRoute>} />
            <Route path="/services/electricity" element={<ProtectedRoute><Electricity /></ProtectedRoute>} />
            <Route path="/services/sms" element={<ProtectedRoute><BulkSMS /></ProtectedRoute>} />
            <Route path="/services/edu" element={<ProtectedRoute><EduPins /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
