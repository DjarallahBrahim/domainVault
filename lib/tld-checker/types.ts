export interface ExtensionResult {
  tld: string;
  fullDomain: string;
  isReserved: boolean;
  isLive: boolean;
  resolver: string;
  tookMs: number;
  error?: string;
}

export interface CheckExtensionsOptions {
  concurrency?: number;
  signal?: AbortSignal;
}

export interface PersistOutcome {
  succeeded: number;
  failed: number;
  errors?: Array<{ tld: string; error: string }>;
}
