import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/home";
import GeneratorPage from "./pages/generator";
import PreviewPage from "./pages/preview";
import ReviewPage from "./pages/review";
import DashboardPage from "./pages/dashboard";
import PaymentPage from "./pages/payment";
import AuthPage from "./pages/auth";
import NavBar from "./components/NavBar";
import MobileMenu from "./components/MobileMenu";
import React from "react";
import DatabaseConfig from "./pages/uploader";
import Profile from "./pages/profile";

import "./firebase";
import AdminDashboard from "./pages/admin/dashboard";
import CreateTemplate from "./pages/admin/createTemplate";
import MultiPreviewPage from "./pages/preview-multi";
import MultiPaymentPage from "./pages/payment-multi";

const linkArray = [
  {
    name: "Home",
    url: "/",
  },
  {
    name: "Pricing",
    url: "/pricing",
  },
  {
    name: "Dashboard",
    url: "/dashboard",
  },
];

function App() {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  return (
    <div className="min-h-screen text-center">
      <div className="min-h-screen">
        <div className="px-6">
          <NavBar setShowMobileMenu={setShowMobileMenu} linkArray={linkArray} />
        </div>
        {showMobileMenu && <MobileMenu setShowMobileMenu={setShowMobileMenu} linkArray={linkArray} />}
        <section className="h-full px-6 m-auto md:px-0 max-w-default">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/generator" element={<GeneratorPage />} />
            <Route path="/generator/:configId" element={<GeneratorPage />} />
            <Route path="/preview/:configId" element={<PreviewPage />} />
            <Route path="/preview/m/:configId" element={<MultiPreviewPage />} />
            <Route path="/payment/:configId" element={<PaymentPage />} />
            <Route path="/payment/m/:configId" element={<MultiPaymentPage />} />
            <Route path="/review/:configId" element={<ReviewPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/uploader" element={<DatabaseConfig />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/create-template" element={<CreateTemplate />} />
          </Routes>
        </section>
      </div>
      <Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />
    </div>
  );
}

export default App;
