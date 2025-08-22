// Translation constants for Seller Dashboard and related components
export const sellerDashboardTranslations = {
  ru: {
  // Dashboard main titles
  pageTitle: "Seller Dashboard",
  pageSubtitle: "Manage your products and orders",
  
  // Dashboard cards
  addProduct: {
    title: "Add Product",
    description: "List a new product on the marketplace"
  },
  
  myWarehouse: {
    title: "My Warehouse", 
    description: "View all your products in stock"
  },
  
  sellProduct: {
    title: "Sell Product",
    description: "Create an order from your products"
  },
  
  createOrder: {
    title: "Create Order",
    description: "Create a new order"
  },
  
  catalog: {
    title: "Catalog",
    description: "Browse all available products"
  },
  
  contactAdmin: {
    title: "Contact Admin",
    description: "Get help from administrator"
  },
  
  myOrders: {
    title: "My Orders", 
    description: "View and manage your orders"
  },

  priceOffers: {
    title: "Price Offers",
    description: "Manage price offers from buyers"
  },
  
  // Contact admin message
  contactAdminMessage: "I have a problem boss, my ID is",
  notSpecified: "Not specified",
  
  // Loading and error states
  loading: "Loading...",
  error: "Error loading dashboard",
  
  // Stats section
  stats: {
    totalProducts: "Total Products",
    activeProducts: "Active Products", 
    totalOrders: "Total Orders",
    pendingOrders: "Pending Orders",
    revenue: "Revenue",
    recentOrders: "Recent Orders",
    lastUpdated: "Last updated",
    noData: "No data available",
    errorLoading: "Error loading statistics",
    retry: "Retry"
  }
};

  },
  en: {
    // Dashboard main titles  
    pageTitle: "Seller Dashboard",
    pageSubtitle: "Manage your products and orders",
    
    // Dashboard cards
    addProduct: {
      title: "Add Product",
      description: "List a new product on the marketplace"
    },
    
    myWarehouse: {
      title: "My Warehouse", 
      description: "View all your products in stock"
    },
    
    sellProduct: {
      title: "Sell Product",
      description: "Create an order from your products"
    },
    
    createOrder: {
      title: "Create Order",
      description: "Create a new order"
    },
    
    catalog: {
      title: "Catalog",
      description: "Browse all available products"
    },
    
    contactAdmin: {
      title: "Contact Admin",
      description: "Get help from administrator"
    },
    
    myOrders: {
      title: "My Orders", 
      description: "View and manage your orders"
    },

    priceOffers: {
      title: "Price Offers",
      description: "Manage price offers from buyers"
    },
    
    // Contact admin message
    contactAdminMessage: "I have a problem boss, my ID is",
    notSpecified: "Not specified",
    
    // Loading and error states
    loading: "Loading...",
    error: "Error loading dashboard",
    
    // Stats section
    stats: {
      totalProducts: "Total Products",
      activeProducts: "Active Products", 
      totalOrders: "Total Orders",
      pendingOrders: "Pending Orders",
      revenue: "Revenue",
      recentOrders: "Recent Orders",
      lastUpdated: "Last updated",
      noData: "No data available",
      errorLoading: "Error loading statistics",
      retry: "Retry"
    }
  },
  bn: {
    // Dashboard main titles
    pageTitle: "বিক্রেতার ড্যাশবোর্ড",
    pageSubtitle: "আপনার পণ্য এবং অর্ডার পরিচালনা করুন",
    
    // Dashboard cards
    addProduct: {
      title: "পণ্য যোগ করুন",
      description: "মার্কেটপ্লেসে একটি নতুন পণ্য তালিকাভুক্ত করুন"
    },
    
    myWarehouse: {
      title: "আমার গুদাম", 
      description: "স্টকে থাকা আপনার সমস্ত পণ্য দেখুন"
    },
    
    sellProduct: {
      title: "পণ্য বিক্রি করুন",
      description: "আপনার পণ্য থেকে একটি অর্ডার তৈরি করুন"
    },
    
    createOrder: {
      title: "অর্ডার তৈরি করুন",
      description: "একটি নতুন অর্ডার তৈরি করুন"
    },
    
    catalog: {
      title: "ক্যাটালগ",
      description: "সমস্ত উপলব্ধ পণ্য ব্রাউজ করুন"
    },
    
    contactAdmin: {
      title: "অ্যাডমিনের সাথে যোগাযোগ",
      description: "প্রশাসকের কাছ থেকে সাহায্য নিন"
    },
    
    myOrders: {
      title: "আমার অর্ডার", 
      description: "আপনার অর্ডার দেখুন এবং পরিচালনা করুন"
    },

    priceOffers: {
      title: "মূল্য অফার",
      description: "ক্রেতাদের কাছ থেকে মূল্য অফার পরিচালনা করুন"
    },
    
    // Contact admin message
    contactAdminMessage: "আমার একটি সমস্যা আছে বস, আমার আইডি হল",
    notSpecified: "নির্দিষ্ট করা হয়নি",
    
    // Loading and error states  
    loading: "লোড হচ্ছে...",
    error: "ড্যাশবোর্ড লোড করতে ত্রুটি",
    
    // Stats section
    stats: {
      totalProducts: "মোট পণ্য",
      activeProducts: "সক্রিয় পণ্য", 
      totalOrders: "মোট অর্ডার",
      pendingOrders: "অপেক্ষমাণ অর্ডার",
      revenue: "আয়",
      recentOrders: "সাম্প্রতিক অর্ডার",
      lastUpdated: "শেষ আপডেট",
      noData: "কোনো ডেটা উপলব্ধ নেই",
      errorLoading: "পরিসংখ্যান লোড করতে ত্রুটি",
      retry: "পুনরায় চেষ্টা করুন"
    }
  }
};

export const getSellerDashboardTranslations = (language: 'ru' | 'en' | 'bn' = 'en') => {
  return sellerDashboardTranslations[language];
};

export default sellerDashboardTranslations;