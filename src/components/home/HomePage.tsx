import React from 'react';
import { useAppStore } from '../../lib/store';
import { Painting } from '../../types';
import { ArrowRight, Compass, Sparkles, Brush, Layers, CheckCircle, Shield, Palette } from 'lucide-react';
import { formatCurrency } from '../../types';

export const HomePage: React.FC = () => {
  const { setCurrentPage, paintings, wallMuralRate } = useAppStore();

  const featuredPaintings = paintings.filter((p) => p.featured || p.status === 'available').slice(0, 3);
  const heroPainting = paintings[0] || {
    title: 'Madhubani Peacock Garden',
    artist: 'Meera Kumari',
    medium: 'Natural pigments on handmade paper',
    price: 6500,
    imageUrl: '/seedData/images/p-001.jpg',
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#F5EFEB] border-b border-[#E8DCC4] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
                <span>Art Studio & Fine Arts Workshop</span>
                <span aria-hidden="true">·</span>
                <span>Seed Data Ingested</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-[1.1] tracking-tight">
                Where Living Heritage <br />
                <span className="italic font-light text-stone-700">Meets Architectural Canvas.</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 font-sans leading-relaxed max-w-2xl">
                Discover authentic Madhubani, Warli, Tanjore, Pattachitra, and Kalamkari fine art. Every painting is a singular, one-of-a-kind original. Commission architectural site murals at ₹{wallMuralRate}/sq ft or bespoke terracotta and ceramic vessels.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setCurrentPage('paintings')}
                  className="px-6 py-3.5 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-medium tracking-wider uppercase transition-all rounded-sm flex items-center gap-2 shadow-sm"
                >
                  <span>Explore Original Paintings</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage('murals')}
                  className="px-6 py-3.5 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium tracking-wider uppercase border border-[#D8CCC4] transition-all rounded-sm"
                >
                  Book Wall Mural (₹{wallMuralRate}/sq ft)
                </button>
                <button
                  onClick={() => setCurrentPage('pottery')}
                  className="px-6 py-3.5 bg-transparent hover:bg-[#EAE0D3] text-stone-700 text-xs font-medium tracking-wider uppercase transition-all rounded-sm"
                >
                  Commission Pottery
                </button>
              </div>

              {/* Trust & Studio Tenets */}
              <div className="pt-6 border-t border-[#E8DCC4] flex flex-wrap items-center gap-6 text-xs text-stone-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Single-Acquisition Originals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Exclusive 1-Booking Per Date Murals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Handcrafted Pottery & Natural Glazes</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative z-10 bg-white p-3 border border-[#E0D3C1] shadow-2xl">
                <img
                  src={heroPainting.imageUrl}
                  alt={heroPainting.title}
                  className="w-full h-[420px] object-cover"
                />
                <div className="pt-3 pb-1 px-1 flex items-baseline justify-between text-xs text-stone-700">
                  <div>
                    <span className="font-serif italic text-sm text-stone-900">{heroPainting.title}</span>
                    <span className="text-stone-400 block text-[11px]">{heroPainting.medium || heroPainting.description} · {heroPainting.artist}</span>
                  </div>
                  <span className="font-mono font-medium text-stone-900">{formatCurrency(heroPainting.price)}</span>
                </div>
              </div>

              {/* Decorative warm accent frame */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border border-[#C2593F]/40 -z-0 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE STUDIO DISCIPLINES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
            Three Studio Disciplines
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">
            Crafted for Architectural Spaces & Considered Living
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed font-sans">
            Whether collecting gallery canvas pieces, transforming an entire dining room with a custom mineral wash mural, or ordering wheel-thrown ceramic sets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service 1: Paintings */}
          <div className="bg-[#FAF7F2] border border-[#E8DCC4] p-8 rounded-sm hover:border-stone-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-sm bg-[#F0E6D8] flex items-center justify-center text-[#9E6B38] group-hover:bg-[#1C1917] group-hover:text-white transition-colors">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900">1. Original Paintings</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Unique museum-grade canvases utilizing oil, raw cold wax, marble dust, and hand-ground pigments. Each painting can be purchased only once. Cancellation releases the original back to public availability.
              </p>
              <div className="pt-2 text-xs font-mono text-[#9E6B38]">
                Status Model: Placed · Cancelled
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('paintings')}
              className="mt-8 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-900 group-hover:text-[#9E6B38] pt-4 border-t border-[#E8DCC4]"
            >
              <span>View Gallery Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Service 2: Wall Murals */}
          <div className="bg-[#FAF7F2] border border-[#E8DCC4] p-8 rounded-sm hover:border-stone-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-sm bg-[#F0E6D8] flex items-center justify-center text-[#9E6B38] group-hover:bg-[#1C1917] group-hover:text-white transition-colors">
                <Brush className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900">2. Wall-Painting Murals</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Site-specific architectural wall murals brushed by our master painters. Select dates between 7 and 90 days away, for wall spaces from 10 to 500 sq ft, calculated precisely at the studio rate ($45/sq ft). Single booking per day exclusivity.
              </p>
              <div className="pt-2 text-xs font-mono text-[#9E6B38]">
                Status Model: Requested · Confirmed · Declined · Cancelled
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('murals')}
              className="mt-8 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-900 group-hover:text-[#9E6B38] pt-4 border-t border-[#E8DCC4]"
            >
              <span>Book Mural Service</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Service 3: Custom Pottery */}
          <div className="bg-[#FAF7F2] border border-[#E8DCC4] p-8 rounded-sm hover:border-stone-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-sm bg-[#F0E6D8] flex items-center justify-center text-[#9E6B38] group-hover:bg-[#1C1917] group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-stone-900">3. Custom Pottery</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Wheel-thrown stoneware and porcelain vessels. Select curated vessel profiles and artisanal glazes (Matte Chalk, Terracotta Wash, Celadon Mist). Batches of 1–12 pieces with a 14-day slow curing and firing window.
              </p>
              <div className="pt-2 text-xs font-mono text-[#9E6B38]">
                Status Model: Requested · Accepted · Declined · Cancelled
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('pottery')}
              className="mt-8 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-900 group-hover:text-[#9E6B38] pt-4 border-t border-[#E8DCC4]"
            >
              <span>Request Custom Ceramics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PAINTINGS PREVIEW */}
      <section className="bg-[#F5EFEB] border-y border-[#E8DCC4] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
                Curated Gallery
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight mt-1">
                Singular Works On Canvas
              </h2>
            </div>
            <button
              onClick={() => setCurrentPage('paintings')}
              className="mt-4 md:mt-0 text-xs font-medium tracking-wider uppercase text-stone-900 hover:text-[#9E6B38] flex items-center gap-1.5 transition-colors"
            >
              <span>View All Paintings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPaintings.map((painting) => (
              <div
                key={painting.id}
                className="bg-white border border-[#E0D3C1] rounded-sm p-4 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative overflow-hidden bg-stone-100 aspect-4/3 mb-4">
                    <img
                      src={painting.imageUrl}
                      alt={painting.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    {painting.status === 'sold' && (
                      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="font-serif text-white tracking-widest uppercase text-sm border-y border-white/60 py-1 px-4">
                          Acquired
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-serif text-xl text-stone-900 leading-snug group-hover:text-[#9E6B38] transition-colors">
                    {painting.title}
                  </h3>

                  <div className="text-xs text-stone-500 mt-1">
                    <span>{painting.artist}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>{painting.year}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>{painting.dimensions}</span>
                  </div>

                  <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                    {painting.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-mono font-medium text-stone-900 text-sm">
                    {formatCurrency(painting.price)}
                  </span>
                  <button
                    onClick={() => setCurrentPage('paintings')}
                    className="text-xs font-medium text-stone-700 hover:text-stone-950 underline underline-offset-4"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE STUDIO PHILOSOPHY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9E6B38]">
              The Atelier Philosophy
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight leading-tight">
              "We reject mass reproduction. An artwork lives only through the human hand and honest earth."
            </h2>
            <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
              <p>
                Founded on the belief that spaces deserve contemplation, Atelier Terre & Toile formulates its own gesso primers, slakes natural clay, and mixes dry ochre pigments sourced from sustainable riverbeds.
              </p>
              <p>
                When a customer acquires a painting, that piece permanently departs our catalog. When a wall mural is commissioned, our artist works exclusively in your space for that scheduled date.
              </p>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-4 border-t border-[#E8DCC4]">
              <div>
                <span className="font-serif text-2xl text-stone-900 block">100%</span>
                <span className="text-xs text-stone-500">Original works, zero duplicate prints</span>
              </div>
              <div>
                <span className="font-serif text-2xl text-stone-900 block">7–90 Days</span>
                <span className="text-xs text-stone-500">Mural booking advance schedule</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80"
              alt="Studio pottery crafting"
              className="w-full h-[400px] object-cover rounded-sm border border-[#E0D3C1] shadow-md"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-5 border border-[#E0D3C1] shadow-lg max-w-xs hidden sm:block">
              <span className="text-xs font-semibold text-[#9E6B38] uppercase tracking-wider block">
                Clay & Glaze Curing
              </span>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Pottery commissions strictly observe a 14-day kiln cycle to ensure structural vitrification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION / APPOINTMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1C1917] text-[#FAF7F2] p-8 sm:p-14 rounded-sm border border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <h3 className="font-serif text-3xl sm:text-4xl text-stone-100">
              Ready to Commission Your Space?
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed font-sans">
              Select your wall dimensions for an instant mural quote (₹{wallMuralRate}/sq ft) or browse currently available canvas pieces before they enter private collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setCurrentPage('murals')}
              className="px-6 py-3 bg-[#9E6B38] hover:bg-[#85582B] text-white text-xs font-medium uppercase tracking-wider rounded-sm transition-colors"
            >
              Book Wall Mural
            </button>
            <button
              onClick={() => setCurrentPage('pottery')}
              className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors"
            >
              Commission Pottery
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
