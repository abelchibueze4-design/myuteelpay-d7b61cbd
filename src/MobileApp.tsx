import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MobileLanding from "@/pages/MobileLanding";
import MobileDashboard from "@/pages/MobileDashboard";
import MobileServicePage from "@/pages/MobileServicePage";

// Mobile-first wrapper component that conditionally renders mobile or desktop layouts
const MobileAppWrapper = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Simulate app loading
    setTimeout(() => setIsLoading(false), 1000);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <div className="w-8 h-8 bg-white rounded-lg animate-pulse"></div>
          </div>
          <h2 className="text-lg font-bold text-purple-700 mb-2">Uteelpay</h2>
          <p className="text-sm text-purple-600">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'mobile-container' : 'max-w-7xl mx-auto'} min-h-screen`}>
      <Router>
        <Routes>
          {/* Mobile Routes */}
          <Route path="/" element={<MobileLanding />} />
          <Route path="/dashboard" element={<MobileDashboard />} />
          <Route path="/services" element={<MobileServicePage serviceType="services" title="All Services" />} />
          <Route path="/services/airtime" element={<MobileServicePage serviceType="airtime" title="Buy Airtime" />} />
          <Route path="/services/data" element={<MobileServicePage serviceType="data" title="Buy Data" />} />
          <Route path="/services/cable" element={<MobileServicePage serviceType="cable" title="Cable TV" />} />
          <Route path="/services/electricity" element={<MobileServicePage serviceType="electricity" title="Pay Electricity" />} />
          <Route path="/services/sms" element={<MobileServicePage serviceType="sms" title="Bulk SMS" />} />
          <Route path="/services/edu" element={<MobileServicePage serviceType="edu" title="Education Pins" />} />
          <Route path="/referral" element={<MobileServicePage serviceType="referral" title="Refer & Earn" />} />
          
          {/* Fallback for desktop - redirect to existing app */}
          {!isMobile && (
            <Route path="*" element={<Navigate to="/app" replace />} />
          )}
        </Routes>
      </Router>
    </div>
  );
};

// Main App component that decides between mobile and desktop experiences
const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileAppWrapper />
    </div>
  );
};

export default App;