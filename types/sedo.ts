export interface SedoCredentials {
  partnerid: number;
  signkey: string;
  username: string;
  password: string;
}

export interface SedoListing {
  id: string;
  user_id: string;
  domain_id: string;
  domain_name: string;
  sedo_price: number;
  sedo_minprice: number;
  sedo_fixedprice: 0 | 1;
  sedo_currency: 0 | 1 | 2;
  sedo_forsale: 0 | 1;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface SedoInsertPayload {
  domain: string;
  price: number;
  minprice: number;
  fixedprice: 0 | 1;
  currency: 1;
  forsale: 1;
}

export interface SedoUserSettings {
  sedo_partner_id: number | null;
  sedo_signkey: string | null;
  sedo_username: string | null;
  sedo_password: string | null;
}
