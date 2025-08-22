export interface LoginTranslations {
  // UI Elements
  loginTitle: string;
  loginDescription: string;
  sellerLoginTitle: string;
  sellerLoginDescription: string;
  email: string;
  optId: string;
  password: string;
  signIn: string;
  signingIn: string;
  enter: string;
  
  // Placeholders
  emailPlaceholder: string;
  optIdPlaceholder: string;
  passwordPlaceholder: string;
  sellerEmailPlaceholder: string;
  sellerPasswordPlaceholder: string;
  
  // Helper text
  loginHelperText: string;
  
  // Actions and links
  forgotPassword: string;
  noAccount: string;
  register: string;
  dontHaveSellerAccount: string;
  registerAsSeller: string;
  lookingForBuyerAccess: string;
  buyerLogin: string;
  orContinueWith: string;
  or: string;
  
  // Success messages
  loginSuccess: string;
  welcomeBack: string;
  telegramLoginSuccess: string;
  
  // Error messages
  errors: {
    invalidCredentials: string;
    userNotFound: string;
    optIdNotFound: string;
    rateLimited: string;
    networkError: string;
    genericError: string;
    fillAllFields: string;
    loginFailed: string;
    telegramLoginFailed: string;
  };
  
  // Error actions
  errorActions: {
    register: string;
    recoverPassword: string;
  };
  
  // Seller portal info
  sellerPortal: string;
  sellerPortalDescription: string;
  manageInventory: string;
  manageInventoryDesc: string;
  processOrders: string;
  processOrdersDesc: string;
  connectWithBuyers: string;
  connectWithBuyersDesc: string;
  growYourBusiness: string;
  growYourBusinessDesc: string;
}

export const translations: Record<'ru' | 'en' | 'bn', LoginTranslations> = {
  ru: {
    // UI Elements
    loginTitle: 'Вход',
    loginDescription: 'Войдите в свой аккаунт для продолжения',
    sellerLoginTitle: 'Вход для продавцов',
    sellerLoginDescription: 'Введите ваши данные для доступа к панели продавца',
    email: 'Email',
    optId: 'OPT ID',
    password: 'Пароль',
    signIn: 'Войти',
    signingIn: 'Входим...',
    enter: 'Войти',
    
    // Placeholders
    emailPlaceholder: 'Введите ваш email',
    optIdPlaceholder: 'Введите ваш OPT ID',
    passwordPlaceholder: 'Введите ваш пароль',
    sellerEmailPlaceholder: 'your@email.com',
    sellerPasswordPlaceholder: 'Введите ваш пароль',
    
    // Helper text
    loginHelperText: 'Вы можете войти используя email или OPT ID',
    
    // Actions and links
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    register: 'Зарегистрироваться',
    dontHaveSellerAccount: 'Нет аккаунта продавца?',
    registerAsSeller: 'Регистрация продавца',
    lookingForBuyerAccess: 'Нужен доступ покупателя?',
    buyerLogin: 'Вход покупателя',
    orContinueWith: 'Или продолжить с',
    or: 'или',
    
    // Success messages
    loginSuccess: 'Вход выполнен успешно',
    welcomeBack: 'Добро пожаловать!',
    telegramLoginSuccess: 'Успешный вход через Telegram',
    
    // Error messages
    errors: {
      invalidCredentials: 'Неверный пароль. Проверьте правильность введенных данных.',
      userNotFound: 'Пользователь с таким email не найден. Возможно, вы еще не зарегистрированы?',
      optIdNotFound: 'OPT ID не найден в системе. Проверьте правильность введенного ID.',
      rateLimited: 'Слишком много попыток входа. Попробуйте позже через несколько минут.',
      networkError: 'Проблемы с подключением к интернету. Проверьте соединение и попробуйте снова.',
      genericError: 'Произошла неожиданная ошибка. Попробуйте обновить страницу.',
      fillAllFields: 'Пожалуйста, заполните все поля',
      loginFailed: 'Ошибка входа',
      telegramLoginFailed: 'Ошибка входа через Telegram',
    },
    
    // Error actions
    errorActions: {
      register: 'Зарегистрироваться',
      recoverPassword: 'Восстановить пароль',
    },
    
    // Seller portal info
    sellerPortal: 'Портал продавца',
    sellerPortalDescription: 'Получите доступ к панели продавца и управляйте своим бизнесом автозапчастей на PartsBay.ae',
    manageInventory: 'Управление товарами',
    manageInventoryDesc: 'Добавляйте и управляйте списком автозапчастей',
    processOrders: 'Обработка заказов',
    processOrdersDesc: 'Эффективно обрабатывайте заказы клиентов',
    connectWithBuyers: 'Связь с покупателями',
    connectWithBuyersDesc: 'Охватите тысячи оптовых покупателей',
    growYourBusiness: 'Развитие бизнеса',
    growYourBusinessDesc: 'Расширьте свой рынок в ОАЭ',
  },
  
  en: {
    // UI Elements
    loginTitle: 'Login',
    loginDescription: 'Enter your account to continue',
    sellerLoginTitle: 'Seller Login',
    sellerLoginDescription: 'Enter your credentials to access your seller dashboard',
    email: 'Email',
    optId: 'OPT ID',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing In...',
    enter: 'Enter',
    
    // Placeholders
    emailPlaceholder: 'Enter your email',
    optIdPlaceholder: 'Enter your OPT ID',
    passwordPlaceholder: 'Enter your password',
    sellerEmailPlaceholder: 'your@email.com',
    sellerPasswordPlaceholder: 'Enter your password',
    
    // Helper text
    loginHelperText: 'You can login using email or OPT ID',
    
    // Actions and links
    forgotPassword: 'Forgot your password?',
    noAccount: 'No account?',
    register: 'Register',
    dontHaveSellerAccount: "Don't have a seller account?",
    registerAsSeller: 'Register as a Seller',
    lookingForBuyerAccess: 'Looking for buyer access?',
    buyerLogin: 'Buyer Login',
    orContinueWith: 'Or continue with',
    or: 'or',
    
    // Success messages
    loginSuccess: 'Login successful',
    welcomeBack: 'Welcome back!',
    telegramLoginSuccess: 'Successfully logged in with Telegram',
    
    // Error messages
    errors: {
      invalidCredentials: 'Invalid password. Please check your credentials.',
      userNotFound: 'User with this email not found. Maybe you are not registered yet?',
      optIdNotFound: 'OPT ID not found in system. Please check the entered ID.',
      rateLimited: 'Too many login attempts. Please try again in a few minutes.',
      networkError: 'Internet connection problems. Check your connection and try again.',
      genericError: 'An unexpected error occurred. Please refresh the page.',
      fillAllFields: 'Please fill in all fields',
      loginFailed: 'Login Failed',
      telegramLoginFailed: 'Telegram Login Failed',
    },
    
    // Error actions
    errorActions: {
      register: 'Register',
      recoverPassword: 'Recover Password',
    },
    
    // Seller portal info
    sellerPortal: 'Seller Portal',
    sellerPortalDescription: 'Access your seller dashboard and manage your auto parts business on PartsBay.ae',
    manageInventory: 'Manage Inventory',
    manageInventoryDesc: 'Add and manage your auto parts listings',
    processOrders: 'Process Orders',
    processOrdersDesc: 'Handle customer orders efficiently',
    connectWithBuyers: 'Connect with Buyers',
    connectWithBuyersDesc: 'Reach thousands of wholesale buyers',
    growYourBusiness: 'Grow Your Business',
    growYourBusinessDesc: 'Expand your market reach in UAE',
  },
  bn: {
    // UI Elements
    loginTitle: 'লগইন',
    loginDescription: 'চালিয়ে যেতে আপনার অ্যাকাউন্টে প্রবেশ করুন',
    sellerLoginTitle: 'বিক্রেতা লগইন',
    sellerLoginDescription: 'আপনার বিক্রেতা ড্যাশবোর্ড অ্যাক্সেস করতে আপনার শংসাপত্র প্রবেশ করান',
    email: 'ইমেইল',
    optId: 'অপট আইডি',
    password: 'পাসওয়ার্ড',
    signIn: 'সাইন ইন',
    signingIn: 'সাইন ইন করা হচ্ছে...',
    enter: 'প্রবেশ করুন',
    
    // Placeholders
    emailPlaceholder: 'আপনার ইমেইল প্রবেশ করান',
    optIdPlaceholder: 'আপনার অপট আইডি প্রবেশ করান',
    passwordPlaceholder: 'আপনার পাসওয়ার্ড প্রবেশ করান',
    sellerEmailPlaceholder: 'your@email.com',
    sellerPasswordPlaceholder: 'আপনার পাসওয়ার্ড প্রবেশ করান',
    
    // Helper text
    loginHelperText: 'আপনি ইমেইল বা অপট আইডি ব্যবহার করে লগইন করতে পারেন',
    
    // Actions and links
    forgotPassword: 'আপনার পাসওয়ার্ড ভুলে গেছেন?',
    noAccount: 'কোন অ্যাকাউন্ট নেই?',
    register: 'নিবন্ধন করুন',
    dontHaveSellerAccount: 'বিক্রেতা অ্যাকাউন্ট নেই?',
    registerAsSeller: 'বিক্রেতা হিসেবে নিবন্ধন',
    lookingForBuyerAccess: 'ক্রেতার অ্যাক্সেস খুঁজছেন?',
    buyerLogin: 'ক্রেতা লগইন',
    orContinueWith: 'অথবা এর সাথে চালিয়ে যান',
    or: 'অথবা',
    
    // Success messages
    loginSuccess: 'লগইন সফল',
    welcomeBack: 'স্বাগতম!',
    telegramLoginSuccess: 'টেলিগ্রামের মাধ্যমে সফল লগইন',
    
    // Error messages
    errors: {
      invalidCredentials: 'ভুল পাসওয়ার্ড। আপনার শংসাপত্র পরীক্ষা করুন।',
      userNotFound: 'এই ইমেইল দিয়ে ব্যবহারকারী খুঁজে পাওয়া যায়নি। সম্ভবত আপনি এখনও নিবন্ধিত নন?',
      optIdNotFound: 'সিস্টেমে অপট আইডি পাওয়া যায়নি। প্রবেশ করা আইডি পরীক্ষা করুন।',
      rateLimited: 'অনেক লগইন প্রচেষ্টা। কয়েক মিনিট পরে আবার চেষ্টা করুন।',
      networkError: 'ইন্টারনেট সংযোগের সমস্যা। আপনার সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।',
      genericError: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। পৃষ্ঠা রিফ্রেশ করুন।',
      fillAllFields: 'অনুগ্রহ করে সমস্ত ক্ষেত্র পূরণ করুন',
      loginFailed: 'লগইন ব্যর্থ',
      telegramLoginFailed: 'টেলিগ্রাম লগইন ব্যর্থ',
    },
    
    // Error actions
    errorActions: {
      register: 'নিবন্ধন করুন',
      recoverPassword: 'পাসওয়ার্ড পুনরুদ্ধার',
    },
    
    // Seller portal info
    sellerPortal: 'বিক্রেতা পোর্টাল',
    sellerPortalDescription: 'আপনার বিক্রেতা ড্যাশবোর্ড অ্যাক্সেস করুন এবং PartsBay.ae-তে আপনার অটো পার্টস ব্যবসা পরিচালনা করুন',
    manageInventory: 'ইনভেন্টরি পরিচালনা',
    manageInventoryDesc: 'আপনার অটো পার্টস তালিকা যোগ এবং পরিচালনা করুন',
    processOrders: 'অর্ডার প্রক্রিয়া',
    processOrdersDesc: 'গ্রাহকের অর্ডার দক্ষতার সাথে পরিচালনা করুন',
    connectWithBuyers: 'ক্রেতাদের সাথে সংযোগ',
    connectWithBuyersDesc: 'হাজার হাজার পাইকারি ক্রেতাদের কাছে পৌঁছান',
    growYourBusiness: 'আপনার ব্যবসা বৃদ্ধি',
    growYourBusinessDesc: 'সংযুক্ত আরব আমিরাতে আপনার বাজার সম্প্রসারণ করুন',
  },
};

export const getLoginTranslations = (language: 'ru' | 'en' | 'bn' = 'ru'): LoginTranslations => {
  // Show Bengali if available, fallback to English if needed
  return translations[language] ?? translations.en;
};