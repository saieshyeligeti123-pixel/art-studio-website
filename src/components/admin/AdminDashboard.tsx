import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Painting, WallBooking, PotteryRequest, formatCurrency } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Shield,
  Palette,
  Brush,
  Layers,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Database,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    switchUserRole,
    setCurrentPage,
    paintings,
    addPainting,
    editPainting,
    wallBookings,
    updateWallBookingStatus,
    potteryRequests,
    updatePotteryRequestStatus,
    paintingOrders,
    setSeedGuideOpen,
    addToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'paintings' | 'murals' | 'pottery' | 'orders'>('paintings');

  // Add Painting Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newArtist, setNewArtist] = useState<string>('Helena Vance');
  const [newYear, setNewYear] = useState<number>(2026);
  const [newMedium, setNewMedium] = useState<string>('Oil and cold wax on linen');
  const [newDimensions, setNewDimensions] = useState<string>('36 x 48 inches');
  const [newPrice, setNewPrice] = useState<number>(2200);
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<Painting['category']>('Oil on Canvas');
  const [newImageUrl, setNewImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80'
  );

  // Edit Painting Modal State
  const [editingPainting, setEditingPainting] = useState<Painting | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editMedium, setEditMedium] = useState<string>('');
  const [editDimensions, setEditDimensions] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDescription, setEditDescription] = useState<string>('');

  // Status Action Modal State for Bookings/Requests
  const [actionItem, setActionItem] = useState<{
    type: 'mural' | 'pottery';
    id: string;
    targetStatus: 'confirmed' | 'accepted' | 'declined';
    title: string;
  } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');

  // Strict RBAC Check (HTTP 403 enforcement)
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-rose-700">
            Security Enforcement · HTTP 403 Forbidden
          </span>
          <h2 className="font-serif text-3xl text-stone-900">
            Curator Access Restricted
          </h2>
          <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            You are currently signed in as a <strong className="text-stone-900">Customer</strong>. Per assignment security requirements, authenticated users with the wrong role receive HTTP 403.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => switchUserRole('admin')}
            className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-medium uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-amber-300" />
            <span>Switch to Studio Curator (studio@artstudio.in)</span>
          </button>
          <button
            onClick={() => setCurrentPage('customer-dashboard')}
            className="px-5 py-2.5 bg-white border border-[#D8CCC4] text-stone-700 text-xs font-medium rounded-sm hover:bg-stone-50"
          >
            Back to Customer Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle Add Painting
  const handleAddPainting = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addPainting({
      title: newTitle,
      artist: newArtist,
      year: newYear,
      medium: newMedium,
      dimensions: newDimensions,
      price: newPrice,
      description: newDescription,
      imageUrl: newImageUrl,
      category: newCategory,
    });
    if (res.success) {
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewDescription('');
    }
  };

  // Open Edit Painting Modal
  const openEditPaintingModal = (painting: Painting) => {
    if (painting.status === 'sold') {
      addToast('error', 'Constraint Violation', 'Sold paintings cannot be edited per studio rules.');
      return;
    }
    setEditingPainting(painting);
    setEditTitle(painting.title);
    setEditMedium(painting.medium || '');
    setEditDimensions(painting.dimensions || '');
    setEditPrice(painting.price);
    setEditDescription(painting.description);
  };

  const handleSaveEditPainting = async () => {
    if (!editingPainting) return;
    const res = await editPainting(editingPainting.id, {
      title: editTitle,
      medium: editMedium,
      dimensions: editDimensions,
      price: editPrice,
      description: editDescription,
    });
    if (res.success) {
      setEditingPainting(null);
    }
  };

  // Confirm or decline actions
  const handleExecuteStatusAction = async () => {
    if (!actionItem) return;
    if (actionItem.type === 'mural') {
      await updateWallBookingStatus(
        actionItem.id,
        actionItem.targetStatus as 'confirmed' | 'declined',
        adminNoteInput
      );
    } else {
      await updatePotteryRequestStatus(
        actionItem.id,
        actionItem.targetStatus as 'accepted' | 'declined',
        adminNoteInput
      );
    }
    setActionItem(null);
    setAdminNoteInput('');
  };

  // Summary Metrics
  const availablePaintingsCount = paintings.filter((p) => p.status === 'available').length;
  const soldPaintingsCount = paintings.filter((p) => p.status === 'sold').length;
  const activeMuralsCount = wallBookings.filter((b) => b.status === 'requested' || b.status === 'confirmed').length;
  const pendingPotteryCount = potteryRequests.filter((r) => r.status === 'requested').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-sans">
      {/* Header */}
      <div className="border-b border-[#E8DCC4] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Studio Curator Administration Suite</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-500 font-mono text-[11px]">{currentUser.name}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight mt-1">
            Studio Operations Management
          </h1>
          <p className="text-xs text-stone-600 mt-1 font-sans">
            Catalog paintings, evaluate architectural mural schedules, and manage kiln ceramic commissions.
          </p>
        </div>

        <button
          onClick={() => setSeedGuideOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#F5EFEB] hover:bg-[#EAE0D3] border border-[#E0D3C1] text-xs font-medium text-stone-800 rounded-sm transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-[#9E6B38]" />
          <span>SQLite Schema & Seed Inspector</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0D3C1] p-4 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Paintings Catalog
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-stone-900">{paintings.length}</span>
            <span className="text-xs text-emerald-700 font-medium">{availablePaintingsCount} available</span>
          </div>
        </div>

        <div className="bg-white border border-[#E0D3C1] p-4 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Paintings Acquired
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-stone-900">{soldPaintingsCount}</span>
            <span className="text-xs text-stone-500 font-mono">{paintingOrders.length} total orders</span>
          </div>
        </div>

        <div className="bg-white border border-[#E0D3C1] p-4 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Active Mural Bookings
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-stone-900">{activeMuralsCount}</span>
            <span className="text-xs text-[#9E6B38] font-medium">1 booking/day lock</span>
          </div>
        </div>

        <div className="bg-white border border-[#E0D3C1] p-4 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Pottery Queue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-stone-900">{potteryRequests.length}</span>
            <span className="text-xs text-amber-700 font-medium">{pendingPotteryCount} pending review</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Zero-pill discipline) */}
      <div className="flex border-b border-[#E8DCC4] gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('paintings')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'paintings'
              ? 'border-[#9E6B38] text-stone-900 font-semibold bg-white/40'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Palette className="w-4 h-4 text-[#9E6B38]" />
          <span>Manage Paintings ({paintings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('murals')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'murals'
              ? 'border-[#9E6B38] text-stone-900 font-semibold bg-white/40'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Brush className="w-4 h-4 text-[#9E6B38]" />
          <span>Mural Bookings ({wallBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pottery')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'pottery'
              ? 'border-[#9E6B38] text-stone-900 font-semibold bg-white/40'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4 text-[#9E6B38]" />
          <span>Pottery Commissions ({potteryRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-[#9E6B38] text-stone-900 font-semibold bg-white/40'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4 text-[#9E6B38]" />
          <span>Painting Orders Audit ({paintingOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: PAINTINGS MANAGEMENT */}
      {activeTab === 'paintings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F5EFEB] p-4 border border-[#E0D3C1] rounded-sm">
            <div className="text-xs text-stone-700">
              <span className="font-semibold block">Assignment Rule Enforcement:</span>
              <span>Admins can add or edit paintings only while they are available. Sold paintings are locked.</span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-medium uppercase tracking-wider rounded-sm flex items-center gap-2 shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Catalog New Painting</span>
            </button>
          </div>

          <div className="bg-white border border-[#E0D3C1] rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#F5EFEB] border-b border-[#E8DCC4] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Artwork</th>
                    <th className="py-3 px-4">Medium & Dimensions</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paintings.map((painting) => {
                    const isSold = painting.status === 'sold';

                    return (
                      <tr key={painting.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={painting.imageUrl}
                              alt={painting.title}
                              className="w-12 h-12 object-cover rounded-xs border border-stone-200 shrink-0"
                            />
                            <div>
                              <span className="font-serif font-semibold text-stone-900 block text-sm">
                                {painting.title}
                              </span>
                              <span className="text-[11px] text-stone-500">
                                {painting.artist} · {painting.year}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-stone-700">
                          <div>{painting.medium}</div>
                          <div className="text-[11px] text-stone-500 font-mono">{painting.dimensions}</div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-stone-900 text-sm">
                          {formatCurrency(painting.price)}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={painting.status} size="sm" />
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isSold ? (
                            <span
                              className="text-[11px] text-stone-400 italic flex items-center justify-end gap-1"
                              title="Sold paintings cannot be edited per studio rule"
                            >
                              <Lock className="w-3 h-3 text-stone-400" />
                              <span>Locked (Sold)</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => openEditPaintingModal(painting)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5EFEB] hover:bg-[#E8DCC4] text-stone-800 text-xs font-medium rounded-sm border border-[#D8CCC4] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#9E6B38]" />
                              <span>Edit Details</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WALL MURAL BOOKINGS MANAGEMENT */}
      {activeTab === 'murals' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#F5EFEB] border border-[#E0D3C1] rounded-sm text-xs text-stone-700">
            <span className="font-semibold block">Assignment Rule:</span>
            <span>Studio can confirm or decline bookings. Only one active booking is allowed per date.</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {wallBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-[#E0D3C1] p-5 rounded-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-stone-400">#{booking.id.slice(-6)}</span>
                    <StatusBadge status={booking.status} size="sm" />
                    <span className="font-mono text-xs text-stone-500">
                      Date: <strong className="text-stone-900">{booking.scheduledDate}</strong>
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-semibold text-stone-900">
                    {booking.stylePreference} — {booking.customerName}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span>{booking.wallSizeSqFt} sq ft @ ₹{booking.ratePerSqFt}/sq ft</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-bold text-stone-900">{formatCurrency(booking.totalPrice)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{booking.address}, {booking.city}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{booking.customerEmail}</span>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-stone-500 italic bg-stone-50 p-2 rounded-xs">
                      Customer Note: "{booking.notes}"
                    </p>
                  )}

                  {booking.adminResponseNote && (
                    <p className="text-xs text-emerald-900 bg-emerald-50/70 p-2 rounded-xs border border-emerald-100">
                      Studio Note: {booking.adminResponseNote}
                    </p>
                  )}
                </div>

                {/* Confirm / Decline Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {booking.status === 'requested' ? (
                    <>
                      <button
                        onClick={() =>
                          setActionItem({
                            type: 'mural',
                            id: booking.id,
                            targetStatus: 'confirmed',
                            title: `Confirm Mural on ${booking.scheduledDate}`,
                          })
                        }
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm</span>
                      </button>

                      <button
                        onClick={() =>
                          setActionItem({
                            type: 'mural',
                            id: booking.id,
                            targetStatus: 'declined',
                            title: `Decline Mural on ${booking.scheduledDate}`,
                          })
                        }
                        className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-stone-400 font-mono">
                      State: {booking.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: POTTERY COMMISSIONS MANAGEMENT */}
      {activeTab === 'pottery' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#F5EFEB] border border-[#E0D3C1] rounded-sm text-xs text-stone-700">
            <span className="font-semibold block">Assignment Rule:</span>
            <span>Studio can accept or decline pottery requests. Once accepted, the customer cannot cancel or edit.</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {potteryRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-[#E0D3C1] p-5 rounded-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-stone-400">#{req.id.slice(-6)}</span>
                    <StatusBadge status={req.status} size="sm" />
                    <span className="font-mono text-xs text-stone-500">
                      Required by: <strong className="text-stone-900">{req.requiredDate}</strong>
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-semibold text-stone-900">
                    {req.quantity}x {req.itemName} ({req.glazeName} glaze)
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span>Client: {req.customerName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-bold text-stone-900">{formatCurrency(req.estimatedPrice)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{req.customerEmail}</span>
                  </div>

                  {req.specialNotes && (
                    <p className="text-xs text-stone-500 italic bg-stone-50 p-2 rounded-xs">
                      Client Note: "{req.specialNotes}"
                    </p>
                  )}

                  {req.adminResponseNote && (
                    <p className="text-xs text-emerald-900 bg-emerald-50/70 p-2 rounded-xs border border-emerald-100">
                      Kiln Response: {req.adminResponseNote}
                    </p>
                  )}
                </div>

                {/* Accept / Decline Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'requested' ? (
                    <>
                      <button
                        onClick={() =>
                          setActionItem({
                            type: 'pottery',
                            id: req.id,
                            targetStatus: 'accepted',
                            title: `Accept Pottery Commission for ${req.itemName}`,
                          })
                        }
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept Request</span>
                      </button>

                      <button
                        onClick={() =>
                          setActionItem({
                            type: 'pottery',
                            id: req.id,
                            targetStatus: 'declined',
                            title: `Decline Commission for ${req.itemName}`,
                          })
                        }
                        className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-stone-400 font-mono">
                      State: {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PAINTING ORDERS AUDIT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#F5EFEB] border border-[#E0D3C1] rounded-sm text-xs text-stone-700">
            <span className="font-semibold block">Painting Orders Audit Trail:</span>
            <span>Reflects single-acquisition model. Placed orders hold the artwork; cancellations release it.</span>
          </div>

          <div className="bg-white border border-[#E0D3C1] rounded-sm overflow-hidden">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#F5EFEB] border-b border-[#E8DCC4] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Artwork Title</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paintingOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-stone-900 block font-medium">#{ord.id}</span>
                      <span className="text-[11px] text-stone-500">
                        {new Date(ord.orderDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-serif text-sm font-semibold text-stone-900">
                      {ord.paintingTitle}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      <div>{ord.customerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{ord.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {formatCurrency(ord.paintingPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ord.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD PAINTING MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
              <h3 className="font-serif text-2xl text-stone-900">
                Catalog New Original Painting
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPainting} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Painting Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Fissures of the High Desert"
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Artist Name</label>
                  <input
                    type="text"
                    required
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                  >
                    <option value="Oil on Canvas">Oil on Canvas</option>
                    <option value="Textured Acrylic">Textured Acrylic</option>
                    <option value="Mixed Media">Mixed Media</option>
                    <option value="Watercolor">Watercolor</option>
                    <option value="Minimalist Ink">Minimalist Ink</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={newDimensions}
                    onChange={(e) => setNewDimensions(e.target.value)}
                    placeholder="36 x 48 inches"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Medium & Support</label>
                <input
                  type="text"
                  value={newMedium}
                  onChange={(e) => setNewMedium(e.target.value)}
                  placeholder="Oil, cold wax, and pigment on Belgian linen"
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Curatorial Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the conceptual background, technique, and textural surface..."
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-[#E8DCC4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#D8CCC4] text-stone-700 rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-sm font-medium"
                >
                  Publish to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAINTING MODAL (Allowed only while painting is available) */}
      {editingPainting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
              <div>
                <h3 className="font-serif text-2xl text-stone-900">
                  Edit Artwork: {editingPainting.title}
                </h3>
                <span className="text-[11px] text-emerald-800">
                  Status is "available" — Modifications permitted
                </span>
              </div>
              <button onClick={() => setEditingPainting(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Medium</label>
                <input
                  type="text"
                  value={editMedium}
                  onChange={(e) => setEditMedium(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Curatorial Statement</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8DCC4] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingPainting(null)}
                className="px-4 py-2 border border-[#D8CCC4] text-stone-700 rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditPainting}
                className="px-5 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM / DECLINE STUDIO NOTE MODAL */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-2">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {actionItem.title}
              </h3>
              <button onClick={() => setActionItem(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <p className="text-stone-600">
                Provide an optional message for the customer regarding this schedule decision:
              </p>
              <textarea
                rows={3}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="e.g. Confirmed site inspection. Primer coat will start at 9am."
                className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setActionItem(null)}
                className="px-3 py-1.5 border border-[#D8CCC4] text-stone-700 rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteStatusAction}
                className="px-4 py-1.5 bg-[#1C1917] text-white rounded-sm font-medium"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
