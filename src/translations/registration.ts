export const registrationTranslations = {
  ru: {
    // Step 1: Registration Type Selection
    chooseRegistrationType: "Выберите способ регистрации",
    telegramRegistration: "Telegram регистрация",
    telegramSubtext: "Быстрая регистрация через Telegram",
    standardRegistration: "Стандартная регистрация",
    standardSubtext: "Регистрация с заполнением формы",
    recommended: "Рекомендуется",
    
    // Step 2: Account Type Selection
    chooseAccountType: "Выберите тип аккаунта",
    buyerAccount: "Покупатель",
    buyerDescription: "Покупка автозапчастей и товаров",
    sellerAccount: "Продавец",
    sellerDescription: "Продажа автозапчастей и товаров",
    
    // Step 3: OPT ID Generation
    generatingOptId: "Генерируем OPT_ID для заказов",
    optIdGenerated: "Ваш OPT_ID сгенерирован",
    optIdNote: "Сохраните этот ID - он понадобится для работы",
    pendingApproval: "⏳ Ожидание одобрения",
    approvalNote: "Ваш аккаунт будет рассмотрен администраторами в течение 1 рабочего дня. После одобрения вы получите полный доступ к платформе.",
    
    // Step 4: Store Information
    storeInformation: "Информация о магазине",
    storeName: "Название магазина",
    storeNamePlaceholder: "Введите название вашего магазина",
    storeDescription: "Описание магазина",
    storeDescriptionPlaceholder: "Расскажите о вашем магазине",
    storeLocation: "Локация в ОАЭ",
    selectLocation: "Выберите локацию",
    
    // Step 5: Personal Information
    personalInformation: "Персональная информация",
    fullName: "Полное имя",
    fullNamePlaceholder: "Введите ваше полное имя",
    phone: "Номер телефона",
    phonePlaceholder: "+971 XX XXX XXXX",
    email: "Email",
    emailPlaceholder: "your@email.com",
    password: "Пароль",
    passwordPlaceholder: "Минимум 6 символов",
    confirmPassword: "Подтвердите пароль",
    confirmPasswordPlaceholder: "Повторите пароль",
    
    // Step 6: Final Loading
    finalStep: "Завершение регистрации",
    creatingAccount: "Создаем ваш аккаунт...",
    waitingVerification: "Ожидайте подтверждения аккаунта",
    verificationNote: "После верификации вам будет открыт доступ на сайт",
    
    // Buyer Simple Registration
    buyerRegistration: "Регистрация покупателя",
    
    // OPT ID Display
    yourOptId: "Ваш OPT_ID",
    saveThisId: "Сохраните этот идентификатор",
    
    // Success messages
    success: {
      registrationCompletedTitle: "Регистрация завершена",
      accountCreatedPending: "Ваш аккаунт создан и ожидает верификации"
    },
    
    // Auth messages
    auth: {
      authorizationSuccessTitle: "Успешная авторизация",
      authorizationErrorTitle: "Ошибка авторизации",
      welcome: "Добро пожаловать!"
    },
    
    // Common
    next: "Далее",
    back: "Назад",
    finish: "Завершить",
    loading: "Загрузка...",
    acceptUserAgreementLabel: "Я принимаю Условия использования",
    acceptUserAgreementRequired: "Необходимо принять Условия использования",
    // Locations
    locations: {
      dubai: "Дубай",
      abudhabi: "Абу-Даби",
      sharjah: "Шарджа",
      ajman: "Аджман",
      fujairah: "Фуджейра",
      ras_al_khaimah: "Рас-аль-Хайма",
      umm_al_quwain: "Умм-аль-Кувейн"
    },
    
    // Errors
    errors: {
      nameRequired: "Название магазина обязательно",
      descriptionRequired: "Описание магазина обязательно",
      locationRequired: "Выберите локацию",
      fullNameRequired: "Полное имя обязательно",
      phoneRequired: "Номер телефона обязателен",
      emailRequired: "Email обязателен",
      passwordRequired: "Пароль обязателен",
      passwordTooShort: "Пароль должен быть не менее 6 символов",
      passwordMismatch: "Пароли не совпадают",
      emailInvalid: "Неверный формат email",
      phoneInvalid: "Неверный формат телефона",
      optIdGenerationTitle: "Ошибка генерации OPT_ID",
      optIdGenerationDescription: "Не удалось создать уникальный идентификатор",
      registrationErrorTitle: "Ошибка регистрации",
      registrationErrorDescription: "Произошла ошибка при создании аккаунта"
    }
  },
  
  en: {
    // Step 1: Registration Type Selection
    chooseRegistrationType: "Choose Registration Method",
    telegramRegistration: "Telegram Registration",
    telegramSubtext: "Quick registration via Telegram",
    standardRegistration: "Standard Registration",
    standardSubtext: "Registration with form completion",
    recommended: "Recommended",
    
    // Step 2: Account Type Selection
    chooseAccountType: "Choose Account Type",
    buyerAccount: "Buyer",
    buyerDescription: "Purchase auto parts and goods",
    sellerAccount: "Seller",
    sellerDescription: "Sell auto parts and goods",
    
    // Step 3: OPT ID Generation
    generatingOptId: "Generating OPT_ID for orders",
    optIdGenerated: "Your OPT_ID has been generated",
    optIdNote: "Save this ID - you'll need it for work",
    pendingApproval: "⏳ Pending Approval",
    approvalNote: "Your account will be reviewed by administrators within 1 business day. After approval, you will get full access to the platform.",
    
    // Step 4: Store Information
    storeInformation: "Store Information",
    storeName: "Store Name",
    storeNamePlaceholder: "Enter your store name",
    storeDescription: "Store Description",
    storeDescriptionPlaceholder: "Tell about your store",
    storeLocation: "Location in UAE",
    selectLocation: "Select location",
    
    // Step 5: Personal Information
    personalInformation: "Personal Information",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    phone: "Phone Number",
    phonePlaceholder: "+971 XX XXX XXXX",
    email: "Email",
    emailPlaceholder: "your@email.com",
    password: "Password",
    passwordPlaceholder: "Minimum 6 characters",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Repeat password",
    
    // Step 6: Final Loading
    finalStep: "Completing Registration",
    creatingAccount: "Creating your account...",
    waitingVerification: "Awaiting account verification",
    verificationNote: "After verification, you will gain access to the site",
    
    // Buyer Simple Registration
    buyerRegistration: "Buyer Registration",
    
    // OPT ID Display
    yourOptId: "Your OPT_ID",
    saveThisId: "Save this identifier",
    
    // Success messages
    success: {
      registrationCompletedTitle: "Registration completed",
      accountCreatedPending: "Your account has been created and is awaiting verification"
    },
    
    // Auth messages
    auth: {
      authorizationSuccessTitle: "Authorization successful",
      authorizationErrorTitle: "Authorization error",
      welcome: "Welcome!"
    },
    
    // Common
    next: "Next",
    back: "Back",
    finish: "Complete",
    loading: "Loading...",
    acceptUserAgreementLabel: "I accept the user agreement",
    acceptUserAgreementRequired: "You must accept the user agreement",
    
    // Locations
    locations: {
      dubai: "Dubai",
      abudhabi: "Abu Dhabi",
      sharjah: "Sharjah",
      ajman: "Ajman",
      fujairah: "Fujairah",
      ras_al_khaimah: "Ras Al Khaimah",
      umm_al_quwain: "Umm Al Quwain"
    },
    
    // Errors
    errors: {
      nameRequired: "Store name is required",
      descriptionRequired: "Store description is required",
      locationRequired: "Please select location",
      fullNameRequired: "Full name is required",
      phoneRequired: "Phone number is required",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      passwordTooShort: "Password must be at least 6 characters",
      passwordMismatch: "Passwords do not match",
      emailInvalid: "Invalid email format",
      phoneInvalid: "Invalid phone format",
      optIdGenerationTitle: "OPT_ID generation error",
      optIdGenerationDescription: "Failed to create a unique identifier",
      registrationErrorTitle: "Registration error",
      registrationErrorDescription: "An error occurred while creating the account"
    }
  }
};