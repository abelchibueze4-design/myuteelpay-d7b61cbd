import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardWrapper } from "@/components/DashboardWrapper";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";

// Services
import Airtime from "./pages/Airtime";
import Data from "./pages/Data";
import Services from "./pages/Services";
import CableTV from "./pages/CableTV";
import Electricity from "./pages/Electricity";
import EduPins from "./pages/EduPins";
import Referral from "./pages/Referral";
import DataCard from "./pages/DataCard";
import InternationalAirtime from "./pages/InternationalAirtime";
import FAQs from "./pages/FAQs";
import DebugKVData from "./pages/DebugKVData";
import KycVerification from "./pages/KycVerification";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import TransactionMonitoring from "./pages/admin/TransactionMonitoring";
import ServiceManagement from "./pages/admin/ServiceManagement";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AuditLogs from "./pages/admin/AuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import WalletFinance from "./pages/admin/WalletFinance";
import ReferralCommission from "./pages/admin/ReferralCommission";
import SecurityMonitoring from "./pages/admin/SecurityMonitoring";
import Reports from "./pages/admin/Reports";
import Reconciliation from "./pages/admin/Reconciliation";
import NotificationCenter from "./pages/admin/NotificationCenter";
import AdminKycReview from "./pages/admin/AdminKycReview";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedWithLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardWrapper>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardWrapper>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} storageKey="uteelpay-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* User Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedWithLayout>
                    <Dashboard />
                  </ProtectedWithLayout>
                }
              />

              {/* Services */}
              <Route
                path="/services"
                element={
                  <ProtectedWithLayout>
                    <Services />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/airtime"
                element={
                  <ProtectedWithLayout>
                    <Airtime />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/data"
                element={
                  <ProtectedWithLayout>
                    <Data />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/cable"
                element={
                  <ProtectedWithLayout>
                    <CableTV />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/electricity"
                element={
                  <ProtectedWithLayout>
                    <Electricity />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/edu"
                element={
                  <ProtectedWithLayout>
                    <EduPins />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/referral"
                element={
                  <ProtectedWithLayout>
                    <Referral />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/data-card"
                element={
                  <ProtectedWithLayout>
                    <DataCard />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/intl-airtime"
                element={
                  <ProtectedWithLayout>
                    <InternationalAirtime />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/services/insurance"
                element={
                  <ProtectedWithLayout>
                    <Insurance />
                  </ProtectedWithLayout>
                }
              />
              <Route
                path="/kyc"
                element={
                  <ProtectedWithLayout>
                    <KycVerification />
                  </ProtectedWithLayout>
                }
              />
              <Route path="/faqs" element={<FAQs />} />

              {/* Admin Protected Routes */}
              <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
              <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
              <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
              <Route path="/admin/users/kyc" element={<AdminLayout><AdminKycReview /></AdminLayout>} />
              <Route path="/admin/transactions" element={<AdminLayout><TransactionMonitoring /></AdminLayout>} />
              <Route path="/admin/finance" element={<AdminLayout><WalletFinance /></AdminLayout>} />
              <Route path="/admin/finance/refunds" element={<AdminLayout><WalletFinance /></AdminLayout>} />
              <Route path="/admin/services" element={<AdminLayout><ServiceManagement /></AdminLayout>} />
              <Route path="/admin/referrals" element={<AdminLayout><ReferralCommission /></AdminLayout>} />
              <Route path="/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
              <Route path="/admin/logs" element={<AdminLayout><AuditLogs /></AdminLayout>} />
              <Route path="/admin/security" element={<AdminLayout><SecurityMonitoring /></AdminLayout>} />
              <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
              <Route path="/admin/reconciliation" element={<AdminLayout><Reconciliation /></AdminLayout>} />
              <Route path="/admin/notifications" element={<AdminLayout><NotificationCenter /></AdminLayout>} />
              <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />

              <Route
                path="/debug/kvdata"
                element={
                  <ProtectedWithLayout>
                    <DebugKVData />
                  </ProtectedWithLayout>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;