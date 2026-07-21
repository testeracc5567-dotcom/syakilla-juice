"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const UICtx = createContext(null);

export function UIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "" });
  const [navLoading, setNavLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState("dashboard");
  const timer = useRef(null);
  const navTimer = useRef(null);

  const showToast = useCallback((text) => {
    setToast({ show: true, text });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setToast((s) => ({ ...s, show: false })),
      2200,
    );
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const openCheckout = useCallback(() => {
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const toggleChat = useCallback(() => setChatOpen((v) => !v), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openProfile = useCallback(() => setProfileOpen(true), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const openAI = useCallback(() => setAiOpen(true), []);
  const closeAI = useCallback(() => setAiOpen(false), []);
  const toggleAI = useCallback(() => setAiOpen((v) => !v), []);
  const openProduct = useCallback((p) => setProduct(p), []);
  const closeProduct = useCallback(() => setProduct(null), []);
  const openOrders = useCallback(() => setOrdersOpen(true), []);
  const closeOrders = useCallback(() => setOrdersOpen(false), []);
  const openLoyalty = useCallback(() => setLoyaltyOpen(true), []);
  const closeLoyalty = useCallback(() => setLoyaltyOpen(false), []);
  const openDashboard = useCallback((section) => {
    setDashboardSection(section || "dashboard");
    setDashboardOpen(true);
  }, []);
  const closeDashboard = useCallback(() => setDashboardOpen(false), []);

  // Loading 1,5 detik tiap klik menu di Header, baru pindah halaman.
  const startNavLoading = useCallback((done) => {
    setNavLoading(true);
    if (navTimer.current) clearTimeout(navTimer.current);
    navTimer.current = setTimeout(() => {
      setNavLoading(false);
      if (typeof done === "function") done();
    }, 1500);
  }, []);

  return (
    <UICtx.Provider
      value={{
        cartOpen,
        openCart,
        closeCart,
        toast,
        showToast,
        navLoading,
        startNavLoading,
        authOpen,
        openAuth,
        closeAuth,
        checkoutOpen,
        openCheckout,
        closeCheckout,
        chatOpen,
        openChat,
        closeChat,
        toggleChat,
        searchOpen,
        openSearch,
        closeSearch,
        profileOpen,
        openProfile,
        closeProfile,
        aiOpen,
        openAI,
        closeAI,
        toggleAI,
        product,
        openProduct,
        closeProduct,
        ordersOpen,
        openOrders,
        closeOrders,
        loyaltyOpen,
        openLoyalty,
        closeLoyalty,
        dashboardOpen,
        dashboardSection,
        setDashboardSection,
        openDashboard,
        closeDashboard,
      }}
    >
      {children}
    </UICtx.Provider>
  );
}

export function useUI() {
  return useContext(UICtx);
}