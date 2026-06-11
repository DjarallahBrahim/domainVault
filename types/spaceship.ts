export interface SpaceshipCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface SpaceshipListing {
  id: string;
  user_id: string;
  domain_id: string;
  domain_name: string;
  spaceship_domain_id: string | null;
  spaceship_price: number;
  spaceship_minprice: number;
  spaceship_currency: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceshipInsertPayload {
  domain: string;
  price: number;
}

export interface SpaceshipUserSettings {
  spaceship_api_key: string | null;
  spaceship_api_secret: string | null;
}
