import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  // Using elegant typographic status styling with quiet dot indicators (Zero-pill discipline)
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'available':
        return {
          dotColor: 'bg-emerald-600',
          textColor: 'text-emerald-800',
          bgStyle: 'bg-emerald-50/80 border border-emerald-200/60',
          label: 'Available for Acquisition',
        };
      case 'sold':
        return {
          dotColor: 'bg-stone-400',
          textColor: 'text-stone-600',
          bgStyle: 'bg-stone-100 border border-stone-200/60',
          label: 'Acquired / In Private Collection',
        };
      case 'placed':
        return {
          dotColor: 'bg-amber-600',
          textColor: 'text-amber-800',
          bgStyle: 'bg-amber-50/80 border border-amber-200/60',
          label: 'Order Placed',
        };
      case 'requested':
        return {
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-800',
          bgStyle: 'bg-amber-50 border border-amber-200/60',
          label: 'Requested (Pending Review)',
        };
      case 'confirmed':
      case 'accepted':
        return {
          dotColor: 'bg-emerald-600',
          textColor: 'text-emerald-800',
          bgStyle: 'bg-emerald-50 border border-emerald-200/60',
          label: status === 'confirmed' ? 'Booking Confirmed' : 'Commission Accepted',
        };
      case 'declined':
        return {
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-800',
          bgStyle: 'bg-rose-50 border border-rose-200/60',
          label: 'Declined by Studio',
        };
      case 'cancelled':
        return {
          dotColor: 'bg-stone-400',
          textColor: 'text-stone-500',
          bgStyle: 'bg-stone-100 border border-stone-200/50 line-through',
          label: 'Cancelled',
        };
      default:
        return {
          dotColor: 'bg-stone-400',
          textColor: 'text-stone-700',
          bgStyle: 'bg-stone-50 border border-stone-200/60',
          label: status,
        };
    }
  };

  const config = getStatusConfig();
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs md:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm font-sans font-medium tracking-wide ${config.bgStyle} ${config.textColor} ${textSize}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      <span>{config.label}</span>
    </span>
  );
};
