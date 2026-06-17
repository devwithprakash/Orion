import { useQuery } from "@tanstack/react-query";

export function useConnectionStatus() {
  return useQuery({
    queryKey: ["connection-status"],
    queryFn: async () => {
      const res = await fetch("/api/connection/status");
      if (!res.ok) throw new Error("Failed to fetch connection status");
      return res.json() as Promise<{ gmail: boolean; googlecalendar: boolean }>;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
