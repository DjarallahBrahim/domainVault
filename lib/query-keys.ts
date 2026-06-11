export const queryKeys = {
  domains: {
    all: ["domains"] as const,
    lists: () => [...queryKeys.domains.all, "list"] as const,
    list: (filters: Record<string, string | number | undefined>) =>
      [...queryKeys.domains.lists(), filters] as const,
    details: () => [...queryKeys.domains.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.domains.details(), id] as const,
  },
  importLogs: {
    all: ["import-logs"] as const,
    lists: () => [...queryKeys.importLogs.all, "list"] as const,
    list: (filters?: Record<string, string | number | undefined>) =>
      [...queryKeys.importLogs.lists(), filters] as const,
    details: () => [...queryKeys.importLogs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.importLogs.details(), id] as const,
  },
  sedoListings: {
    all: ["sedo-listings"] as const,
  },
  spaceshipListings: {
    all: ["spaceship-listings"] as const,
  },
  userSettings: {
    all: ["user-settings"] as const,
  },
};
