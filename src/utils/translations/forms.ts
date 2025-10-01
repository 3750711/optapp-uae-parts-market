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
    carBrand: string;
    carModel: string;
    productPhotos: string;
  };
  placeholders: {
    title: string;
    titleExample: string;
    price: string;
    description: string;
    deliveryPrice: string;
    placeNumber: string;
    placeNumberText: string;
    selectBrand: string;
    selectModel: string;
    firstSelectBrand: string;
    searchBrand: string;
    searchModel: string;
    loadingModels: string;
    modelsNotFound: string;
  };
  buttons: {
    save: string;
    cancel: string;
    publish: string;
    publishing: string;
    addImages: string;
    addVideos: string;
    backToDashboard: string;
    refreshPage: string;
    uploadPhotos: string;
    uploadVideos: string;
    cancelUpload: string;
    smartUpload: string;
    addPhoto: string;
    uploading: string;
    widgetOpen: string;
  };
  messages: {
    productCreated: string;
    productSaved: string;
    imageRequired: string;
    uploadingMedia: string;
    draftLoaded: string;
    draftLoadedDescription: string;
    draftLoadedMobile: string;
    loadingCarData: string;
    carDetected: string;
    carDetectedDescription: string;
    productPublishedSuccess: string;
    refreshPageRequired: string;
    refreshPageGuarantee: string;
    clearDataWithoutRefresh: string;
    loadingForm: string;
    profileLoading: string;
    profileLoadError: string;
  };
  sections: {
    addProduct: string;
    basicInformation: string;
    carInformation: string;
    mediaFiles: string;
    productInformation: string;
    productDescription: string;
    publishProduct: string;
    seller: string;
  };
  optional: string;
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
      pricePositive: 'Цена должна быть нулем или положительным целым числом',
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
      carBrand: 'Марка автомобиля',
      carModel: 'Модель автомобиля',
      productPhotos: 'Фотографии товара',
    },
    placeholders: {
      title: 'Введите название товара',
      titleExample: 'Например: BMW X5 F15 Передний бампер',
      price: '0.00',
      description: 'Описание товара...',
      deliveryPrice: '0.00',
      placeNumber: '1',
      placeNumberText: 'Количество мест',
      selectBrand: 'Выберите марку',
      selectModel: 'Выберите модель',
      firstSelectBrand: 'Сначала выберите марку',
      searchBrand: 'Поиск марки...',
      searchModel: 'Поиск модели...',
      loadingModels: 'Загрузка моделей...',
      modelsNotFound: 'Модели не найдены',
    },
    buttons: {
      save: 'Сохранить',
      cancel: 'Отмена',
      publish: 'Опубликовать',
      publishing: 'Публикация...',
      addImages: 'Добавить изображения',
      addVideos: 'Добавить видео',
      backToDashboard: 'Назад к панели',
      refreshPage: 'Обновить страницу',
      uploadPhotos: 'Загрузить фото',
      uploadVideos: 'Загрузить видео',
      cancelUpload: 'Отменить загрузку',
      smartUpload: 'Умная загрузка...',
      addPhoto: 'Добавить фото',
      uploading: 'Загрузка...',
      widgetOpen: 'Виджет открыт...',
    },
    messages: {
      productCreated: 'Товар успешно создан',
      productSaved: 'Товар сохранен',
      imageRequired: 'Добавьте хотя бы одно изображение',
      uploadingMedia: 'Загрузка медиафайлов...',
      draftLoaded: 'Черновик загружен',
      draftLoadedDescription: 'Загружен сохраненный черновик. Вы можете продолжить заполнение формы.',
      draftLoadedMobile: 'Загружен сохраненный черновик. Продолжите заполнение формы.',
      loadingCarData: 'Загрузка данных о машинах...',
      carDetected: 'Автомобиль обнаружен',
      carDetectedDescription: 'Марка и модель автомобиля определены из названия',
      productPublishedSuccess: 'Товар успешно опубликован! Он сразу доступен покупателям.',
      refreshPageRequired: 'Необходимо обновить страницу для корректной работы приложения.',
      refreshPageGuarantee: 'Обновление гарантирует правильную работу формы.',
      clearDataWithoutRefresh: 'Очистить данные без обновления',
      loadingForm: 'Загрузка формы...',
      profileLoading: 'Загрузка профиля...',
      profileLoadError: 'Ошибка при загрузке профиля',
    },
    sections: {
      addProduct: 'Добавить товар',
      basicInformation: 'Основная информация',
      carInformation: 'Информация об автомобиле',
      mediaFiles: 'Медиафайлы',
      productInformation: 'Информация о товаре',
      productDescription: 'Заполните все поля для создания товара. Товар будет отправлен на модерацию.',
      publishProduct: 'Опубликовать товар',
      seller: 'Продавец',
    },
    optional: '(опционально)',
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
      pricePositive: 'Price must be zero or a positive integer',
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
      carBrand: 'Car Brand',
      carModel: 'Car Model',
      productPhotos: 'Product Photos',
    },
    placeholders: {
      title: 'Enter product title',
      titleExample: 'For example: BMW X5 F15 Front Bumper',
      price: '0.00',
      description: 'Product description...',
      deliveryPrice: '0.00',
      placeNumber: '1',
      placeNumberText: 'Number of places',
      selectBrand: 'Select brand',
      selectModel: 'Select model',
      firstSelectBrand: 'First select brand',
      searchBrand: 'Search brand...',
      searchModel: 'Search model...',
      loadingModels: 'Loading models...',
      modelsNotFound: 'Models not found',
    },
    buttons: {
      save: 'Save',
      cancel: 'Cancel',
      publish: 'Publish',
      publishing: 'Publishing...',
      addImages: 'Add Images',
      addVideos: 'Add Videos',
      backToDashboard: 'Back to Dashboard',
      refreshPage: 'Refresh Page',
      uploadPhotos: 'Upload Photos',
      uploadVideos: 'Upload Videos',
      cancelUpload: 'Cancel Upload',
      smartUpload: 'Smart Upload...',
      addPhoto: 'Add Photo',
      uploading: 'Uploading...',
      widgetOpen: 'Widget Open...',
    },
    messages: {
      productCreated: 'Product successfully created',
      productSaved: 'Product saved',
      imageRequired: 'Add at least one image',
      uploadingMedia: 'Uploading media...',
      draftLoaded: 'Draft loaded',
      draftLoadedDescription: 'Saved draft loaded. You can continue filling out the form.',
      draftLoadedMobile: 'Saved draft loaded. Continue filling out the form.',
      loadingCarData: 'Loading car data...',
      carDetected: 'Car Detected',
      carDetectedDescription: 'Car brand and model determined from title',
      productPublishedSuccess: 'Product published successfully! It is immediately available to buyers.',
      refreshPageRequired: 'Page refresh is required for proper application functionality.',
      refreshPageGuarantee: 'Refresh ensures proper form functionality.',
      clearDataWithoutRefresh: 'Clear data without refresh',
      loadingForm: 'Loading form...',
      profileLoading: 'Loading profile...',
      profileLoadError: 'Error loading profile',
    },
    sections: {
      addProduct: 'Add Product',
      basicInformation: 'Basic Information',
      carInformation: 'Car Information',
      mediaFiles: 'Media Files',
      productInformation: 'Product Information',
      productDescription: 'Fill in all fields to create a product. The product will be sent for moderation.',
      publishProduct: 'Publish Product',
      seller: 'Seller',
    },
    optional: '(optional)',
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
      pricePositive: 'দাম শূন্য বা ধনাত্মক পূর্ণ সংখ্যা হতে হবে',
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
      carBrand: 'গাড়ির ব্র্যান্ড',
      carModel: 'গাড়ির মডেল',
      productPhotos: 'পণ্যের ছবি',
    },
    placeholders: {
      title: 'পণ্যের শিরোনাম লিখুন',
      titleExample: 'উদাহরণ: BMW X5 F15 সামনের বাম্পার',
      price: '0.00',
      description: 'পণ্যের বিবরণ...',
      deliveryPrice: '0.00',
      placeNumber: '1',
      placeNumberText: 'স্থানের সংখ্যা',
      selectBrand: 'ব্র্যান্ড নির্বাচন করুন',
      selectModel: 'মডেল নির্বাচন করুন',
      firstSelectBrand: 'প্রথমে ব্র্যান্ড নির্বাচন করুন',
      searchBrand: 'ব্র্যান্ড অনুসন্ধান...',
      searchModel: 'মডেল অনুসন্ধান...',
      loadingModels: 'মডেল লোড করা হচ্ছে...',
      modelsNotFound: 'মডেল পাওয়া যায়নি',
    },
    buttons: {
      save: 'সংরক্ষণ',
      cancel: 'বাতিল',
      publish: 'প্রকাশ',
      publishing: 'প্রকাশ করা হচ্ছে...',
      addImages: 'ছবি যোগ করুন',
      addVideos: 'ভিডিও যোগ করুন',
      backToDashboard: 'ড্যাশবোর্ডে ফিরুন',
      refreshPage: 'পৃষ্ঠা রিফ্রেশ করুন',
      uploadPhotos: 'ছবি আপলোড করুন',
      uploadVideos: 'ভিডিও আপলোড করুন',
      cancelUpload: 'আপলোড বাতিল করুন',
      smartUpload: 'স্মার্ট আপলোড...',
      addPhoto: 'ছবি যোগ করুন',
      uploading: 'আপলোড হচ্ছে...',
      widgetOpen: 'উইজেট খোলা আছে...',
    },
    messages: {
      productCreated: 'পণ্য সফলভাবে তৈরি',
      productSaved: 'পণ্য সংরক্ষিত',
      imageRequired: 'অন্তত একটি ছবি যোগ করুন',
      uploadingMedia: 'মিডিয়া আপলোড করা হচ্ছে...',
      draftLoaded: 'খসড়া লোড হয়েছে',
      draftLoadedDescription: 'সংরক্ষিত খসড়া লোড হয়েছে। আপনি ফর্ম পূরণ করা চালিয়ে যেতে পারেন।',
      draftLoadedMobile: 'সংরক্ষিত খসড়া লোড হয়েছে। ফর্ম পূরণ করা চালিয়ে যান।',
      loadingCarData: 'গাড়ির তথ্য লোড করা হচ্ছে...',
      carDetected: 'গাড়ি শনাক্ত করা হয়েছে',
      carDetectedDescription: 'শিরোনাম থেকে গাড়ির ব্র্যান্ড এবং মডেল নির্ধারণ করা হয়েছে',
      productPublishedSuccess: 'পণ্য সফলভাবে প্রকাশিত হয়েছে! এটি অবিলম্বে ক্রেতাদের কাছে উপলব্ধ।',
      refreshPageRequired: 'সঠিক অ্যাপ্লিকেশন কার্যকারিতার জন্য পৃষ্ঠা রিফ্রেশ প্রয়োজন।',
      refreshPageGuarantee: 'রিফ্রেশ সঠিক ফর্ম কার্যকারিতা নিশ্চিত করে।',
      clearDataWithoutRefresh: 'রিফ্রেশ ছাড়াই ডেটা পরিষ্কার করুন',
      loadingForm: 'ফর্ম লোড হচ্ছে...',
      profileLoading: 'প্রোফাইল লোড হচ্ছে...',
      profileLoadError: 'প্রোফাইল লোডে ত্রুটি',
    },
    sections: {
      addProduct: 'পণ্য যোগ করুন',
      basicInformation: 'মৌলিক তথ্য',
      carInformation: 'গাড়ির তথ্য',
      mediaFiles: 'মিডিয়া ফাইল',
      productInformation: 'পণ্যের তথ্য',
      productDescription: 'একটি পণ্য তৈরি করতে সমস্ত ক্ষেত্র পূরণ করুন। পণ্যটি পরিমার্জনের জন্য পাঠানো হবে।',
      publishProduct: 'পণ্য প্রকাশ করুন',
      seller: 'বিক্রেতা',
    },
    optional: '(ঐচ্ছিক)',
  },
};

// Product validation messages
export interface ProductValidationMessages {
  titleMinLength: string;
  priceRequired: string;
  priceInvalid: string;
  brandRequired: string;
  placesRequired: string;
  placesInvalid: string;
  deliveryPriceInvalid: string;
}

const productValidationRu: ProductValidationMessages = {
  titleMinLength: 'Название должно содержать не менее 3 символов',
  priceRequired: 'Укажите цену товара',
  priceInvalid: 'Цена должна быть нулем или положительным целым числом',
  brandRequired: 'Выберите марку автомобиля',
  placesRequired: 'Укажите количество мест',
  placesInvalid: 'Количество мест должно быть положительным целым числом',
  deliveryPriceInvalid: 'Стоимость доставки должна быть числом',
};

const productValidationEn: ProductValidationMessages = {
  titleMinLength: 'Title must contain at least 3 characters',
  priceRequired: 'Please specify product price',
  priceInvalid: 'Price must be zero or a positive integer',
  brandRequired: 'Please select car brand',
  placesRequired: 'Please specify number of places',
  placesInvalid: 'Number of places must be a positive integer',
  deliveryPriceInvalid: 'Delivery cost must be a number',
};

const productValidationBn: ProductValidationMessages = {
  titleMinLength: 'শিরোনাম কমপক্ষে ৩টি অক্ষর থাকতে হবে',
  priceRequired: 'দয়া করে পণ্যের মূল্য নির্দিষ্ট করুন',
  priceInvalid: 'মূল্য শূন্য বা ধনাত্মক পূর্ণ সংখ্যা হতে হবে',
  brandRequired: 'দয়া করে গাড়ির ব্র্যান্ড নির্বাচন করুন',
  placesRequired: 'দয়া করে জায়গার সংখ্যা নির্দিষ্ট করুন',
  placesInvalid: 'জায়গার সংখ্যা একটি ধনাত্মক পূর্ণ সংখ্যা হতে হবে',
  deliveryPriceInvalid: 'ডেলিভারির খরচ একটি সংখ্যা হতে হবে',
};

export const productValidationTranslations: Record<Lang, ProductValidationMessages> = {
  ru: productValidationRu,
  en: productValidationEn,
  bn: productValidationBn,
};

export const getProductValidationMessages = (lang: Lang): ProductValidationMessages => {
  return productValidationTranslations[lang] || productValidationTranslations.en;
};

export const getFormTranslations = (language: Lang): FormTranslations => {
  return formTranslations[language] || formTranslations.en;
};

export default getFormTranslations;