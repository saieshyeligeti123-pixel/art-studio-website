import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../lib/store';
import { getFutureDateString } from '../../lib/previewData';
import { formatCurrency } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Brush,
  Calendar,
  Maximize2,
  DollarSign,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
} from 'lucide-react';

export const MuralBookingPage: React.FC = () => {
  const {
    wallMuralRate,
    wallBookings,
    createWallBooking,
    currentUser,
    setCurrentPage,
    isLoading,
  } = useAppStore();

  // Constraints: 7 - 90 days from today
  const minDate = getFutureDateString(7);
  const maxDate = getFutureDateString(90);

  // Form State
  const [scheduledDate, setScheduledDate] = useState<string>(getFutureDateString(14));
  const [wallSizeSqFt, setWallSizeSqFt] = useState<number>(120);
  const [address, setAddress] = useState<string>('Plot 42, Jubilee Hills');
  const [city, setCity] = useState<string>('Hyderabad');
  const [stateZip, setStateZip] = useState<string>('Telangana 500033');
  const [stylePreference, setStylePreference] = useState<string>('Cheriyal & Kalamkari Traditional Mural');
  const [notes, setNotes] = useState<string>('Double-height ceiling wall with natural western sunset exposure.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Computed total price
  const computedTotal = wallSizeSqFt * wallMuralRate;

  // Active bookings check for conflicts
  const activeBookedDates = useMemo(() => {
    return wallBookings
      .filter((b) => b.status === 'requested' || b.status === 'confirmed')
      .map((b) => b.scheduledDate);
  }, [wallBookings]);

  const isSelectedDateConflicted = activeBookedDates.includes(scheduledDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelectedDateConflicted) return;

    setIsSubmitting(true);
    const res = await createWallBooking({
      scheduledDate,
      wallSizeSqFt,
      address,
      city,
      stateZip,
      stylePreference,
      notes,
    });
    setIsSubmitting(false);

    if (res.success) {
      setCurrentPage('customer-dashboard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Header & Service Presentation */}
      <div className="border-b border-[#E8DCC4] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
              <span>Architectural Services</span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-500 font-mono text-[11px]">[Rate: ₹{wallMuralRate}/sq ft Seed]</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 tracking-tight">
              Site-Specific Wall Murals
            </h1>
            <p className="text-sm text-stone-600 max-w-2xl font-sans leading-relaxed">
              Transform residential and commercial architectural walls with bespoke murals. To maintain absolute craft integrity, our atelier permits only one active mural booking per date.
            </p>
          </div>

          <div className="p-3 bg-[#F5EFEB] border border-[#E0D3C1] rounded-sm text-xs font-sans space-y-1">
            <span className="font-semibold text-stone-800 block">Assignment Booking Constraints:</span>
            <div className="text-stone-600">
              <span>Date: 7–90 days ahead</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Size: 10–500 sq ft</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Rate: ₹{wallMuralRate}/sq ft</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Showcase of Mural Styles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E0D3C1] p-4 rounded-sm space-y-3">
          <div className="aspect-4/3 overflow-hidden bg-stone-100 rounded-xs">
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
              alt="Mineral lime wash mural"
              className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
            />
          </div>
          <h3 className="font-serif text-lg text-stone-900">Mineral Lime Wash & Raw Pigment</h3>
          <p className="text-xs text-stone-600 leading-relaxed font-sans">
            Textured gradients echoing limestone cliffs and weathered coastal stone. Breathable natural lime finishes.
          </p>
        </div>

        <div className="bg-white border border-[#E0D3C1] p-4 rounded-sm space-y-3">
          <div className="aspect-4/3 overflow-hidden bg-stone-100 rounded-xs">
            <img
              src="https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=800&q=80"
              alt="Earthy botanical mural"
              className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
            />
          </div>
          <h3 className="font-serif text-lg text-stone-900">Botanical Silhouette & Earth Ochre</h3>
          <p className="text-xs text-stone-600 leading-relaxed font-sans">
            Minimalist wild grasses and olive branches painted directly with raw umber and warm ochre washes.
          </p>
        </div>

        <div className="bg-white border border-[#E0D3C1] p-4 rounded-sm space-y-3">
          <div className="aspect-4/3 overflow-hidden bg-stone-100 rounded-xs">
            <img
              src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
              alt="Abstract textural mural"
              className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
            />
          </div>
          <h3 className="font-serif text-lg text-stone-900">Geometric Horizon & Soft Contours</h3>
          <p className="text-xs text-stone-600 leading-relaxed font-sans">
            Architectural color blocking designed to subtly expand room dimensions and play with changing daylight.
          </p>
        </div>
      </div>

      {/* 3. Interactive Booking Form & Live Cost Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Form Container */}
        <div className="lg:col-span-8 bg-white border border-[#E0D3C1] p-6 sm:p-8 rounded-sm shadow-sm space-y-6">
          <div className="border-b border-[#E8DCC4] pb-4">
            <h2 className="font-serif text-2xl text-stone-900">
              Schedule Studio Mural Booking
            </h2>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Submit your project details. The studio will confirm or decline based on surface suitability.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 font-sans">
            {/* Scheduled Date Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#9E6B38]" />
                  <span>Desired Execution Date (7–90 Days Window)</span>
                </label>
                <span className="text-[11px] text-stone-500 font-mono">
                  Allowed: {minDate} to {maxDate}
                </span>
              </div>

              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 bg-[#FAF7F2] border rounded-sm text-xs text-stone-900 focus:outline-hidden ${
                  isSelectedDateConflicted
                    ? 'border-rose-400 focus:border-rose-600 bg-rose-50/30'
                    : 'border-[#D8CCC4] focus:border-[#9E6B38]'
                }`}
              />

              {/* Conflict Notification Banner */}
              {isSelectedDateConflicted ? (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Date Unavailable (Conflict Detected)</span>
                    <span>
                      The studio already has an active mural booking on <strong className="font-mono">{scheduledDate}</strong>.
                      Per studio rules, only one active booking is allowed per date. Please select another date.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Date is available for booking.</span>
                </div>
              )}
            </div>

            {/* Wall Size Slider & Input */}
            <div className="space-y-3 pt-2 border-t border-[#E8DCC4]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-[#9E6B38]" />
                  <span>Wall Dimensions (10 – 500 Square Feet)</span>
                </label>
                <span className="font-mono text-sm font-semibold text-stone-900">
                  {wallSizeSqFt} sq ft
                </span>
              </div>

              <input
                type="range"
                min={10}
                max={500}
                step={5}
                value={wallSizeSqFt}
                onChange={(e) => setWallSizeSqFt(Number(e.target.value))}
                className="w-full accent-[#9E6B38] cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>Min: 10 sq ft (Accent niche)</span>
                <span>Max: 500 sq ft (Full commercial wall)</span>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-2 border-t border-[#E8DCC4]">
              <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9E6B38]" />
                <span>Site Address & Location</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-stone-500 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="e.g. 450 Post Street, Apt 8A"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="e.g. San Francisco"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">State & ZIP Code</label>
                  <input
                    type="text"
                    value={stateZip}
                    onChange={(e) => setStateZip(e.target.value)}
                    required
                    placeholder="e.g. CA 94102"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                  />
                </div>
              </div>
            </div>

            {/* Style Preference & Notes */}
            <div className="space-y-4 pt-2 border-t border-[#E8DCC4]">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Mural Aesthetic Direction
                </label>
                <select
                  value={stylePreference}
                  onChange={(e) => setStylePreference(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                >
                  <option value="Earthen Botanical & Mineral Wash">Earthen Botanical & Mineral Wash</option>
                  <option value="Monochrome Architectural Horizon">Monochrome Architectural Horizon</option>
                  <option value="Textured Alabaster & Raw Umber">Textured Alabaster & Raw Umber</option>
                  <option value="Deep Indigo & Mist Flow">Deep Indigo & Mist Flow</option>
                  <option value="Custom Consultation Collaboration">Custom Consultation Collaboration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Wall Notes (Surface texture, ceiling height, lighting)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Tell us about the existing drywall, lighting, and access..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#E8DCC4] flex items-center justify-between">
              <div className="text-xs text-stone-500">
                <span>Free cancellation up to </span>
                <strong className="text-stone-800">3 days</strong> before scheduled date
              </div>

              <button
                type="submit"
                disabled={isSelectedDateConflicted || isSubmitting}
                className={`px-6 py-3 text-xs font-medium uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 ${
                  isSelectedDateConflicted || isSubmitting
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-[#1C1917] hover:bg-stone-800 text-white shadow-sm'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Reserving Date...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Mural Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Real-Time Price Estimation Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#F5EFEB] border border-[#E0D3C1] p-6 rounded-sm space-y-6">
            <h3 className="font-serif text-xl text-stone-900">
              Mural Pricing Breakdown
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#E8DCC4]">
                <span className="text-stone-600">Wall Surface Area:</span>
                <span className="font-mono font-semibold text-stone-900">{wallSizeSqFt} sq ft</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#E8DCC4]">
                <span className="text-stone-600">Studio Rate (from Seed):</span>
                <span className="font-mono font-semibold text-stone-900">₹{wallMuralRate} / sq ft</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#E8DCC4]">
                <span className="text-stone-600">Primer & Mineral Seal:</span>
                <span className="text-emerald-700 font-medium">Included</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#E8DCC4]">
                <span className="text-stone-600">Scaffold & Site Prep:</span>
                <span className="text-emerald-700 font-medium">Included</span>
              </div>

              <div className="flex items-baseline justify-between pt-3">
                <span className="text-sm font-semibold text-stone-900">Total Calculated:</span>
                <span className="font-mono text-2xl font-bold text-stone-900">
                  {formatCurrency(computedTotal)}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-[#E8DCC4] rounded-sm text-xs text-stone-600 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                <Clock className="w-3.5 h-3.5 text-[#9E6B38]" />
                <span>Mural Cancellation Policy</span>
              </div>
              <p className="leading-relaxed">
                Customers can cancel free of penalty until three (3) days before the scheduled execution date. Within 3 days, cancellation is locked to cover prep costs.
              </p>
            </div>
          </div>

          {/* Currently Booked Calendar Dates Quick-View */}
          <div className="bg-white border border-[#E0D3C1] p-5 rounded-sm space-y-3 text-xs font-sans">
            <span className="font-semibold text-stone-800 block">
              Studio Active Bookings Monitor
            </span>
            <p className="text-stone-500 leading-relaxed">
              These dates currently have active bookings in the preview database and cannot be selected:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {activeBookedDates.length === 0 ? (
                <span className="text-stone-400 italic">No dates currently booked</span>
              ) : (
                activeBookedDates.map((date) => (
                  <span
                    key={date}
                    className="font-mono px-2 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded-xs text-[11px]"
                  >
                    {date} (Reserved)
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
