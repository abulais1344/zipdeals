export type ProductStatus = "pending" | "active" | "sold" | "expired" | "rejected";

export interface Product {
  id: string;
  seller_id: string | null;
  seller_profile_id: string | null;
  title: string;
  description: string | null;
  price: number;
  original_price: number;
  discount_pct: number;
  image_urls: string[];
  seller_name: string;
  seller_phone: string;
  city: string;
  taluka: string | null;
  category: string;
  is_bulk: boolean;
  min_order_qty: number | null;
  bulk_price: number | null;
  status: ProductStatus;
  sold_token: string;
  views_count: number;
  whatsapp_clicks: number;
  dealType?: "Limited Time" | "Today Only" | "Clearance";
  validTill?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<
  Product,
  "id" | "seller_id" | "discount_pct" | "sold_token" | "views_count" | "whatsapp_clicks" | "expires_at" | "created_at" | "updated_at" | "status"
>;

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Partial<Product> & {
          title: string;
          price: number;
          original_price: number;
          image_urls: string[];
          seller_profile_id?: string | null;
          seller_name: string;
          seller_phone: string;
          city: string;
          category: string;
          taluka?: string | null;
        };
        Update: Partial<Product>;
      };
      events: {
        Row: {
          id: string;
          product_id: string;
          event_type: "view" | "whatsapp_click" | "report" | "seller_profile_click";
          city: string | null;
          event_context: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          event_type: "view" | "whatsapp_click" | "report" | "seller_profile_click";
          city?: string | null;
          event_context?: Record<string, unknown> | null;
        };
        Update: never;
      };
      reports: {
        Row: {
          id: string;
          product_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          reason?: string | null;
        };
        Update: never;
      };
    };
  };
}
