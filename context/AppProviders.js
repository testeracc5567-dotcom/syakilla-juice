"use client";
import { UIProvider } from "./UIContext";
import { AuthProvider } from "./AuthContext";
import { StoreProvider } from "./StoreContext";
import { ChatProvider } from "./ChatContext";

export default function AppProviders({ children }) {
  return (
    <UIProvider>
      <AuthProvider>
        <StoreProvider>
          <ChatProvider>{children}</ChatProvider>
        </StoreProvider>
      </AuthProvider>
    </UIProvider>
  );
}