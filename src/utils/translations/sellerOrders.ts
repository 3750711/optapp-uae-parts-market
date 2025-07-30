// Translation constants for SellerOrders page
export const sellerOrdersTranslations = {
  // Page titles and headers
  pageTitle: "My Orders",
  pageDescription: "Manage created orders and listing orders",
  backToDashboard: "Back to Dashboard",

  // Search related
  searchPlaceholder: "Search by order number, lot, title, brand, model or seller opt_id...",
  searchButton: "Search",
  searchingButton: "Searching...",
  findButton: "Find",
  clearButton: "Clear",
  clearSearch: "Clear search",
  searchResultsFor: "Search results for:",
  totalOrders: "Total orders:",
  foundResults: "Found:",
  noResultsFound: "No results found for your search",

  // Order status labels
  statusLabels: {
    created: "Created",
    seller_confirmed: "Confirmed by Seller", 
    admin_confirmed: "Confirmed by Admin",
    processed: "Processed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled"
  },

  // Order types
  orderTypes: {
    free_order: "Free Order",
    ads_order: "Listing Order"
  },

  // Order details
  lot: "Lot:",
  shippingPlaces: "Shipping places:",
  deliveryCost: "Delivery cost:",
  buyer: "Buyer",
  notSpecified: "Not specified", 
  additionalInformation: "Additional information:",

  // Action buttons
  confirmOrder: "Confirm",
  cancelOrder: "Cancel",
  confirmButton: "Confirm",
  cancelButton: "Cancel",

  // Toast messages
  orderConfirmed: "Order Confirmed",
  orderConfirmedDescription: "Order status successfully updated",
  orderCancelled: "Order Cancelled", 
  orderCancelledDescription: "Order status successfully updated",
  error: "Error",
  confirmOrderError: "Failed to confirm order",
  cancelOrderError: "Failed to cancel order",
  loadingOrdersError: "Error loading orders",

  // Dialog titles
  confirmOrderTitle: "Confirm Order",
  cancelOrderTitle: "Cancel Order",
  confirmOrderDescription: "Are you sure you want to confirm this order?",
  cancelOrderDescription: "Are you sure you want to cancel this order? This action cannot be undone.",

  // Empty states
  noOrders: "You don't have any orders yet",
  goToCatalog: "Go to Catalog",

  // Loading
  loading: "Loading..."
};

export default sellerOrdersTranslations;