import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/services/airtime" element={<AirtimeData />} />
          <Route path="/services/cable" element={<CableTV />} />
          <Route path="/services/electricity" element={<Electricity />} />
          <Route path="/services/sms" element={<BulkSMS />} />
          <Route path="/services/edu" element={<EduPins />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
