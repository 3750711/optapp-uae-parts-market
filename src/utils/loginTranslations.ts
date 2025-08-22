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

export const translations: Record<'ru' | 'en', LoginTranslations> = {
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
};

export const getLoginTranslations = (language: 'ru' | 'en' | 'bn' = 'ru'): LoginTranslations => {
  // Bengali users see English translations for login
  const actualLanguage = language === 'bn' ? 'en' : language;
  return translations[actualLanguage as 'ru' | 'en'];
};