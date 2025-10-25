export interface AuthPromptTranslations {
  overlayTitle: string;
  overlayDescription: string;
  loginButton: string;
  registerButton: string;
  priceHidden: string;
  sellerHidden: string;
  contactsHidden: string;
  loginToSee: string;
  loginToSeePrice: string;
  loginToSeeSeller: string;
  loginToSeeContacts: string;
  ratingHidden: string;
}

const translations: Record<'ru' | 'en' | 'bn', AuthPromptTranslations> = {
  ru: {
    overlayTitle: '🔓 Войдите, чтобы увидеть детали',
    overlayDescription: 'Цены и контакты продавцов доступны только зарегистрированным пользователям',
    loginButton: 'Войти',
    registerButton: 'Регистрация',
    priceHidden: 'Цена скрыта',
    sellerHidden: 'Имя продавца скрыто',
    contactsHidden: 'Контакты скрыты',
    loginToSee: 'Войдите, чтобы увидеть',
    loginToSeePrice: 'Войдите, чтобы увидеть цену',
    loginToSeeSeller: 'Войдите, чтобы увидеть информацию о продавце',
    loginToSeeContacts: 'Войдите, чтобы связаться с продавцом',
    ratingHidden: 'Рейтинг скрыт'
  },
  en: {
    overlayTitle: '🔓 Log in to see details',
    overlayDescription: 'Prices and seller contacts are available only to registered users',
    loginButton: 'Log in',
    registerButton: 'Sign up',
    priceHidden: 'Price hidden',
    sellerHidden: 'Seller name hidden',
    contactsHidden: 'Contacts hidden',
    loginToSee: 'Log in to see',
    loginToSeePrice: 'Log in to see the price',
    loginToSeeSeller: 'Log in to see seller information',
    loginToSeeContacts: 'Log in to contact the seller',
    ratingHidden: 'Rating hidden'
  },
  bn: {
    overlayTitle: '🔓 বিস্তারিত দেখতে লগইন করুন',
    overlayDescription: 'মূল্য এবং বিক্রেতার যোগাযোগ শুধুমাত্র নিবন্ধিত ব্যবহারকারীদের জন্য উপলব্ধ',
    loginButton: 'লগইন',
    registerButton: 'নিবন্ধন',
    priceHidden: 'মূল্য লুকানো',
    sellerHidden: 'বিক্রেতার নাম লুকানো',
    contactsHidden: 'যোগাযোগ লুকানো',
    loginToSee: 'দেখতে লগইন করুন',
    loginToSeePrice: 'মূল্য দেখতে লগইন করুন',
    loginToSeeSeller: 'বিক্রেতার তথ্য দেখতে লগইন করুন',
    loginToSeeContacts: 'বিক্রেতার সাথে যোগাযোগ করতে লগইন করুন',
    ratingHidden: 'রেটিং লুকানো'
  }
};

export const getAuthPromptTranslations = (language: 'ru' | 'en' | 'bn' = 'ru'): AuthPromptTranslations => {
  return translations[language] || translations.ru;
};
