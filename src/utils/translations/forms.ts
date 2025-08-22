import { Lang } from '@/types/i18n';

export interface FormTranslations {
  validation: {
    required: string;
    invalidEmail: string;
    tooShort: string;
    tooLong: string;
    invalidNumber: string;
    minValue: string;
    maxValue: string;
    titleRequired: string;
    priceRequired: string;
    pricePositive: string;
    deliveryPricePositive: string;
    placeNumberPositive: string;
  };
  labels: {
    title: string;
    price: string;
    brand: string;
    model: string;
    description: string;
    deliveryPrice: string;
    placeNumber: string;
    images: string;
    videos: string;
  };
  placeholders: {
    title: string;
    price: string;
    description: string;
    deliveryPrice: string;
    placeNumber: string;
  };
  buttons: {
    save: string;
    cancel: string;
    publish: string;
    addImages: string;
    addVideos: string;
  };
  messages: {
    productCreated: string;
    productSaved: string;
    imageRequired: string;
    uploadingMedia: string;
  };
}

const formTranslations: Record<Lang, FormTranslations> = {
  ru: {
    validation: {
      required: 'Это поле обязательно',
      invalidEmail: 'Неверный формат email',
      tooShort: 'Значение слишком короткое',
      tooLong: 'Значение слишком длинное',
      invalidNumber: 'Неверный формат числа',
      minValue: 'Значение должно быть больше 0',
      maxValue: 'Значение слишком большое',
      titleRequired: 'Название товара обязательно',
      priceRequired: 'Цена обязательна',
      pricePositive: 'Цена должна быть больше 0',
      deliveryPricePositive: 'Стоимость доставки должна быть больше или равна 0',
      placeNumberPositive: 'Номер места должен быть больше 0',
    },
    labels: {
      title: 'Название товара',
      price: 'Цена ($)',
      brand: 'Марка',
      model: 'Модель',
      description: 'Описание',
      deliveryPrice: 'Стоимость доставки ($)',
      placeNumber: 'Номер места',
      images: 'Изображения',
      videos: 'Видео',
    },
    placeholders: {
      title: 'Введите название товара',
      price: '0.00',
      description: 'Описание товара...',
      deliveryPrice: '0.00',
      placeNumber: '1',
    },
    buttons: {
      save: 'Сохранить',
      cancel: 'Отмена',
      publish: 'Опубликовать',
      addImages: 'Добавить изображения',
      addVideos: 'Добавить видео',
    },
    messages: {
      productCreated: 'Товар успешно создан',
      productSaved: 'Товар сохранен',
      imageRequired: 'Добавьте хотя бы одно изображение',
      uploadingMedia: 'Загрузка медиафайлов...',
    },
  },
  en: {
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email format',
      tooShort: 'Value is too short',
      tooLong: 'Value is too long',
      invalidNumber: 'Invalid number format',
      minValue: 'Value must be greater than 0',
      maxValue: 'Value is too large',
      titleRequired: 'Product title is required',
      priceRequired: 'Price is required',
      pricePositive: 'Price must be greater than 0',
      deliveryPricePositive: 'Delivery price must be greater than or equal to 0',
      placeNumberPositive: 'Place number must be greater than 0',
    },
    labels: {
      title: 'Product Title',
      price: 'Price ($)',
      brand: 'Brand',
      model: 'Model',
      description: 'Description',
      deliveryPrice: 'Delivery Price ($)',
      placeNumber: 'Place Number',
      images: 'Images',
      videos: 'Videos',
    },
    placeholders: {
      title: 'Enter product title',
      price: '0.00',
      description: 'Product description...',
      deliveryPrice: '0.00',
      placeNumber: '1',
    },
    buttons: {
      save: 'Save',
      cancel: 'Cancel',
      publish: 'Publish',
      addImages: 'Add Images',
      addVideos: 'Add Videos',
    },
    messages: {
      productCreated: 'Product successfully created',
      productSaved: 'Product saved',
      imageRequired: 'Add at least one image',
      uploadingMedia: 'Uploading media...',
    },
  },
  bn: {
    validation: {
      required: 'এই ক্ষেত্রটি আবশ্যক',
      invalidEmail: 'অবৈধ ইমেইল বিন্যাস',
      tooShort: 'মান খুব ছোট',
      tooLong: 'মান খুব দীর্ঘ',
      invalidNumber: 'অবৈধ সংখ্যার বিন্যাস',
      minValue: 'মান 0 এর চেয়ে বড় হতে হবে',
      maxValue: 'মান খুব বড়',
      titleRequired: 'পণ্যের শিরোনাম আবশ্যক',
      priceRequired: 'দাম আবশ্যক',
      pricePositive: 'দাম 0 এর চেয়ে বড় হতে হবে',
      deliveryPricePositive: 'ডেলিভারি মূল্য 0 এর চেয়ে বড় বা সমান হতে হবে',
      placeNumberPositive: 'স্থান নম্বর 0 এর চেয়ে বড় হতে হবে',
    },
    labels: {
      title: 'পণ্যের শিরোনাম',
      price: 'দাম ($)',
      brand: 'ব্র্যান্ড',
      model: 'মডেল',
      description: 'বিবরণ',
      deliveryPrice: 'ডেলিভারি মূল্য ($)',
      placeNumber: 'স্থান নম্বর',
      images: 'ছবি',
      videos: 'ভিডিও',
    },
    placeholders: {
      title: 'পণ্যের শিরোনাম লিখুন',
      price: '0.00',
      description: 'পণ্যের বিবরণ...',
      deliveryPrice: '0.00',
      placeNumber: '1',
    },
    buttons: {
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      publish: 'প্রকাশ',
      addImages: 'ছবি যোগ করুন',
      addVideos: 'ভিডিও যোগ করুন',
    },
    messages: {
      productCreated: 'পণ্য সফলভাবে তৈরি',
      productSaved: 'পণ্য সংরক্ষিত',
      imageRequired: 'অন্তত একটি ছবি যোগ করুন',
      uploadingMedia: 'মিডিয়া আপলোড করা হচ্ছে...',
    },
  },
};

export const getFormTranslations = (language: Lang): FormTranslations => {
  return formTranslations[language];
};

export default getFormTranslations;