import { Lang } from '@/types/i18n';

export interface AuthPromptTranslations {
  overlayTitle: string;
  overlayDescription: string;
  loginButton: string;
  registerButton: string;
  closeButton: string;
  priceTooltip: string;
  sellerTooltip: string;
  contactTooltip: string;
  priceHidden: string;
  sellerInfo: string;
  sellerContacts: string;
  loginToSeePrice: string;
  loginToSeeSeller: string;
  addToCart: string;
  makeOffer: string;
  delivery: string;
  sellerRestriction: string;
  upgradeToBuyer: string;
}

export const authPrompt: Record<Lang, AuthPromptTranslations> = {
  ru: {
    overlayTitle: "Войдите для доступа",
    overlayDescription: "Откройте цены и контакты продавцов",
    loginButton: "Войти",
    registerButton: "Регистрация",
    closeButton: "Закрыть",
    priceTooltip: "Войдите, чтобы увидеть цену",
    sellerTooltip: "Войдите, чтобы узнать продавца",
    contactTooltip: "Войдите для контактов",
    priceHidden: "Войдите для просмотра",
    sellerInfo: "Информация о продавце",
    sellerContacts: "Контакты продавца",
    loginToSeePrice: "Войдите, чтобы увидеть цену товара",
    loginToSeeSeller: "Войдите, чтобы узнать продавца",
    addToCart: "В корзину",
    makeOffer: "Сделать предложение",
    delivery: "Доставка:",
    sellerRestriction: "Доступно только для покупателей",
    upgradeToBuyer: "Переключитесь на аккаунт покупателя"
  },
  en: {
    overlayTitle: "Sign in for access",
    overlayDescription: "See prices and seller contacts",
    loginButton: "Sign in",
    registerButton: "Sign up",
    closeButton: "Close",
    priceTooltip: "Sign in to see price",
    sellerTooltip: "Sign in to see seller",
    contactTooltip: "Sign in for contacts",
    priceHidden: "Sign in to view",
    sellerInfo: "Seller information",
    sellerContacts: "Seller contacts",
    loginToSeePrice: "Sign in to see product price",
    loginToSeeSeller: "Sign in to see seller",
    addToCart: "Add to cart",
    makeOffer: "Make an offer",
    delivery: "Delivery:",
    sellerRestriction: "Available for buyers only",
    upgradeToBuyer: "Switch to buyer account"
  },
  bn: {
    overlayTitle: "অ্যাক্সেসের জন্য সাইন ইন করুন",
    overlayDescription: "মূল্য এবং বিক্রেতার যোগাযোগ দেখুন",
    loginButton: "সাইন ইন",
    registerButton: "নিবন্ধন",
    closeButton: "বন্ধ",
    priceTooltip: "মূল্য দেখতে সাইন ইন করুন",
    sellerTooltip: "বিক্রেতা দেখতে সাইন ইন করুন",
    contactTooltip: "যোগাযোগের জন্য সাইন ইন করুন",
    priceHidden: "দেখতে সাইন ইন করুন",
    sellerInfo: "বিক্রেতার তথ্য",
    sellerContacts: "বিক্রেতার যোগাযোগ",
    loginToSeePrice: "পণ্যের মূল্য দেখতে সাইন ইন করুন",
    loginToSeeSeller: "বিক্রেতা দেখতে সাইন ইন করুন",
    addToCart: "কার্টে যোগ করুন",
    makeOffer: "অফার করুন",
    delivery: "ডেলিভারি:",
    sellerRestriction: "শুধুমাত্র ক্রেতাদের জন্য উপলব্ধ",
    upgradeToBuyer: "ক্রেতা অ্যাকাউন্টে স্যুইচ করুন"
  }
};
