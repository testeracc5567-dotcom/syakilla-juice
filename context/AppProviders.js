"use client";
import { UIProvider } from "./UIContext";
import { AuthProvider } from "./AuthContext";
import { StoreProvider } from "./StoreContext";
import { ProductsProvider } from "./ProductsContext";
import { ChatProvider } from "./ChatContext";

export default function AppProviders({ children }) {
  return (
    <UIProvider>
      <AuthProvider>
        <ProductsProvider>
          <StoreProvider>
            <ChatProvider>{children}</ChatProvider>
          </StoreProvider>
        </ProductsProvider>
      </AuthProvider>
    </UIProvider>
  );
}