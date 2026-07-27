import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import AppProviders from "@/context/AppProviders";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Toaster from "@/components/Toaster";
import ScrollAnimator from "@/components/ScrollAnimator";
import LoadingOverlay from "@/components/LoadingOverlay";
import AuthModal from "@/components/AuthModal";
import CheckoutModal from "@/components/CheckoutModal";
import ChatWidget from "@/components/ChatWidget";
import AIAssistant from "@/components/AIAssistant";
import AIBanner from "@/components/AIBanner";
import SearchModal from "@/components/SearchModal";
import ProfileModal from "@/components/ProfileModal";
import ProductModal from "@/components/ProductModal";
import TransaksiModal from "@/components/TransaksiModal";
import LoyaltyModal from "@/components/LoyaltyModal";
import ProfileDashboard from "@/components/ProfileDashboard";
import OrdersSync from "@/components/OrdersSync";
import ReviewsSync from "@/components/ReviewsSync";

export const metadata = {
  title: "Syakilla Juice — Segar Tiap Hari",
  description:
    "Jus buah segar tanpa pengawet, dibuat fresh tiap hari di Batuphat. Pesan online via WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <SessionProviderWrapper>
          <AppProviders>
            <ScrollAnimator />
            <OrdersSync />
            <ReviewsSync />
            <Header />
            <main>{children}</main>
            <AIBanner />
            <Footer />
            <CartDrawer />
            <Toaster />
            <LoadingOverlay />
            <AuthModal />
            <CheckoutModal />
            <ChatWidget />
            <AIAssistant />
            <SearchModal />
            <ProfileModal />
            <ProductModal />
            <TransaksiModal />
            <LoyaltyModal />
            <ProfileDashboard />
          </AppProviders>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}