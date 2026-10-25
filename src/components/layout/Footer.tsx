import React from 'react';
import { useAppStore } from '../../lib/store';
import { Database, RotateCcw, MapPin, Clock, Mail, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage, setSeedGuideOpen, resetToSeedPreviewData } = useAppStore();

  return (
    <footer className="bg-[#1C1917] text-[#FAF7F2] border-t border-stone-800 pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="font-serif text-2xl text-stone-100 tracking-tight">
              Atelier Terre & Toile
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              A contemporary fine art studio specializing in original textural canvas paintings, site-specific architectural wall murals, and slow-crafted wheel-thrown ceramics.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full-Stack Node.js & SQLite Architecture</span>
            </div>
          </div>

          {/* Studio Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Studio Disciplines
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => setCurrentPage('paintings')}
                  className="hover:text-amber-300 transition-colors"
                >
                  Original Canvas Paintings
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('murals')}
                  className="hover:text-amber-300 transition-colors"
                >
                  Architectural Wall Murals (₹150/sq ft)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('pottery')}
                  className="hover:text-amber-300 transition-colors"
                >
                  Custom Ceramic Commissions
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('customer-dashboard')}
                  className="hover:text-amber-300 transition-colors"
                >
                  Customer Orders & Status
                </button>
              </li>
            </ul>
          </div>

          {/* Studio Visit & Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Gallery & Kiln House
            </h4>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>714 Montgomery Lane, Arts District, San Francisco, CA</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>Tuesday – Saturday: 10:00 AM – 6:00 PM</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>curator@atelier-toile.art</span>
              </div>
            </div>
          </div>

          {/* Assignment / Developer Toolkit */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Assignment Architecture
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              GDGC Web Development Domain Selection. Contains complete state schemas, domain validation rules, and SQLite persistence.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setSeedGuideOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-sm border border-stone-700 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Seed & Database Inspector</span>
              </button>
              <button
                onClick={resetToSeedPreviewData}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-medium rounded-sm border border-stone-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Preview Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Atelier Terre & Toile. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-stone-500">Security Rule: Server-Authoritative RBAC (401/403/404)</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-500">Zero-pill typography</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
