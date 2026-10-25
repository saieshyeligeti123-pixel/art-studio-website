import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { PageView, Role } from '../../types';
import {
  Palette,
  Layers,
  Sparkles,
  User,
  Shield,
  LogOut,
  Database,
  Menu,
  X,
  Compass,
  ArrowRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    switchUserRole,
    logout,
    setSeedGuideOpen,
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navigateTo = (page: PageView) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DCC4] transition-all">
      {/* Top Banner: GDGC Assignment Context & Preview State Notice */}
      <div className="bg-[#1C1917] text-[#FAF7F2] px-4 py-1.5 text-xs font-sans flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-stone-300">GDGC Selection Assignment</span>
          <span className="text-stone-500 hidden sm:inline">|</span>
          <span className="text-stone-400 hidden sm:inline">
            Official seedData.zip Ingested · 12 Indian Folk & Classical Artworks · 5 Pottery Silhouettes · 6 Glazes · ₹150/sq ft Mural Rate
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSeedGuideOpen(true)}
            className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 text-xs font-medium transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="underline underline-offset-2">Seed Data & DB Setup</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <button
            onClick={() => navigateTo('home')}
            className="flex flex-col text-left group transition-transform"
          >
            <span className="font-serif text-2xl sm:text-3xl tracking-tight text-stone-900 group-hover:text-[#9E6B38] transition-colors">
              Atelier Terre & Toile
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">
              Paintings · Wall Murals · Studio Ceramics
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => navigateTo('home')}
              className={`text-sm tracking-wide font-sans transition-colors relative py-1 ${
                currentPage === 'home'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#9E6B38]'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => navigateTo('paintings')}
              className={`text-sm tracking-wide font-sans transition-colors relative py-1 ${
                currentPage === 'paintings'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#9E6B38]'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Paintings Gallery
            </button>
            <button
              onClick={() => navigateTo('murals')}
              className={`text-sm tracking-wide font-sans transition-colors relative py-1 ${
                currentPage === 'murals'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#9E6B38]'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Wall Murals
            </button>
            <button
              onClick={() => navigateTo('pottery')}
              className={`text-sm tracking-wide font-sans transition-colors relative py-1 ${
                currentPage === 'pottery'
                  ? 'text-stone-950 font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#9E6B38]'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Custom Pottery
            </button>
          </nav>

          {/* Right Action / Role Switcher / Profile */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Quick Demo Role Switcher Segment */}
            <div className="flex items-center bg-[#EFE8DD] p-1 rounded-sm border border-[#E0D3C1] text-xs">
              <button
                onClick={() => switchUserRole('customer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-all ${
                  currentUser?.role === 'customer'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Switch to Customer perspective"
              >
                <User className="w-3.5 h-3.5 text-stone-700" />
                <span>Customer</span>
              </button>
              <button
                onClick={() => switchUserRole('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-all ${
                  currentUser?.role === 'admin'
                    ? 'bg-[#1C1917] text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Switch to Admin curator perspective"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin</span>
              </button>
            </div>

            {/* Dashboard Link / Auth */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() =>
                    navigateTo(currentUser.role === 'admin' ? 'admin-dashboard' : 'customer-dashboard')
                  }
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-sm border transition-all ${
                    currentPage.includes('dashboard')
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-800 border-[#D8CCC4] hover:border-stone-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    {currentUser.role === 'admin' ? 'Admin Dashboard' : 'My Orders & Requests'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 text-xs font-medium rounded-sm transition-colors"
              >
                Sign In
              </button>
            )}

            {currentUser && (
              <button
                onClick={logout}
                className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setSeedGuideOpen(true)}
              className="p-2 text-stone-700 border border-[#D8CCC4] rounded-sm bg-white"
              aria-label="Seed data guide"
            >
              <Database className="w-4 h-4 text-[#9E6B38]" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-800 border border-[#D8CCC4] rounded-sm bg-white"
              aria-label="Open main menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8DCC4] bg-[#FAF7F2] px-6 py-6 space-y-6 shadow-xl animate-fade-in">
          {/* Role switcher for mobile */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2">
              Demo Role Mode
            </span>
            <div className="flex items-center bg-[#EFE8DD] p-1 rounded-sm border border-[#E0D3C1] text-xs w-full">
              <button
                onClick={() => switchUserRole('customer')}
                className={`flex-1 py-1.5 text-center font-medium rounded-sm ${
                  currentUser?.role === 'customer' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                Customer Demo
              </button>
              <button
                onClick={() => switchUserRole('admin')}
                className={`flex-1 py-1.5 text-center font-medium rounded-sm ${
                  currentUser?.role === 'admin' ? 'bg-[#1C1917] text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Admin Curator Demo
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-3 font-serif text-lg text-stone-900 border-y border-[#E8DCC4] py-4">
            <button
              onClick={() => navigateTo('home')}
              className="text-left py-1 hover:text-[#9E6B38] transition-colors"
            >
              Studio Home
            </button>
            <button
              onClick={() => navigateTo('paintings')}
              className="text-left py-1 hover:text-[#9E6B38] transition-colors"
            >
              Original Paintings Gallery
            </button>
            <button
              onClick={() => navigateTo('murals')}
              className="text-left py-1 hover:text-[#9E6B38] transition-colors"
            >
              Wall Murals & Booking
            </button>
            <button
              onClick={() => navigateTo('pottery')}
              className="text-left py-1 hover:text-[#9E6B38] transition-colors"
            >
              Custom Pottery Requests
            </button>
          </div>

          <div className="space-y-3">
            {currentUser ? (
              <>
                <button
                  onClick={() =>
                    navigateTo(currentUser.role === 'admin' ? 'admin-dashboard' : 'customer-dashboard')
                  }
                  className="w-full py-2.5 px-4 bg-[#1C1917] text-white text-xs font-medium rounded-sm flex items-center justify-between"
                >
                  <span>{currentUser.role === 'admin' ? 'Open Admin Suite' : 'My Orders & Requests'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-between text-xs text-stone-500 pt-2">
                  <span>Signed in: {currentUser.name} ({currentUser.role})</span>
                  <button onClick={logout} className="text-stone-700 underline">Sign out</button>
                </div>
              </>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className="w-full py-2.5 bg-stone-900 text-white text-xs font-medium rounded-sm"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
