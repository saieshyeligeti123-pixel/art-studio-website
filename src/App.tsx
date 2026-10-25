import React from 'react';
import { AppStoreProvider, useAppStore } from './lib/store';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { PaintingsPage } from './components/paintings/PaintingsPage';
import { MuralBookingPage } from './components/murals/MuralBookingPage';
import { PotteryPage } from './components/pottery/PotteryPage';
import { AuthPage } from './components/auth/AuthPage';
import { CustomerDashboard } from './components/dashboard/CustomerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ToastContainer } from './components/common/ToastContainer';
import { SeedDataGuideModal } from './components/common/SeedDataGuideModal';

const MainContent: React.FC = () => {
  const { currentPage } = useAppStore();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'paintings':
        return <PaintingsPage />;
      case 'murals':
        return <MuralBookingPage />;
      case 'pottery':
        return <PotteryPage />;
      case 'login':
        return <AuthPage initialMode="login" />;
      case 'register':
        return <AuthPage initialMode="register" />;
      case 'customer-dashboard':
        return <CustomerDashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      <Navbar />
      <main className="flex-1">{renderCurrentPage()}</main>
      <Footer />
      <ToastContainer />
      <SeedDataGuideModal />
    </div>
  );
};

export default function App() {
  return (
    <AppStoreProvider>
      <MainContent />
    </AppStoreProvider>
  );
}
