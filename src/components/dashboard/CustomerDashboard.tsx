import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { StatusBadge } from '../common/StatusBadge';
import { PotteryRequest, formatCurrency } from '../../types';
import { getFutureDateString } from '../../lib/previewData';
import {
  Palette,
  Brush,
  Layers,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  XCircle,
  Edit3,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    setCurrentPage,
    paintingOrders,
    cancelPaintingOrder,
    wallBookings,
    cancelWallBooking,
    potteryRequests,
    potteryItems,
    potteryGlazes,
    editPotteryRequest,
    cancelPotteryRequest,
    isLoading,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'paintings' | 'murals' | 'pottery'>('paintings');

  // Edit Pottery Modal State
  const [editingPotteryReq, setEditingPotteryReq] = useState<PotteryRequest | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editGlazeId, setEditGlazeId] = useState<string>('');
  const [editRequiredDate, setEditRequiredDate] = useState<string>('');
  const [editSpecialNotes, setEditSpecialNotes] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans space-y-4">
        <ShieldAlert className="w-10 h-10 text-stone-400 mx-auto" />
        <h2 className="font-serif text-2xl text-stone-900">Sign In Required (HTTP 401)</h2>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          Please authenticate with your customer credentials to review your acquisitions and studio appointments.
        </p>
        <button
          onClick={() => setCurrentPage('login')}
          className="px-6 py-2.5 bg-stone-900 text-white text-xs font-medium uppercase tracking-wider rounded-sm"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  // Filter records belonging to current customer (RLS emulation)
  const myPaintingOrders = paintingOrders.filter((o) => o.customerId === currentUser.id);
  const myWallBookings = wallBookings.filter((b) => b.customerId === currentUser.id);
  const myPotteryRequests = potteryRequests.filter((r) => r.customerId === currentUser.id);

  // Helper to check 3-day mural cancellation rule
  const isMuralCancellable = (scheduledDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduled = new Date(scheduledDateStr + 'T00:00:00');
    const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  };

  const openPotteryEditModal = (req: PotteryRequest) => {
    setEditingPotteryReq(req);
    setEditQuantity(req.quantity);
    setEditGlazeId(req.glazeId);
    setEditRequiredDate(req.requiredDate);
    setEditSpecialNotes(req.specialNotes || '');
  };

  const handleSavePotteryEdit = async () => {
    if (!editingPotteryReq) return;
    setIsSavingEdit(true);
    const res = await editPotteryRequest(editingPotteryReq.id, {
      itemId: editingPotteryReq.itemId,
      glazeId: editGlazeId,
      quantity: editQuantity,
      requiredDate: editRequiredDate,
      specialNotes: editSpecialNotes,
    });
    setIsSavingEdit(false);
    if (res.success) {
      setEditingPotteryReq(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      {/* Dashboard Header */}
      <div className="border-b border-[#E8DCC4] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
            <span>Customer Dashboard</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-500 font-mono text-[11px]">{currentUser.email}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight mt-1">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-stone-600 mt-1 font-sans">
            Review your original painting acquisitions, site mural bookings, and custom ceramic commissions.
          </p>
        </div>

        {/* Quick summary counters */}
        <div className="flex items-center gap-4 bg-[#F5EFEB] border border-[#E0D3C1] p-3 rounded-sm text-xs">
          <div>
            <span className="text-stone-500 block text-[10px] uppercase">Orders</span>
            <span className="font-mono font-bold text-stone-900">{myPaintingOrders.length}</span>
          </div>
          <div className="h-6 w-px bg-stone-300" />
          <div>
            <span className="text-stone-500 block text-[10px] uppercase">Murals</span>
            <span className="font-mono font-bold text-stone-900">{myWallBookings.length}</span>
          </div>
          <div className="h-6 w-px bg-stone-300" />
          <div>
            <span className="text-stone-500 block text-[10px] uppercase">Ceramics</span>
            <span className="font-mono font-bold text-stone-900">{myPotteryRequests.length}</span>
          </div>
        </div>
      </div>

      {/* Three Service Tabs (Segmented controls with zero-pill discipline) */}
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
          <span>My Paintings ({myPaintingOrders.length})</span>
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
          <span>Wall Mural Bookings ({myWallBookings.length})</span>
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
          <span>Custom Pottery Requests ({myPotteryRequests.length})</span>
        </button>
      </div>

      {/* TAB 1: PAINTING ORDERS */}
      {activeTab === 'paintings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>
              Rule: Customers can cancel orders, which automatically returns the painting to public availability.
            </span>
          </div>

          {myPaintingOrders.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E0D3C1] rounded-sm space-y-3">
              <Palette className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg text-stone-800">No Painting Orders Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore our curated gallery collection of original canvas works available for acquisition.
              </p>
              <button
                onClick={() => setCurrentPage('paintings')}
                className="mt-2 px-4 py-2 bg-[#1C1917] text-white text-xs font-medium rounded-sm"
              >
                Explore Paintings Gallery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myPaintingOrders.map((order) => {
                const isCancelled = order.status === 'cancelled';

                return (
                  <div
                    key={order.id}
                    className={`bg-white border rounded-sm p-5 space-y-4 transition-all ${
                      isCancelled ? 'border-stone-200 opacity-75' : 'border-[#E0D3C1] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={order.paintingImageUrl}
                        alt={order.paintingTitle}
                        className="w-24 h-24 object-cover rounded-xs border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-stone-400">
                            Order #{order.id.slice(-6)}
                          </span>
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                        <h4 className="font-serif text-lg text-stone-900 font-semibold truncate mt-0.5">
                          {order.paintingTitle}
                        </h4>
                        <span className="font-mono text-sm font-bold text-stone-900 block mt-1">
                          {formatCurrency(order.paintingPrice)}
                        </span>
                        <span className="text-[11px] text-stone-500 block mt-0.5">
                          Ordered on {new Date(order.orderDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF7F2] border border-[#E8DCC4] rounded-sm text-xs space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                        Shipping Address
                      </span>
                      <p className="text-stone-700 font-sans">{order.shippingAddress}</p>
                    </div>

                    {!isCancelled ? (
                      <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                        <span className="text-[11px] text-stone-500">
                          Status: Active acquisition
                        </span>
                        <button
                          onClick={() => cancelPaintingOrder(order.id)}
                          className="px-3.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-sm transition-colors"
                        >
                          Cancel Order (Make Painting Available)
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-stone-100 text-xs text-stone-500 italic">
                        Order cancelled. Painting released back to the gallery.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WALL MURALS */}
      {activeTab === 'murals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>
              Rule: Customers can cancel mural bookings until 3 days before the scheduled execution date.
            </span>
          </div>

          {myWallBookings.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E0D3C1] rounded-sm space-y-3">
              <Brush className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg text-stone-800">No Mural Bookings Scheduled</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Schedule an architectural site mural calculated at our studio seed rate ($45/sq ft).
              </p>
              <button
                onClick={() => setCurrentPage('murals')}
                className="mt-2 px-4 py-2 bg-[#1C1917] text-white text-xs font-medium rounded-sm"
              >
                Book Wall Mural
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myWallBookings.map((booking) => {
                const canCancel = isMuralCancellable(booking.scheduledDate) && booking.status !== 'cancelled' && booking.status !== 'declined';
                const isPastCancellationWindow = !isMuralCancellable(booking.scheduledDate) && booking.status !== 'cancelled';

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-[#E0D3C1] rounded-sm p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[11px] text-stone-400">
                          Booking #{booking.id.slice(-6)}
                        </span>
                        <h4 className="font-serif text-xl text-stone-900 font-semibold mt-0.5">
                          {booking.stylePreference}
                        </h4>
                      </div>
                      <StatusBadge status={booking.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF7F2] border border-[#E8DCC4] rounded-sm text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Execution Date</span>
                        <span className="font-semibold text-stone-900">{booking.scheduledDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Wall Dimensions</span>
                        <span className="font-semibold text-stone-900">{booking.wallSizeSqFt} sq ft</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Studio Rate</span>
                        <span className="font-mono text-stone-700">₹{booking.ratePerSqFt}/sq ft</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Total Price</span>
                        <span className="font-mono font-bold text-stone-900">{formatCurrency(booking.totalPrice)}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-start gap-1.5 text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-[#9E6B38] shrink-0 mt-0.5" />
                        <span>{booking.address}, {booking.city}, {booking.stateZip}</span>
                      </div>
                      {booking.notes && (
                        <p className="text-stone-500 text-[11px] italic pl-5">
                          "{booking.notes}"
                        </p>
                      )}
                    </div>

                    {booking.adminResponseNote && (
                      <div className="p-2.5 bg-stone-100 rounded-sm text-xs text-stone-700 border-l-2 border-[#9E6B38]">
                        <span className="font-semibold block text-[10px] uppercase text-stone-500">
                          Studio Manager Note:
                        </span>
                        <span>{booking.adminResponseNote}</span>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      {booking.status === 'cancelled' ? (
                        <span className="text-stone-400 italic">Booking cancelled</span>
                      ) : booking.status === 'declined' ? (
                        <span className="text-stone-500 italic">Declined by studio</span>
                      ) : canCancel ? (
                        <>
                          <span className="text-[11px] text-stone-500">Eligible for cancellation</span>
                          <button
                            onClick={() => cancelWallBooking(booking.id)}
                            className="px-3.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium rounded-sm transition-colors"
                          >
                            Cancel Mural Booking
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Cancellation locked (&lt; 3 days before date)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOM POTTERY */}
      {activeTab === 'pottery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>
              Rule: Customers can edit or cancel pottery requests only while their status is "requested".
            </span>
          </div>

          {myPotteryRequests.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E0D3C1] rounded-sm space-y-3">
              <Layers className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg text-stone-800">No Pottery Requests</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Select your preferred vessel silhouette and custom glaze from our studio wheel catalog.
              </p>
              <button
                onClick={() => setCurrentPage('pottery')}
                className="mt-2 px-4 py-2 bg-[#1C1917] text-white text-xs font-medium rounded-sm"
              >
                Commission Pottery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myPotteryRequests.map((req) => {
                const isRequested = req.status === 'requested';

                return (
                  <div
                    key={req.id}
                    className="bg-white border border-[#E0D3C1] rounded-sm p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[11px] text-stone-400">
                          Commission #{req.id.slice(-6)}
                        </span>
                        <h4 className="font-serif text-xl text-stone-900 font-semibold mt-0.5">
                          {req.itemName}
                        </h4>
                      </div>
                      <StatusBadge status={req.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF7F2] border border-[#E8DCC4] rounded-sm text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Glaze Formula</span>
                        <span className="font-semibold text-stone-900">{req.glazeName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Batch Quantity</span>
                        <span className="font-semibold text-stone-900">{req.quantity} pieces</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Required Date</span>
                        <span className="font-mono font-medium text-stone-900">{req.requiredDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase block">Estimated Price</span>
                        <span className="font-mono font-bold text-stone-900">{formatCurrency(req.estimatedPrice)}</span>
                      </div>
                    </div>

                    {req.specialNotes && (
                      <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-sm border border-stone-200">
                        <strong className="text-stone-800">Customer Note:</strong> {req.specialNotes}
                      </p>
                    )}

                    {req.adminResponseNote && (
                      <div className="p-2.5 bg-stone-100 rounded-sm text-xs text-stone-700 border-l-2 border-[#9E6B38]">
                        <span className="font-semibold block text-[10px] uppercase text-stone-500">
                          Kiln Master Response:
                        </span>
                        <span>{req.adminResponseNote}</span>
                      </div>
                    )}

                    {/* Action Bar (Only enabled if status is 'requested') */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                      {isRequested ? (
                        <>
                          <button
                            onClick={() => openPotteryEditModal(req)}
                            className="inline-flex items-center gap-1.5 text-stone-800 hover:text-[#9E6B38] font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Request</span>
                          </button>

                          <button
                            onClick={() => cancelPotteryRequest(req.id)}
                            className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium rounded-sm transition-colors"
                          >
                            Cancel Request
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">
                          Locked from editing / cancellation (Status: {req.status})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT POTTERY MODAL */}
      {editingPotteryReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
              <div>
                <h3 className="font-serif text-xl text-stone-900">
                  Edit Commission: {editingPotteryReq.itemName}
                </h3>
                <span className="text-[11px] text-stone-500">
                  Allowed because status is "requested".
                </span>
              </div>
              <button
                onClick={() => setEditingPotteryReq(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Glaze Selection
                </label>
                <select
                  value={editGlazeId}
                  onChange={(e) => setEditGlazeId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                >
                  {potteryGlazes.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.finish} finish)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Quantity (1–12)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Required Date (&ge; 14 Days)
                  </label>
                  <input
                    type="date"
                    min={getFutureDateString(14)}
                    value={editRequiredDate}
                    onChange={(e) => setEditRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Special Notes
                </label>
                <textarea
                  value={editSpecialNotes}
                  onChange={(e) => setEditSpecialNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DCC4]">
              <button
                onClick={() => setEditingPotteryReq(null)}
                className="px-4 py-2 border border-[#D8CCC4] text-xs font-medium text-stone-700 rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePotteryEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-medium rounded-sm flex items-center gap-1.5"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
