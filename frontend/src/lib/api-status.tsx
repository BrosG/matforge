"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface ApiStatusContextType {
  isBackendAvailable: boolean;
  refreshStatus: () => Promise<void>;
}

const ApiStatusContext = createContext<ApiStatusContextType>({
  isBackendAvailable: false,
  refreshStatus: async () => {},
});

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

export function ApiStatusProvider({ children }: { children: React.ReactNode }) {
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      setIsBackendAvailable(res.ok);
    } catch {
      setIsBackendAvailable(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return (
    <ApiStatusContext.Provider value={{ isBackendAvailable, refreshStatus }}>
      {children}
    </ApiStatusContext.Provider>
  );
}

export function useApiStatus() {
  return useContext(ApiStatusContext);
}
