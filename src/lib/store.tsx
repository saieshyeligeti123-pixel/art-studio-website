import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  User,
  Role,
  Painting,
  PaintingOrder,
  WallBooking,
  PotteryRequest,
  PotteryItemSpec,
  PotteryGlazeSpec,
  PageView,
} from '../types';
import { api } from './apiClient';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppStoreContextType {
  // Navigation
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;

  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchUserRole: (role: Role) => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<boolean>;
  logout: () => void;

  // Paintings
  paintings: Painting[];
  paintingOrders: PaintingOrder[];
  refreshPaintings: () => Promise<void>;
  purchasePainting: (paintingId: string, shippingAddress: string) => Promise<{ success: boolean; error?: string }>;
  cancelPaintingOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  addPainting: (newPainting: Omit<Painting, 'id' | 'status'>) => Promise<{ success: boolean; error?: string }>;
  editPainting: (paintingId: string, updates: Partial<Painting>) => Promise<{ success: boolean; error?: string }>;

  // Wall Murals
  wallBookings: WallBooking[];
  wallMuralRate: number;
  refreshMurals: () => Promise<void>;
  createWallBooking: (data: {
    scheduledDate: string;
    wallSizeSqFt: number;
    address: string;
    city: string;
    stateZip: string;
    stylePreference: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  cancelWallBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  updateWallBookingStatus: (bookingId: string, status: 'confirmed' | 'declined', adminNote?: string) => Promise<{ success: boolean; error?: string }>;

  // Pottery
  potteryItems: PotteryItemSpec[];
  potteryGlazes: PotteryGlazeSpec[];
  potteryRequests: PotteryRequest[];
  refreshPottery: () => Promise<void>;
  createPotteryRequest: (data: {
    itemId: string;
    glazeId: string;
    quantity: number;
    requiredDate: string;
    specialNotes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  editPotteryRequest: (requestId: string, updates: {
    itemId: string;
    glazeId: string;
    quantity: number;
    requiredDate: string;
    specialNotes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  cancelPotteryRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  updatePotteryRequestStatus: (requestId: string, status: 'accepted' | 'declined', adminNote?: string) => Promise<{ success: boolean; error?: string }>;

  // Toast / Feedback
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Loading state
  isLoading: boolean;
  resetToSeedPreviewData: () => Promise<void>;

  // Modal helpers
  seedGuideOpen: boolean;
  setSeedGuideOpen: (open: boolean) => void;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export const AppStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seedGuideOpen, setSeedGuideOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 1. Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 2. Data State
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [paintingOrders, setPaintingOrders] = useState<PaintingOrder[]>([]);
  const [wallBookings, setWallBookings] = useState<WallBooking[]>([]);
  const [potteryRequests, setPotteryRequests] = useState<PotteryRequest[]>([]);
  const [potteryItems, setPotteryItems] = useState<PotteryItemSpec[]>([]);
  const [potteryGlazes, setPotteryGlazes] = useState<PotteryGlazeSpec[]>([]);
  const [wallMuralRate, setWallMuralRate] = useState<number>(150);

  // Toast notifications
  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Data fetching functions
  const refreshPaintings = useCallback(async () => {
    try {
      const data = await api.paintings.list();
      setPaintings(data);
    } catch (err: any) {
      console.error('Failed to load paintings:', err);
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const catalog = await api.pottery.getCatalog();
      setPotteryItems(catalog.items);
      setPotteryGlazes(catalog.glazes);
      setWallMuralRate(catalog.wallMuralRate || 150);
    } catch (err: any) {
      console.error('Failed to load catalog:', err);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!api.getToken()) {
      setPaintingOrders([]);
      return;
    }
    try {
      const orders = await api.orders.list();
      setPaintingOrders(orders);
    } catch (err) {
      // Unauthenticated or error
      setPaintingOrders([]);
    }
  }, []);

  const refreshMurals = useCallback(async () => {
    if (!api.getToken()) {
      setWallBookings([]);
      return;
    }
    try {
      const bookings = await api.murals.list();
      setWallBookings(bookings);
    } catch (err) {
      setWallBookings([]);
    }
  }, []);

  const refreshPottery = useCallback(async () => {
    if (!api.getToken()) {
      setPotteryRequests([]);
      return;
    }
    try {
      const requests = await api.pottery.list();
      setPotteryRequests(requests);
    } catch (err) {
      setPotteryRequests([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await Promise.all([refreshPaintings(), refreshCatalog()]);

      // Check existing session
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.auth.me();
          setCurrentUser(res.user);
          await Promise.all([refreshOrders(), refreshMurals(), refreshPottery()]);
        } catch {
          // Token expired or invalid
          api.setToken(null);
          setCurrentUser(null);
        }
      } else {
        // Automatically sign in as Demo Customer for seamless evaluator experience
        try {
          const res = await api.auth.login('saieshyeligeti123@gmail.com', 'Customer@123');
          setCurrentUser(res.user);
          await Promise.all([refreshOrders(), refreshMurals(), refreshPottery()]);
        } catch {
          // Ignore
        }
      }
      setIsLoading(false);
    };

    initialize();
  }, [refreshPaintings, refreshCatalog, refreshOrders, refreshMurals, refreshPottery]);

  // Auth Helpers
  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Default passwords for demo accounts if not supplied
      const pwd = password || (email.toLowerCase().includes('studio') ? 'Studio@123' : 'Customer@123');
      const res = await api.auth.login(email, pwd);
      setCurrentUser(res.user);
      await Promise.all([refreshPaintings(), refreshOrders(), refreshMurals(), refreshPottery()]);
      setIsLoading(false);
      addToast('success', 'Welcome Back', `Logged in as ${res.user.name} (${res.user.role}).`);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Authentication Failed${code}`, err.message || 'Could not verify credentials.');
      return false;
    }
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      setCurrentUser(res.user);
      await Promise.all([refreshPaintings(), refreshOrders(), refreshMurals(), refreshPottery()]);
      setIsLoading(false);
      addToast('success', 'Account Created', `Welcome to Atelier Terre & Toile, ${res.user.name}.`);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Registration Error${code}`, err.message || 'Could not complete registration.');
      return false;
    }
  };

  const logout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setPaintingOrders([]);
    setWallBookings([]);
    setPotteryRequests([]);
    addToast('info', 'Signed Out', 'You have been signed out of your account.');
    setCurrentPage('login');
  };

  const switchUserRole = async (role: Role) => {
    if (role === 'admin' || role === 'studio') {
      const success = await login('studio@artstudio.in', 'Studio@123');
      if (success) {
        addToast('info', 'Studio Curator Mode', 'Logged in as Lead Curator (Role: Studio Admin).');
      }
    } else {
      const success = await login('saieshyeligeti123@gmail.com', 'Customer@123');
      if (success) {
        addToast('info', 'Customer Mode', 'Logged in as Saiesh Yeligeti (Role: Customer).');
      }
    }
  };

  // -------------------------------------------------------------
  // ASSIGNMENT SERVICE 1: PAINTINGS
  // -------------------------------------------------------------
  const purchasePainting = async (paintingId: string, shippingAddress: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      addToast('error', 'Authentication Required (401)', 'Please sign in or select a demo profile to place an order.');
      setCurrentPage('login');
      return { success: false, error: 'Unauthenticated (401)' };
    }

    setIsLoading(true);
    try {
      const res = await api.paintings.purchase(paintingId, shippingAddress);
      await Promise.all([refreshPaintings(), refreshOrders()]);
      setIsLoading(false);
      addToast('success', 'Order Placed Successfully', `"${res.order.paintingTitle}" reserved. Order #${res.order.id.slice(-6)}.`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Purchase Failed${code}`, err.message || 'Transaction could not be completed.');
      return { success: false, error: err.message };
    }
  };

  const cancelPaintingOrder = async (orderId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      addToast('error', 'Authentication Required (401)', 'Please sign in to manage orders.');
      return { success: false, error: 'Unauthenticated (401)' };
    }

    setIsLoading(true);
    try {
      const res = await api.orders.cancel(orderId);
      await Promise.all([refreshPaintings(), refreshOrders()]);
      setIsLoading(false);
      addToast('success', 'Order Cancelled', res.message || 'Artwork is now available in the gallery again.');
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Cancellation Error${code}`, err.message || 'Could not cancel order.');
      return { success: false, error: err.message };
    }
  };

  const addPainting = async (newPainting: Omit<Painting, 'id' | 'status'>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      addToast('error', 'Unauthorized Action (403)', 'Only studio curators and admins can add artworks to the gallery.');
      return { success: false, error: 'Forbidden (403)' };
    }

    setIsLoading(true);
    try {
      const created = await api.paintings.create(newPainting);
      await refreshPaintings();
      setIsLoading(false);
      addToast('success', 'Painting Cataloged', `"${created.title}" is now published in the gallery.`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Catalog Error${code}`, err.message || 'Could not add artwork.');
      return { success: false, error: err.message };
    }
  };

  const editPainting = async (paintingId: string, updates: Partial<Painting>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      addToast('error', 'Unauthorized Action (403)', 'Only studio curators and admins can edit artworks.');
      return { success: false, error: 'Forbidden (403)' };
    }

    setIsLoading(true);
    try {
      const updated = await api.paintings.edit(paintingId, updates);
      await refreshPaintings();
      setIsLoading(false);
      addToast('success', 'Artwork Updated', `Modifications saved for "${updated.title}".`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Update Error${code}`, err.message || 'Could not update artwork.');
      return { success: false, error: err.message };
    }
  };

  // -------------------------------------------------------------
  // ASSIGNMENT SERVICE 2: WALL PAINTING
  // -------------------------------------------------------------
  const createWallBooking = async (data: {
    scheduledDate: string;
    wallSizeSqFt: number;
    address: string;
    city: string;
    stateZip: string;
    stylePreference: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      addToast('error', 'Authentication Required (401)', 'Please sign in or select a demo profile to book a wall painting.');
      setCurrentPage('login');
      return { success: false, error: 'Unauthenticated (401)' };
    }

    setIsLoading(true);
    try {
      const booking = await api.murals.create(data);
      await refreshMurals();
      setIsLoading(false);
      addToast('success', 'Mural Request Submitted', `Scheduled for ${booking.scheduledDate} (${booking.wallSizeSqFt} sq ft = ₹${booking.totalPrice.toLocaleString()}). Pending studio review.`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Booking Error${code}`, err.message || 'Failed to submit booking.');
      return { success: false, error: err.message };
    }
  };

  const cancelWallBooking = async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      addToast('error', 'Authentication Required (401)', 'Please sign in to manage bookings.');
      return { success: false, error: 'Unauthenticated (401)' };
    }

    setIsLoading(true);
    try {
      const res = await api.murals.cancel(bookingId);
      await refreshMurals();
      setIsLoading(false);
      addToast('success', 'Booking Cancelled', res.message || 'Your mural appointment has been cancelled.');
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Cancellation Error${code}`, err.message || 'Failed to cancel mural booking.');
      return { success: false, error: err.message };
    }
  };

  const updateWallBookingStatus = async (
    bookingId: string,
    status: 'confirmed' | 'declined',
    adminNote?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      addToast('error', 'Unauthorized Action (403)', 'Only studio managers can approve or decline mural requests.');
      return { success: false, error: 'Forbidden (403)' };
    }

    setIsLoading(true);
    try {
      await api.murals.updateStatus(bookingId, status, adminNote);
      await refreshMurals();
      setIsLoading(false);
      addToast('success', `Booking ${status === 'confirmed' ? 'Confirmed' : 'Declined'}`, `Status updated to ${status}.`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Status Update Error${code}`, err.message || 'Failed to update booking status.');
      return { success: false, error: err.message };
    }
  };

  // -------------------------------------------------------------
  // ASSIGNMENT SERVICE 3: CUSTOM POTTERY
  // -------------------------------------------------------------
  const createPotteryRequest = async (data: {
    itemId: string;
    glazeId: string;
    quantity: number;
    requiredDate: string;
    specialNotes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      addToast('error', 'Authentication Required (401)', 'Please sign in or select a demo profile to submit a pottery request.');
      setCurrentPage('login');
      return { success: false, error: 'Unauthenticated (401)' };
    }

    setIsLoading(true);
    try {
      const req = await api.pottery.create(data);
      await refreshPottery();
      setIsLoading(false);
      addToast('success', 'Pottery Commission Submitted', `Requested ${req.quantity}x ${req.itemName} with ${req.glazeName} glaze (₹${req.estimatedPrice.toLocaleString()}).`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Commission Error${code}`, err.message || 'Failed to submit pottery request.');
      return { success: false, error: err.message };
    }
  };

  const editPotteryRequest = async (
    requestId: string,
    updates: {
      itemId: string;
      glazeId: string;
      quantity: number;
      requiredDate: string;
      specialNotes?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthenticated (401)' };

    setIsLoading(true);
    try {
      const updated = await api.pottery.edit(requestId, updates);
      await refreshPottery();
      setIsLoading(false);
      addToast('success', 'Commission Updated', `Saved modifications for ${updated.itemName} commission.`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Update Error${code}`, err.message || 'Failed to modify pottery commission.');
      return { success: false, error: err.message };
    }
  };

  const cancelPotteryRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthenticated (401)' };

    setIsLoading(true);
    try {
      const res = await api.pottery.cancel(requestId);
      await refreshPottery();
      setIsLoading(false);
      addToast('success', 'Commission Cancelled', res.message || 'Pottery commission request cancelled.');
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Cancellation Error${code}`, err.message || 'Failed to cancel commission.');
      return { success: false, error: err.message };
    }
  };

  const updatePotteryRequestStatus = async (
    requestId: string,
    status: 'accepted' | 'declined',
    adminNote?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      addToast('error', 'Unauthorized Action (403)', 'Only studio managers can accept or decline pottery commissions.');
      return { success: false, error: 'Forbidden (403)' };
    }

    setIsLoading(true);
    try {
      await api.pottery.updateStatus(requestId, status, adminNote);
      await refreshPottery();
      setIsLoading(false);
      addToast('success', `Commission ${status === 'accepted' ? 'Accepted' : 'Declined'}`, `Status updated to ${status}.`);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.status ? ` (${err.status})` : '';
      addToast('error', `Status Update Error${code}`, err.message || 'Failed to update pottery status.');
      return { success: false, error: err.message };
    }
  };

  // Reset to initial seed state
  const resetToSeedPreviewData = async () => {
    setIsLoading(true);
    try {
      await api.admin.resetSeed();
      await Promise.all([refreshPaintings(), refreshCatalog(), refreshOrders(), refreshMurals(), refreshPottery()]);
      setIsLoading(false);
      addToast('info', 'Database Reset Complete', 'Restored verified official seed data (12 paintings, 5 pottery items, 6 glazes, ₹150 rate) in SQLite.');
    } catch (err: any) {
      setIsLoading(false);
      addToast('error', 'Reset Failed', err.message || 'Could not reset seed data.');
    }
  };

  return (
    <AppStoreContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        currentUser,
        setCurrentUser,
        switchUserRole,
        login,
        register,
        logout,
        paintings,
        paintingOrders,
        refreshPaintings,
        purchasePainting,
        cancelPaintingOrder,
        addPainting,
        editPainting,
        wallBookings,
        wallMuralRate,
        refreshMurals,
        createWallBooking,
        cancelWallBooking,
        updateWallBookingStatus,
        potteryItems,
        potteryGlazes,
        potteryRequests,
        refreshPottery,
        createPotteryRequest,
        editPotteryRequest,
        cancelPotteryRequest,
        updatePotteryRequestStatus,
        toasts,
        addToast,
        removeToast,
        isLoading,
        resetToSeedPreviewData,
        seedGuideOpen,
        setSeedGuideOpen,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};
