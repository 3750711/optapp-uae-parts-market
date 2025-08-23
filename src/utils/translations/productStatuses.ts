export interface ProductStatusTranslations {
  statuses: {
    active: string;
    sold: string;
    archived: string;
    pending: string;
  };
  markSoldDialog: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
    processing: string;
    successMessage: string;
    errorMessage: string;
  };
  actions: {
    markSold: string;
    markSoldShort: string;
    archive: string;
    restore: string;
    edit: string;
    viewOffers: string;
    share: string;
  };
}

export const getProductStatusTranslations = (language: 'ru' | 'en' | 'bn'): ProductStatusTranslations => {
  const translations: Record<string, ProductStatusTranslations> = {
    ru: {
      statuses: {
        active: "Активный",
        sold: "Продан",
        archived: "В архиве",
        pending: "На рассмотрении"
      },
      markSoldDialog: {
        title: "Подтвердить действие",
        description: "Вы уверены, что хотите отметить товар как проданный? Это действие нельзя отменить.",
        cancel: "Отмена",
        confirm: "Подтвердить",
        processing: "Обработка...",
        successMessage: "Статус товара успешно изменен на 'Продан'",
        errorMessage: "Ошибка при изменении статуса товара"
      },
      actions: {
        markSold: "Отметить проданным",
        markSoldShort: "Продан",
        archive: "В архив",
        restore: "Восстановить",
        edit: "Редактировать",
        viewOffers: "Посмотреть предложения",
        share: "Поделиться"
      }
    },
    en: {
      statuses: {
        active: "Active",
        sold: "Sold",
        archived: "Archived",
        pending: "Pending"
      },
      markSoldDialog: {
        title: "Confirm Action",
        description: "Are you sure you want to mark this product as sold? This action cannot be undone.",
        cancel: "Cancel",
        confirm: "Confirm",
        processing: "Processing...",
        successMessage: "Product status successfully changed to 'Sold'",
        errorMessage: "Error changing product status"
      },
      actions: {
        markSold: "Mark Sold",
        markSoldShort: "Sold",
        archive: "Archive",
        restore: "Restore",
        edit: "Edit",
        viewOffers: "View Offers",
        share: "Share"
      }
    },
    bn: {
      statuses: {
        active: "সক্রিয়",
        sold: "বিক্রিত",
        archived: "সংরক্ষণাগারে",
        pending: "অপেক্ষমাণ"
      },
      markSoldDialog: {
        title: "কর্ম নিশ্চিত করুন",
        description: "আপনি কি নিশ্চিত যে এই পণ্যটি বিক্রিত হিসেবে চিহ্নিত করতে চান? এই কর্মটি পূর্বাবস্থায় ফেরানো যাবে না।",
        cancel: "বাতিল",
        confirm: "নিশ্চিত করুন",
        processing: "প্রক্রিয়াকরণ...",
        successMessage: "পণ্যের অবস্থা সফলভাবে 'বিক্রিত' এ পরিবর্তিত হয়েছে",
        errorMessage: "পণ্যের অবস্থা পরিবর্তনে ত্রুটি"
      },
      actions: {
        markSold: "বিক্রিত চিহ্নিত করুন",
        markSoldShort: "বিক্রিত",
        archive: "সংরক্ষণাগার",
        restore: "পুনরুদ্ধার",
        edit: "সম্পাদনা",
        viewOffers: "অফারগুলি দেখুন",
        share: "শেয়ার করুন"
      }
    }
  };

  return translations[language] || translations.ru;
};