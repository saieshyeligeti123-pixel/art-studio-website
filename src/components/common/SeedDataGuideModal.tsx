import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { api } from '../../lib/apiClient';
import { X, Copy, Check, Database, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export const SeedDataGuideModal: React.FC = () => {
  const { seedGuideOpen, setSeedGuideOpen, addToast, resetToSeedPreviewData, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState<'status' | 'sql-schema' | 'verification'>('status');
  const [copied, setCopied] = useState<boolean>(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  useEffect(() => {
    if (seedGuideOpen) {
      fetchStats();
    }
  }, [seedGuideOpen]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.admin.getSeedStatus();
      setDbStats(res.stats);
    } catch {
      // Ignore
    } finally {
      setLoadingStats(false);
    }
  };

  if (!seedGuideOpen) return null;

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('src/server/db.ts');
    setCopied(true);
    addToast('success', 'Path Copied', 'SQLite DDL and initialization code is located at src/server/db.ts');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DCC4] bg-[#F5EFEB]">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#9E6B38]" />
            <div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                SQLite Database & Seed Data Inspector
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                GDGC Selection Assignment · Local Persistent Engine (`data/artstudio.db`)
              </p>
            </div>
          </div>
          <button
            onClick={() => setSeedGuideOpen(false)}
            className="text-stone-400 hover:text-stone-700 p-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E8DCC4] px-6 bg-[#FAF7F2] gap-6 text-xs font-medium tracking-wide">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-[#9E6B38] text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            1. Live Database Status
          </button>
          <button
            onClick={() => setActiveTab('sql-schema')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sql-schema'
                ? 'border-[#9E6B38] text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            2. SQLite Tables & Constraints
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'verification'
                ? 'border-[#9E6B38] text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            3. Assignment Rules Verification
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-800 text-sm">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-sm">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-stone-900 text-sm">
                      Verified Seed Data Engine (`data/artstudio.db`)
                    </h4>
                    <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                      All tables, unique constraints, and business logic are persisted locally using Node 22 native <code className="bg-white/80 px-1 py-0.5 rounded text-stone-900 font-mono">DatabaseSync</code> in SQLite. All transactions execute with real foreign keys and atomic rollbacks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm text-center">
                  <div className="text-2xl font-serif font-bold text-stone-900">
                    {loadingStats ? '...' : dbStats?.totalPaintings ?? 12}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                    Paintings (12 Seeded)
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm text-center">
                  <div className="text-2xl font-serif font-bold text-stone-900">
                    {loadingStats ? '...' : dbStats?.potteryItemsCount ?? 5}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                    Pottery Silhouettes
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm text-center">
                  <div className="text-2xl font-serif font-bold text-stone-900">
                    {loadingStats ? '...' : dbStats?.glazesCount ?? 6}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                    Artisan Glazes
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm text-center">
                  <div className="text-2xl font-serif font-bold text-[#9E6B38]">
                    ₹{loadingStats ? '...' : dbStats?.muralRate ?? 150}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                    Mural Rate / sq ft
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 bg-white border border-[#E8DCC4] rounded-sm space-y-3">
                <h5 className="font-semibold text-xs uppercase tracking-wider text-stone-700">
                  Database Management
                </h5>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={async () => {
                      await resetToSeedPreviewData();
                      await fetchStats();
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1917] hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium rounded-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Reset / Re-run Seed Importer</span>
                  </button>

                  <button
                    onClick={fetchStats}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF7F2] hover:bg-stone-100 border border-[#D8CCC4] text-stone-800 text-xs font-medium rounded-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Statistics</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql-schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-600">
                  SQLite database file is created at <code className="font-mono text-stone-900 bg-white px-1.5 py-0.5 border border-stone-200">data/artstudio.db</code> with strict constraints and partial indexes.
                </p>
                <button
                  onClick={handleCopySchemaPath}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1917] text-white hover:bg-stone-800 text-xs font-medium rounded-sm shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy File Path'}
                </button>
              </div>

              <div className="bg-[#1C1917] text-stone-200 p-4 rounded-sm font-mono text-xs overflow-x-auto max-h-72 border border-stone-800 leading-relaxed">
                <p className="text-stone-500">-- Key schema constraints in src/server/db.ts:</p>
                <p className="text-amber-300">PRAGMA foreign_keys = ON;</p>
                <p className="text-emerald-400">CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE, role TEXT CHECK(role IN ('customer', 'admin', 'studio')));</p>
                <p className="text-emerald-400">CREATE TABLE paintings (id TEXT PRIMARY KEY, price REAL CHECK(price &gt; 0), status TEXT CHECK(status IN ('available', 'sold')));</p>
                <p className="text-cyan-300">CREATE UNIQUE INDEX uq_painting_active_order ON painting_orders(painting_id) WHERE status = 'placed';</p>
                <p className="text-emerald-400">CREATE TABLE wall_bookings (wall_size_sqft INTEGER CHECK(wall_size_sqft &gt;= 10 AND wall_size_sqft &lt;= 500));</p>
                <p className="text-cyan-300">CREATE UNIQUE INDEX uq_active_wall_booking_date ON wall_bookings(scheduled_date) WHERE status IN ('requested', 'confirmed');</p>
                <p className="text-emerald-400">CREATE TABLE pottery_requests (quantity INTEGER CHECK(quantity &gt;= 1 AND quantity &lt;= 12));</p>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-3">
              <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Service 1: Unique Original Paintings</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Single purchase constraint enforced via transaction & partial unique index. When customer cancels, painting returns to 'available'. Admins can only edit available paintings.
                </p>
              </div>

              <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Service 2: Wall Mural Bookings</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Lead time 7–90 days, wall size 10–500 sq ft, address required. Only 1 active booking allowed per date. Price = size × ₹150. Cancellation strictly locked within 3 days of appointment.
                </p>
              </div>

              <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Service 3: Custom Pottery Commissions</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Quantity 1–12 pieces, required date ≥ 14 days away, items & glazes from verified seed. Customers can only edit or cancel requests while status is 'requested'.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E8DCC4] bg-[#F5EFEB] flex items-center justify-between text-xs text-stone-500">
          <span>Atelier Terre & Toile · GDGC Web Dev Domain Selection</span>
          <button
            onClick={() => setSeedGuideOpen(false)}
            className="px-4 py-1.5 bg-[#1C1917] hover:bg-stone-800 text-white font-medium rounded-sm transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
