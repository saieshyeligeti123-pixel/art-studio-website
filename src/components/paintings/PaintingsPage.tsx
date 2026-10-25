import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Painting, formatCurrency } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Palette,
  Search,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const PaintingsPage: React.FC = () => {
  const { paintings, purchasePainting, currentUser, setCurrentPage, isLoading } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'sold'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(null);
  const [shippingAddress, setShippingAddress] = useState<string>('Plot 42, Jubilee Hills, Hyderabad, Telangana 500033');
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);

  // Filter logic
  const filteredPaintings = paintings.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      p.category === selectedCategory ||
      (p.description && p.description.toLowerCase().includes(selectedCategory.toLowerCase().replace(' style', '')));
    const matchesAvailability =
      selectedAvailability === 'all' ||
      (selectedAvailability === 'available' && p.status === 'available') ||
      (selectedAvailability === 'sold' && p.status === 'sold');
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesAvailability && matchesSearch;
  });

  const categories = [
    'All',
    'Madhubani',
    'Warli',
    'Tanjore',
    'Pattachitra',
    'Kalamkari',
    'Gond',
    'Cheriyal',
    'Rajasthani',
    'Pichwai',
    'Nirmal',
    'Kerala Mural',
  ];

  const handlePurchase = async () => {
    if (!selectedPainting) return;
    setIsPurchasing(true);
    const result = await purchasePainting(selectedPainting.id, shippingAddress);
    setIsPurchasing(false);
    if (result.success) {
      setSelectedPainting(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header & Editorial Introduction */}
      <div className="border-b border-[#E8DCC4] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
              <span>Original Works Gallery</span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-500 font-mono text-[11px]">[Preview Data Seed]</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 tracking-tight">
              Curated Canvas Paintings
            </h1>
            <p className="text-sm text-stone-600 max-w-2xl font-sans leading-relaxed">
              Every painting is a singular, handcrafted original. Under studio rules, each painting can be acquired only once. Once purchased, it is marked as sold until the collector elects to cancel their order.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 font-mono">
              Inventory: {paintings.filter((p) => p.status === 'available').length} available / {paintings.length} total
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Segmented button controls with zero-pill discipline) */}
      <div className="bg-[#F5EFEB] border border-[#E8DCC4] p-4 rounded-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1C1917] text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 bg-white/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Availability & Search Filter */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Availability Segment */}
          <div className="flex items-center bg-white p-1 rounded-sm border border-[#E0D3C1] text-xs">
            <button
              onClick={() => setSelectedAvailability('all')}
              className={`px-2.5 py-1 rounded-xs transition-colors ${
                selectedAvailability === 'all' ? 'bg-[#1C1917] text-white font-medium' : 'text-stone-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedAvailability('available')}
              className={`px-2.5 py-1 rounded-xs transition-colors ${
                selectedAvailability === 'available' ? 'bg-[#1C1917] text-white font-medium' : 'text-stone-600'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setSelectedAvailability('sold')}
              className={`px-2.5 py-1 rounded-xs transition-colors ${
                selectedAvailability === 'sold' ? 'bg-[#1C1917] text-white font-medium' : 'text-stone-600'
              }`}
            >
              Acquired
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search artist or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D8CCC4] rounded-sm text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-[#9E6B38]"
            />
          </div>
        </div>
      </div>

      {/* Paintings Grid with Loading & Empty States */}
      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-[#9E6B38] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-sans tracking-wide">
            Updating gallery inventory...
          </p>
        </div>
      ) : filteredPaintings.length === 0 ? (
        <div className="py-20 text-center bg-[#F5EFEB] border border-dashed border-[#D8CCC4] rounded-sm p-8 space-y-3">
          <Palette className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-serif text-xl text-stone-800">No Paintings Match Your Criteria</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try adjusting your category filter, availability toggle, or search query.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedAvailability('all');
              setSearchQuery('');
            }}
            className="text-xs font-medium text-[#9E6B38] underline underline-offset-4 pt-2"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPaintings.map((painting) => {
            const isSold = painting.status === 'sold';

            return (
              <div
                key={painting.id}
                className={`bg-white border border-[#E0D3C1] rounded-sm p-5 flex flex-col justify-between transition-all group ${
                  isSold ? 'opacity-85' : 'hover:shadow-xl'
                }`}
              >
                <div>
                  {/* Artwork Image Container */}
                  <div className="relative overflow-hidden aspect-4/3 bg-stone-100 mb-4 rounded-xs border border-stone-100">
                    <img
                      src={painting.imageUrl}
                      alt={painting.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />

                    {/* Clean Status Overlay */}
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={painting.status} size="sm" />
                    </div>

                    {isSold && (
                      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="text-center text-white space-y-1">
                          <span className="font-serif text-sm tracking-widest uppercase border-y border-white/60 py-1 px-4 block">
                            In Private Collection
                          </span>
                          <span className="text-[11px] text-stone-200 block">
                            Acquired by collector
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Artwork Metadata (Unboxed typography with separators) */}
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-sans">
                    <span>{painting.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{painting.year}</span>
                    <span aria-hidden="true">·</span>
                    <span>{painting.dimensions}</span>
                  </div>

                  <h3 className="font-serif text-2xl text-stone-900 mt-1 leading-snug group-hover:text-[#9E6B38] transition-colors">
                    {painting.title}
                  </h3>

                  <p className="text-xs font-sans text-stone-700 font-medium mt-0.5">
                    By {painting.artist}
                  </p>

                  <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                    {painting.description}
                  </p>
                </div>

                {/* Card Footer with Price and Acquisition Handler */}
                <div className="pt-4 mt-4 border-t border-[#EFE8DD] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-sans">
                      Acquisition Price
                    </span>
                    <span className="font-mono text-base font-semibold text-stone-900">
                      {formatCurrency(painting.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedPainting(painting)}
                    className={`px-4 py-2 text-xs font-medium rounded-sm transition-all ${
                      isSold
                        ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        : 'bg-[#1C1917] hover:bg-stone-800 text-white shadow-xs'
                    }`}
                  >
                    {isSold ? 'View Details' : 'Acquire Artwork'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL & PURCHASE MODAL */}
      {selectedPainting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F2] border border-[#D8CCC4] rounded-sm max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DCC4] bg-[#F5EFEB]">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedPainting.status} />
                <span className="text-xs text-stone-500 font-mono">
                  ID: #{selectedPainting.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedPainting(null)}
                className="text-stone-400 hover:text-stone-700 p-1 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
              <div className="relative aspect-16/10 bg-stone-100 overflow-hidden border border-[#E0D3C1] rounded-xs">
                <img
                  src={selectedPainting.imageUrl}
                  alt={selectedPainting.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                  <span>{selectedPainting.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPainting.dimensions}</span>
                  <span aria-hidden="true">·</span>
                  <span>Year {selectedPainting.year}</span>
                </div>
                <h2 className="font-serif text-3xl text-stone-900 leading-tight">
                  {selectedPainting.title}
                </h2>
                <p className="text-sm font-medium text-stone-800 mt-1">
                  Artist: {selectedPainting.artist}
                </p>
                <p className="text-xs text-stone-500 mt-0.5 font-mono">
                  Medium: {selectedPainting.medium}
                </p>
              </div>

              <div className="p-4 bg-white border border-[#E0D3C1] rounded-sm space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Curatorial Statement
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {selectedPainting.description}
                </p>
              </div>

              {/* Purchase Section or Sold Notice */}
              {selectedPainting.status === 'available' ? (
                <div className="space-y-4 pt-2 border-t border-[#E8DCC4]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-500 block">Acquisition Value</span>
                      <span className="font-mono text-2xl font-bold text-stone-900">
                        {formatCurrency(selectedPainting.price)}
                      </span>
                    </div>
                    <div className="text-right text-xs text-stone-500">
                      <span>Includes certificate of authenticity</span>
                      <span className="block text-emerald-700 font-medium">Single-purchase rule active</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Delivery / Shipping Address
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter delivery address..."
                      className="w-full px-3 py-2 bg-white border border-[#D8CCC4] rounded-sm text-xs text-stone-900 focus:outline-hidden focus:border-[#9E6B38]"
                    />
                  </div>

                  {!currentUser && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900 rounded-sm">
                      Please sign in or select a demo role in the navigation header to acquire this artwork.
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedPainting(null)}
                      className="px-4 py-2 border border-[#D8CCC4] text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                      className="px-6 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-medium uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
                    >
                      {isPurchasing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Reserving Artwork...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Acquisition</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-stone-100 border border-stone-200 rounded-sm space-y-2">
                  <div className="flex items-center gap-2 text-stone-800 font-medium text-xs">
                    <ShieldAlert className="w-4 h-4 text-stone-500" />
                    <span>Painting Already Acquired (Rule 1 Enforcement)</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    This painting has been purchased by a collector. Because each artwork is strictly one-of-a-kind, it cannot be acquired by another customer.
                  </p>
                  <p className="text-xs text-stone-500 italic">
                    Note: If the collector cancels their order in the Customer Dashboard, this painting will immediately become available in the catalog again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
