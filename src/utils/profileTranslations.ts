export const profileTranslations = {
  ru: {
    // Profile page
    myProfile: "Мой профиль",
    back: "Назад",
    signOut: "Выйти из аккаунта",
    profileUpdated: "Профиль обновлен",
    profileUpdatedDesc: "Ваши данные успешно сохранены",
    noChanges: "Без изменений",
    noChangesDesc: "Нет изменений для сохранения",
    updateError: "Ошибка обновления",
    optIdError: "OPT ID уже используется другим пользователем",
    signOutConfirm: "Выйти из аккаунта",
    signOutConfirmDesc: "Вы уверены, что хотите выйти из аккаунта?",
    cancel: "Отмена",
    signOutBtn: "Выйти",
    signOutSuccess: "Вы вышли из аккаунта",
    signOutSuccessDesc: "До свидания!",
    signOutError: "Ошибка выхода",
    signOutErrorDesc: "Не удалось выйти из аккаунта. Пожалуйста, попробуйте снова.",
    retryLoad: "Попробовать снова",
    profileLoadError: "Не удалось загрузить профиль",
    
    // Profile form
    profileData: "Данные профиля",
    fullName: "Имя и фамилия",
    email: "Электронная почта",
    phone: "Телефон",
    companyName: "Название компании",
    telegram: "Telegram",
    userType: "Тип пользователя",
    description: "Описание профиля",
    saveChanges: "Сохранить изменения",
    changeEmail: "Изменить Email",
    
    // Profile stats
    profileStats: "Статистика профиля",
    activeListings: "Активные объявления",
    totalOrders: "Всего заказов",
    completedOrders: "Выполненные заказы",
    pendingOrders: "В обработке",
    rating: "Рейтинг",
    daysOnPlatform: "Дней на платформе",
    contactAdmin: "Связаться с админом",
    
    // Profile progress
    profileCompletion: "Заполненность профиля",
    progress: "Прогресс",
    completed: "Заполнено",
    recommendedToFill: "Рекомендуется заполнить",
    
    // Profile header
    userProfile: "Профиль пользователя",
    seller: "Продавец",
    buyer: "Покупатель",
    verified: "Проверено",
    pendingVerification: "Ожидает проверки",
    avatarUpdated: "Фото обновлено",
    avatarUpdatedDesc: "Ваш аватар успешно обновлен",
    uploadError: "Ошибка загрузки",
    selectImage: "Пожалуйста, выберите изображение",
    fileSizeError: "Размер файла не должен превышать 2МБ",
    
    // Profile info
    accountInfo: "Информация аккаунта",
    registrationDate: "Дата регистрации",
    lastLogin: "Последний вход",
    listingCount: "Количество объявлений",
    sellerRating: "Рейтинг продавца",
    noRatingsYet: "Пока нет оценок"
  },
  en: {
    // Profile page
    myProfile: "My Profile",
    back: "Back",
    signOut: "Sign Out",
    profileUpdated: "Profile Updated",
    profileUpdatedDesc: "Your data has been successfully saved",
    noChanges: "No Changes",
    noChangesDesc: "No changes to save",
    updateError: "Update Error",
    optIdError: "OPT ID is already used by another user",
    signOutConfirm: "Sign Out",
    signOutConfirmDesc: "Are you sure you want to sign out?",
    cancel: "Cancel",
    signOutBtn: "Sign Out",
    signOutSuccess: "You have signed out",
    signOutSuccessDesc: "Goodbye!",
    signOutError: "Sign Out Error",
    signOutErrorDesc: "Failed to sign out. Please try again.",
    retryLoad: "Try Again",
    profileLoadError: "Failed to load profile",
    
    // Profile form
    profileData: "Profile Data",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    companyName: "Company Name",
    telegram: "Telegram",
    userType: "User Type",
    description: "Profile Description",
    saveChanges: "Save Changes",
    changeEmail: "Change Email",
    
    // Profile stats
    profileStats: "Profile Statistics",
    activeListings: "Active Listings",
    totalOrders: "Total Orders",
    completedOrders: "Completed Orders",
    pendingOrders: "Pending Orders",
    rating: "Rating",
    daysOnPlatform: "Days on Platform",
    contactAdmin: "Contact Admin",
    
    // Profile progress
    profileCompletion: "Profile Completion",
    progress: "Progress",
    completed: "Completed",
    recommendedToFill: "Recommended to Fill",
    
    // Profile header
    userProfile: "User Profile",
    seller: "Seller",
    buyer: "Buyer",
    verified: "Verified",
    pendingVerification: "Pending Verification",
    avatarUpdated: "Photo Updated",
    avatarUpdatedDesc: "Your avatar has been successfully updated",
    uploadError: "Upload Error",
    selectImage: "Please select an image",
    fileSizeError: "File size should not exceed 2MB",
    
    // Profile info
    accountInfo: "Account Information",
    registrationDate: "Registration Date",
    lastLogin: "Last Login",
    listingCount: "Number of Listings",
    sellerRating: "Seller Rating",
    noRatingsYet: "No ratings yet"
  }
};

export const getProfileTranslations = (userType: string) => {
  return userType === 'seller' ? profileTranslations.en : profileTranslations.ru;
};