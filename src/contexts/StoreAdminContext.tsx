import React, { createContext, useContext } from "react";
import { useStoreAdmin } from "@/hooks/use-store-admin";

interface StoreAdminContextType {
  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
  isLoading: boolean;
  hasStore: boolean;
}

const StoreAdminContext = createContext<StoreAdminContextType>({
  storeId: null,
  storeName: null,
  storeSlug: null,
  isLoading: true,
  hasStore: false,
});

export const StoreAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { storeId, storeName, storeSlug, isLoading, hasStore } = useStoreAdmin();

  return (
    <StoreAdminContext.Provider value={{ storeId, storeName, storeSlug, isLoading, hasStore }}>
      {children}
    </StoreAdminContext.Provider>
  );
};

export const useStoreAdminContext = () => useContext(StoreAdminContext);
