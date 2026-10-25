import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { getFutureDateString } from '../../lib/previewData';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../types';
import {
  Layers,
  Sparkles,
  Calendar,
  Check,
  Info,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';

export const PotteryPage: React.FC = () => {
  const {
    potteryItems,
    potteryGlazes,
    createPotteryRequest,
    currentUser,
    setCurrentPage,
    isLoading,
  } = useAppStore();

  // Constraints: requiredDate must be at least 14 days away
  const minRequiredDate = getFutureDateString(14);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<string>(potteryItems[0]?.id || '');
  const [selectedGlazeId, setSelectedGlazeId] = useState<string>(potteryGlazes[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(2);
  const [requiredDate, setRequiredDate] = useState<string>(getFutureDateString(21));
  const [specialNotes, setSpecialNotes] = useState<string>('Subtle organic ribbing on the body if possible.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected entities
  const selectedItem = potteryItems.find((i) => i.id === selectedItemId) || potteryItems[0];
  const selectedGlaze = potteryGlazes.find((g) => g.id === selectedGlazeId) || potteryGlazes[0];

  const estimatedTotal = selectedItem ? selectedItem.basePrice * quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedGlaze) return;

    setIsSubmitting(true);
    const res = await createPotteryRequest({
      itemId: selectedItem.id,
      glazeId: selectedGlaze.id,
      quantity,
      requiredDate,
      specialNotes,
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
              <span>Kiln & Wheel Studio</span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-500 font-mono text-[11px]">[Seed Catalog Items & Glazes]</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 tracking-tight">
              Bespoke Ceramic Commissions
            </h1>
            <p className="text-sm text-stone-600 max-w-2xl font-sans leading-relaxed">
              Every ceramic vessel is individually wheel-thrown from high-fire stoneware and coated with mineral glazes mixed in our studio. Commissions require a minimum 14-day lead time for drying, bisque firing, and glaze vitrification.
            </p>
          </div>

          <div className="p-3 bg-[#F5EFEB] border border-[#E0D3C1] rounded-sm text-xs font-sans space-y-1">
            <span className="font-semibold text-stone-800 block">Commission Rules:</span>
            <div className="text-stone-600">
              <span>Quantity: 1–12 pieces</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Lead time: &ge; 14 days</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Editable while "requested"</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Commission Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Interactive Selection and Form */}
        <div className="lg:col-span-8 space-y-10">
          {/* STEP 1: Choose Vessel Item */}
          <div className="bg-white border border-[#E0D3C1] p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9E6B38]">
                  Step 1
                </span>
                <h3 className="font-serif text-xl text-stone-900">
                  Select Ceramic Vessel Silhouette
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {potteryItems.length} Seed Item Profiles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {potteryItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`text-left p-3 rounded-sm border transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'border-[#9E6B38] bg-[#FAF5EE] ring-1 ring-[#9E6B38]'
                        : 'border-[#E0D3C1] bg-white hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <div className="aspect-4/3 overflow-hidden bg-stone-100 rounded-xs mb-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-semibold text-stone-900">
                          {item.name}
                        </h4>
                        {isSelected && <Check className="w-4 h-4 text-[#9E6B38]" />}
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        {item.dimensions}
                      </p>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-stone-200/60 flex items-center justify-between font-sans">
                      <span className="text-[11px] text-stone-500">Base piece:</span>
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {formatCurrency(item.basePrice)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Choose Glaze */}
          <div className="bg-white border border-[#E0D3C1] p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9E6B38]">
                  Step 2
                </span>
                <h3 className="font-serif text-xl text-stone-900">
                  Select High-Fire Studio Glaze
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {potteryGlazes.length} Mineral Formulas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {potteryGlazes.map((glaze) => {
                const isSelected = glaze.id === selectedGlazeId;
                return (
                  <button
                    key={glaze.id}
                    type="button"
                    onClick={() => setSelectedGlazeId(glaze.id)}
                    className={`text-left p-3.5 rounded-sm border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#9E6B38] bg-[#FAF5EE] ring-1 ring-[#9E6B38]'
                        : 'border-[#E0D3C1] bg-white hover:border-stone-400'
                    }`}
                  >
                    {/* Swatch */}
                    <div
                      className="w-8 h-8 rounded-full border border-black/20 shrink-0 shadow-inner mt-0.5"
                      style={{ backgroundColor: glaze.colorHex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-semibold text-stone-900 truncate">
                          {glaze.name}
                        </h4>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#9E6B38] shrink-0" />}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 block font-sans">
                        Finish: {glaze.finish}
                      </span>
                      <p className="text-[11px] text-stone-600 mt-1 leading-snug line-clamp-2 font-sans">
                        {glaze.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Quantity & Lead Time Submission Form */}
          <div className="bg-white border border-[#E0D3C1] p-6 rounded-sm space-y-6">
            <div className="border-b border-[#E8DCC4] pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9E6B38]">
                Step 3
              </span>
              <h3 className="font-serif text-xl text-stone-900">
                Quantity, Required Date & Commission Notes
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Quantity 1-12 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-800">
                      Commission Quantity (1 – 12 Pieces)
                    </label>
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {quantity} {quantity === 1 ? 'vessel' : 'vessels'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-9 h-9 border border-[#D8CCC4] text-stone-700 rounded-sm font-semibold hover:bg-stone-100 disabled:opacity-40"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(12, Math.max(1, val)));
                      }}
                      className="w-20 text-center py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(12, q + 1))}
                      disabled={quantity >= 12}
                      className="w-9 h-9 border border-[#D8CCC4] text-stone-700 rounded-sm font-semibold hover:bg-stone-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Studio wheel batches are limited to 12 pieces per order.
                  </span>
                </div>

                {/* Required Date (>= 14 days) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#9E6B38]" />
                      <span>Required Completion Date (&ge; 14 Days)</span>
                    </label>
                  </div>

                  <input
                    type="date"
                    min={minRequiredDate}
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                  />
                  <span className="text-[11px] text-stone-500 block">
                    Earliest completion: <strong className="font-mono">{minRequiredDate}</strong>
                  </span>
                </div>
              </div>

              {/* Special Notes */}
              <div className="space-y-1 pt-2 border-t border-[#E8DCC4]">
                <label className="block text-xs font-semibold text-stone-800">
                  Custom Inscriptions or Specific Proportions (Optional)
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes for the wheel thrower and glaze master..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                />
              </div>

              <div className="pt-4 border-t border-[#E8DCC4] flex items-center justify-between">
                <div className="text-xs text-stone-500">
                  <span>Customer can edit or cancel requests while in </span>
                  <strong className="text-stone-800">"requested"</strong> status.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-medium uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Submitting Commission...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Commission Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Live Commission Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#F5EFEB] border border-[#E0D3C1] p-6 rounded-sm space-y-6 font-sans">
            <h3 className="font-serif text-xl text-stone-900">
              Commission Spec Sheet
            </h3>

            {/* Selected Item Card */}
            <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm space-y-3">
              <div className="aspect-16/10 overflow-hidden bg-stone-100 rounded-xs">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-serif text-base text-stone-900 font-semibold">
                  {selectedItem.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mt-0.5">
                  <span>{selectedItem.dimensions}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatCurrency(selectedItem.basePrice)} each</span>
                </div>
              </div>
            </div>

            {/* Selected Glaze Card */}
            <div className="p-3 bg-white border border-[#E8DCC4] rounded-sm flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border border-stone-300 shrink-0 shadow-inner"
                style={{ backgroundColor: selectedGlaze.colorHex }}
              />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                  Chosen Glaze
                </span>
                <span className="font-serif font-semibold text-stone-900 text-sm">
                  {selectedGlaze.name}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  {selectedGlaze.finish} Finish
                </span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs pt-2 border-t border-[#E8DCC4]">
              <div className="flex items-center justify-between text-stone-600">
                <span>Unit Base Price:</span>
                <span className="font-mono text-stone-900 font-medium">{formatCurrency(selectedItem.basePrice)}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Batch Quantity:</span>
                <span className="font-mono text-stone-900 font-medium">{quantity}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Bisque & Glaze Firings:</span>
                <span className="text-emerald-700 font-medium">Included</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Required Date:</span>
                <span className="font-mono text-stone-900 font-medium">{requiredDate}</span>
              </div>

              <div className="flex items-baseline justify-between pt-3 border-t border-[#E8DCC4]">
                <span className="text-sm font-semibold text-stone-900">Estimated Total:</span>
                <span className="font-mono text-2xl font-bold text-stone-900">
                  {formatCurrency(estimatedTotal)}
                </span>
              </div>
            </div>

            {/* Firing schedule notice */}
            <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-sm text-xs text-stone-600 flex items-start gap-2">
              <Flame className="w-4 h-4 text-[#9E6B38] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Studio requests enter the kiln schedule as <strong className="text-stone-800">"requested"</strong>. Once accepted by the lead ceramicist, status progresses to <strong className="text-stone-800">"accepted"</strong> and locking begins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
