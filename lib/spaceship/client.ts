const SPACESHIP_BASE = "https://spaceship.dev/api/v1";

interface SpaceshipError {
  detail?: string;
  message?: string;
}

export async function spaceshipFetch<T>(
  path: string,
  apiKey: string,
  apiSecret: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SPACESHIP_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": apiKey,
      "X-Api-Secret": apiSecret,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new Error("Invalid Spaceship credentials");
  }

  if (response.status === 429) {
    throw new Error("Spaceship rate limit exceeded. Try again shortly.");
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = body as SpaceshipError;
    throw new Error(err.detail ?? err.message ?? `Spaceship API error (${response.status})`);
  }

  return response.json();
}
