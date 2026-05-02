/**
 * GA4 / GTM uyumu için dataLayer + ileride genişletilebilir funnel olayları.
 */

export type CommerceItem = {
  item_id: string;
  item_name: string;
  price?: number;
  currency?: string;
  quantity?: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function push(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
  window.dispatchEvent(
    new CustomEvent("commerce-analytics", { detail: payload }),
  );
}

export function commerceViewItem(item: CommerceItem) {
  push({
    event: "view_item",
    ecommerce: {
      currency: item.currency ?? "TRY",
      value: item.price,
      items: [
        {
          item_id: item.item_id,
          item_name: item.item_name,
          price: item.price,
          quantity: item.quantity ?? 1,
        },
      ],
    },
  });
}

export function commerceAddToCart(item: CommerceItem) {
  push({
    event: "add_to_cart",
    ecommerce: {
      currency: item.currency ?? "TRY",
      value: item.price ? item.price * (item.quantity ?? 1) : undefined,
      items: [
        {
          item_id: item.item_id,
          item_name: item.item_name,
          price: item.price,
          quantity: item.quantity ?? 1,
        },
      ],
    },
  });
}

export function commerceBeginCheckout(args: { value?: number; currency?: string; items: CommerceItem[] }) {
  push({
    event: "begin_checkout",
    ecommerce: {
      currency: args.currency ?? "TRY",
      value: args.value,
      items: args.items.map((i) => ({
        item_id: i.item_id,
        item_name: i.item_name,
        price: i.price,
        quantity: i.quantity ?? 1,
      })),
    },
  });
}

export function commercePurchase(args: {
  transaction_id: string;
  value: number;
  currency?: string;
  items: CommerceItem[];
}) {
  push({
    event: "purchase",
    ecommerce: {
      transaction_id: args.transaction_id,
      value: args.value,
      currency: args.currency ?? "TRY",
      items: args.items.map((i) => ({
        item_id: i.item_id,
        item_name: i.item_name,
        price: i.price,
        quantity: i.quantity ?? 1,
      })),
    },
  });
}
