export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      domains: {
        Row: {
          id: string;
          user_id: string;
          domain: string;
          tld: string;
          expiration_date: string;
          purchase_price: number | null;
          bin: number | null;
          status: "active" | "expired" | "sold" | "pending";
          registrar: string | null;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain: string;
          expiration_date: string;
          purchase_price?: number | null;
          bin?: number | null;
          status?: "active" | "expired" | "sold" | "pending";
          registrar?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain?: string;
          expiration_date?: string;
          purchase_price?: number | null;
          bin?: number | null;
          status?: "active" | "expired" | "sold" | "pending";
          registrar?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          domain_id: string | null;
          domain_name: string;
          sale_price: number;
          sold_at: string;
          buyer: string | null;
          platform: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain_id?: string | null;
          domain_name: string;
          sale_price: number;
          sold_at: string;
          buyer?: string | null;
          platform?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain_id?: string | null;
          domain_name?: string;
          sale_price?: number;
          sold_at?: string;
          buyer?: string | null;
          platform?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      import_logs: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          total_rows: number;
          imported: number;
          skipped: number;
          errors: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          total_rows: number;
          imported: number;
          skipped: number;
          errors?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          total_rows?: number;
          imported?: number;
          skipped?: number;
          errors?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          sedo_partner_id: number | null;
          sedo_signkey: string | null;
          sedo_username: string | null;
          sedo_password: string | null;
          spaceship_api_key: string | null;
          spaceship_api_secret: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sedo_partner_id?: number | null;
          sedo_signkey?: string | null;
          sedo_username?: string | null;
          sedo_password?: string | null;
          spaceship_api_key?: string | null;
          spaceship_api_secret?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sedo_partner_id?: number | null;
          sedo_signkey?: string | null;
          sedo_username?: string | null;
          sedo_password?: string | null;
          spaceship_api_key?: string | null;
          spaceship_api_secret?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sedo_listings: {
        Row: {
          id: string;
          user_id: string;
          domain_id: string;
          domain_name: string;
          sedo_price: number;
          sedo_minprice: number;
          sedo_fixedprice: number;
          sedo_currency: number;
          sedo_forsale: number;
          last_synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          domain_id: string;
          domain_name: string;
          sedo_price: number;
          sedo_minprice?: number;
          sedo_fixedprice?: number;
          sedo_currency?: number;
          sedo_forsale?: number;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain_id?: string;
          domain_name?: string;
          sedo_price?: number;
          sedo_minprice?: number;
          sedo_fixedprice?: number;
          sedo_currency?: number;
          sedo_forsale?: number;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spaceship_listings: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          domain_id: string;
          domain_name: string;
          spaceship_domain_id?: string | null;
          spaceship_price: number;
          spaceship_minprice?: number;
          spaceship_currency?: string;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          domain_id?: string;
          domain_name?: string;
          spaceship_domain_id?: string | null;
          spaceship_price?: number;
          spaceship_minprice?: number;
          spaceship_currency?: string;
          last_synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
