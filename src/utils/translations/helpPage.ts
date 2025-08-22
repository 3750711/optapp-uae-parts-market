import { Lang } from '@/types/i18n';

export interface HelpPageTranslations {
  // Page title and meta
  title: string;
  description: string;
  helpAndSupport: string;
  findAnswersOrContact: string;
  
  // Search
  searchPlaceholder: string;
  
  // FAQ section
  faqTitle: string;
  loadingFaq: string;
  errorLoadingFaq: string;
  noResults: string;
  emptyFaq: string;
  
  // Contact section
  contactUs: string;
  phone: string;
  email: string;
  workingHours: string;
  mondayFriday: string;
  saturday: string;
  sunday: string;
  
  // Contact form
  feedback: string;
  yourName: string;
  emailAddress: string;
  messageSubject: string;
  yourMessage: string;
  sendMessage: string;
  messageSent: string;
  messageDescription: string;
  
  // Support links
  askAdmin: string;
}

const ru: HelpPageTranslations = {
  // Page title and meta
  title: 'Помощь и поддержка',
  description: 'Получите помощь и поддержку для всех ваших вопросов.',
  helpAndSupport: 'Помощь и поддержка',
  findAnswersOrContact: 'Найдите ответы на часто задаваемые вопросы или свяжитесь с нами',
  
  // Search
  searchPlaceholder: 'Поиск по FAQ...',
  
  // FAQ section
  faqTitle: 'Часто задаваемые вопросы',
  loadingFaq: 'Загрузка FAQ...',
  errorLoadingFaq: 'Ошибка при загрузке FAQ. Попробуйте обновить страницу.',
  noResults: 'По вашему запросу ничего не найдено',
  emptyFaq: 'FAQ пуст',
  
  // Contact section
  contactUs: 'Связаться с нами',
  phone: 'Телефон',
  email: 'Email',
  workingHours: 'Время работы',
  mondayFriday: 'Пн-Пт: 9:00 - 18:00',
  saturday: 'Сб: 9:00 - 15:00',
  sunday: 'Вс: выходной',
  
  // Contact form
  feedback: 'Обратная связь',
  yourName: 'Ваше имя',
  emailAddress: 'Email',
  messageSubject: 'Тема сообщения',
  yourMessage: 'Ваше сообщение',
  sendMessage: 'Отправить сообщение',
  messageSent: 'Сообщение отправлено',
  messageDescription: 'Мы ответим вам в течение 24 часов',
  
  // Support links
  askAdmin: 'Спросить у администратора'
};

const en: HelpPageTranslations = {
  // Page title and meta
  title: 'Help & Support',
  description: 'Get help and support for all your questions.',
  helpAndSupport: 'Help & Support',
  findAnswersOrContact: 'Find answers to frequently asked questions or contact us',
  
  // Search
  searchPlaceholder: 'Search FAQ...',
  
  // FAQ section
  faqTitle: 'Frequently Asked Questions',
  loadingFaq: 'Loading FAQ...',
  errorLoadingFaq: 'Error loading FAQ. Please refresh the page.',
  noResults: 'No results found for your query',
  emptyFaq: 'FAQ is empty',
  
  // Contact section
  contactUs: 'Contact Us',
  phone: 'Phone',
  email: 'Email',
  workingHours: 'Working Hours',
  mondayFriday: 'Mon-Fri: 9:00 - 18:00',
  saturday: 'Sat: 9:00 - 15:00',
  sunday: 'Sun: Closed',
  
  // Contact form
  feedback: 'Feedback',
  yourName: 'Your Name',
  emailAddress: 'Email',
  messageSubject: 'Message Subject',
  yourMessage: 'Your Message',
  sendMessage: 'Send Message',
  messageSent: 'Message Sent',
  messageDescription: 'We will respond within 24 hours',
  
  // Support links
  askAdmin: 'Ask Administrator'
};

const bn: HelpPageTranslations = {
  // Page title and meta
  title: 'সাহায্য ও সহায়তা',
  description: 'আপনার সকল প্রশ্নের জন্য সাহায্য এবং সহায়তা পান।',
  helpAndSupport: 'সাহায্য ও সহায়তা',
  findAnswersOrContact: 'প্রায়শই জিজ্ঞাসিত প্রশ্নের উত্তর খুঁজুন বা আমাদের সাথে যোগাযোগ করুন',
  
  // Search
  searchPlaceholder: 'FAQ খুঁজুন...',
  
  // FAQ section
  faqTitle: 'প্রায়শই জিজ্ঞাসিত প্রশ্ন',
  loadingFaq: 'FAQ লোড হচ্ছে...',
  errorLoadingFaq: 'FAQ লোড করতে ত্রুটি। পৃষ্ঠাটি রিফ্রেশ করার চেষ্টা করুন।',
  noResults: 'আপনার অনুসন্ধানের জন্য কোন ফলাফল পাওয়া যায়নি',
  emptyFaq: 'FAQ খালি',
  
  // Contact section
  contactUs: 'আমাদের সাথে যোগাযোগ',
  phone: 'ফোন',
  email: 'ইমেইল',
  workingHours: 'কর্মসময়',
  mondayFriday: 'সোম-শুক্র: ৯:০০ - ১৮:০০',
  saturday: 'শনি: ৯:০০ - ১৫:০০',
  sunday: 'রবি: বন্ধ',
  
  // Contact form
  feedback: 'মতামত',
  yourName: 'আপনার নাম',
  emailAddress: 'ইমেইল',
  messageSubject: 'বার্তার বিষয়',
  yourMessage: 'আপনার বার্তা',
  sendMessage: 'বার্তা পাঠান',
  messageSent: 'বার্তা পাঠানো হয়েছে',
  messageDescription: 'আমরা ২৪ ঘন্টার মধ্যে উত্তর দেব',
  
  // Support links
  askAdmin: 'প্রশাসকের কাছে জিজ্ঞাসা করুন'
};

export const helpPageTranslations: Record<Lang, HelpPageTranslations> = {
  ru,
  en,
  bn
};

export const getHelpPageTranslations = (lang: Lang): HelpPageTranslations => {
  return helpPageTranslations[lang] || helpPageTranslations.en;
};

export default getHelpPageTranslations;