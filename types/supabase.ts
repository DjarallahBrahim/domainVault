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
          status?: "active" | "expired" | "sold" | "pending";
          registrar?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
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
      };
    };
  };
}
