export type GTMUserData = {
  em?: string;      // hashed email
  ph?: string;      // hashed phone (880...)
  fn?: string;      // hashed first name
  ln?: string;      // hashed last name
  ct?: string;      // hashed city
  country?: string; // hashed 'bd'
};

export type GTMProduct = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  // Category & Classification
  item_category?: string;  // Main category  — e.g. Lighting
  item_subCategory?: string; // Subcategory    — e.g. Table Lamp
  item_series?: string; // Series         — e.g. Rattan Series
  // Variants
  item_color?: string;
  item_size?: string;
  item_material?: string;
  item_variant?: string; // Combined — e.g. 'Brown / Large / Rattan'
  // Status
  is_new?: boolean;
  is_on_sale?: boolean;
  discount?: number;
  availability?: "instock" | "outofstock";
};

// Reusable shape for all ecommerce events that carry a cart/item list
type GTMCartPayload = {
  currency: "BDT";
  value: number;
  items: GTMProduct[];
};

export type GTMEvent =
  | { event: "page_view"; page_path: string }
  | { event: "sign_up"; method: "phone" | "google" }
  | { event: "login"; method: "phone" | "email" | "google" }
  | { event: "search"; search_term: string }

  // ── Single-item events (PDP / wishlist) ───────────────────────────────────
  | ({ event: "view_item" } & GTMCartPayload)
  | ({ event: "add_to_wishlist" } & GTMCartPayload)
  | ({ event: "remove_from_wishlist" } & GTMCartPayload)

  // ── Item list events (PLP / search results) ───────────────────────────────
  | {
      event: "view_item_list";
      item_list_id?: string;   // added — e.g. 'homepage_featured'
      item_list_name: string;
      items: GTMProduct[];     // widened from Pick<> — full shape available on list pages
    }

  // ── Cart events ───────────────────────────────────────────────────────────
  | ({ event: "view_cart" } & GTMCartPayload)    // added
  | ({ event: "add_to_cart" } & GTMCartPayload)  // was: { item: GTMProduct }
  | ({ event: "remove_from_cart" } & GTMCartPayload) // was: flat item_id/item_name

  // ── Checkout & purchase ───────────────────────────────────────────────────
  | ({ event: "begin_checkout"; user_data: GTMUserData } & GTMCartPayload)
  | ({ event: "purchase"; transaction_id: string; user_data: GTMUserData } & GTMCartPayload);

export function pushGTMEvent(data: GTMEvent) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_GTM_ID) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ page_path: window.location.pathname, ...data });
}