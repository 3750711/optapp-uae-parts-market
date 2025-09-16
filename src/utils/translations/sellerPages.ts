import { Lang } from '@/types/i18n';

export interface SellerPagesTranslations {
  // General
  loading: string;
  error: string;
  back: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  view: string;
  refresh: string;
  retry: string;
  
  // Navigation
  dashboard: string;
  profile: string;
  listings: string;
  orders: string;
  navigation_priceOffers: string;
  addProduct: string;
  sellProduct: string;
  
  // SellerProfile
  sellerDashboard: string;
  yourStore: string;
  verified: string;
  manageStore: string;
  viewStore: string;
  storeNotLoaded: string;
  refreshingData: string;
  loadingStoreInfo: string;
  
  // SellerListings
  sellerListings: string;
  pendingFirst: string;
  manageListing: string;
  pendingModeration: string;
  
  // SellerCreateOrder  
  createOrder: string;
  fillOrderInfo: string;
  creatingOrder: string;
  orderCreated: string;
  
  // SellerCreateOrder - Form sections
  createOrderForm: {
    mainOrderInformation: string;
    buyer: string;
    orderDetails: string;
    productTitle: string;
    productTitlePlaceholder: string;
    brand: string;
    brandPlaceholder: string;
    model: string;
    modelPlaceholder: string;
    modelPlaceholderFirst: string;
    productPrice: string;
    deliveryCost: string;
    buyerOptId: string;
    buyerPlaceholder: string;
    deliveryMethod: string;
    numberOfPlaces: string;
    additionalInfo: string;
    additionalInfoPlaceholder: string;
    videos: string;
    noBuyerProfiles: string;
    noName: string;
  };
  
  // SellerCreateOrder - Delivery methods
  deliveryMethods: {
    selfPickup: string;
    cargoRf: string;
    cargoKz: string;
  };
  
  // SellerCreateOrder - Validation and stages
  orderCreation: {
    duplicateSubmissionTitle: string;
    duplicateSubmissionMessage: string;
    fillRequiredFields: string;
    fillRequiredFieldsMessage: string;
    validatingFormData: string;
    searchingBuyerProfile: string;
    creatingOrderInDatabase: string;
    fetchingCreatedOrderData: string;
    savingVideos: string;
    sendingNotification: string;
    orderCreatedSuccessfully: string;
    defaultCreatingMessage: string;
    telegramNotificationBackground: string;
  };
  
  // SellerPriceOffers
  priceOffers: string;
  managePriceOffers: string;
  noPriceOffers: string;
  noPriceOffersDesc: string;
  acceptOffer: string;
  rejectOffer: string;
  processingOffer: string;
  offerAccepted: string;
  offerRejected: string;
  orderWillBeCreated: string;
  messageTobuyer: string;
  reasonForRejection: string;
  yourPrice: string;
  offer: string;
  
  // Price Offer Statuses
  offerStatuses: {
    pending: string;
    accepted: string;
    rejected: string;
    expired: string;
    cancelled: string;
  };
  
  // Price Offer UI Elements
  offerElements: {
    originalPrice: string;
    totalOffers: string;
    priceOffersCount: string;
    offeredPrice: string;
    message: string;
    yourResponse: string;
    orderCreated: string;
    viewOrder: string;
    creatingOrder: string;
    orderCreatingMessage: string;
    expires: string;
    expired: string;
    acceptPlaceholder: string;
    rejectPlaceholder: string;
    afterAcceptingMessage: string;
  };
  
  // SellerSellProduct
  sellProductTitle: string;
  selectProductAndBuyer: string;
  selectProduct: string;
  selectBuyer: string;
  step2Title: string;
  step2Description: string;
  step1Title: string;
  step1Description: string;
  confirmation: string;
  noProductsInInventory: string;
  noProductsFound: string;
  addProductsFirst: string;
  tryChangingSearchCriteria: string;
  productLabel: string;
  selectBuyerPlaceholder: string;
  
  // Order Confirmation
  orderInformation: string;
  productInformation: string;
  orderParameters: string;
  titleLabel: string;
  priceLabel: string;
  brandLabel: string;
  modelLabel: string;
  productMedia: string;
  deliveryLabel: string;
  deliveryPrice: string;
  numberOfPlaces: string;
  totalLabel: string;
  additionalInformation: string;
  sellerLabel: string;
  buyerLabel: string;
  nameLabel: string;
  optIdLabel: string;
  telegramLabel: string;
  backToBuyers: string;
  
  // Validation and messages
  dataRestored: string;
  changesRestoredMessage: string;
  fieldUpdated: string;
  changesSaved: string;
  validationError: string;
  titleRequired: string;
  priceRequired: string;
  placesRequired: string;
  errorTitle: string;
  orderCreateError: string;
  notSpecified: string;
  enterProductTitle: string;
  enterBrand: string;
  enterModel: string;
  selectDeliveryMethod: string;
  additionalInfoPlaceholder: string;
  additionalInfoEmpty: string;
  productsFromInventory: string;
  productSelected: string;
  buyerSelected: string;
  orderCreationError: string;
  accessError: string;
  onlyForSellers: string;
  failedToLoadBuyers: string;
  failedToLoadProducts: string;
  notAllDataFilled: string;
  
  // SellerProductDetail
  productDetail: string;
  productNotFound: string;
  accessDenied: string;
  accessDeniedDescription: string;
  unknownSeller: string;
  lotLabel: string;
  
  // Seller Info
  sellerInfo: {
    openProfile: string;
    copyOptId: string;
    showOptId: string;
  };
  
  // ProductDetailAlerts
  moderationAlert: {
    pendingTitle: string;
    pendingDescription: string;
    pendingDescriptionOwner: string;
    pendingDescriptionAdmin: string;
    archivedTitle: string;
    archivedDescription: string;
    archivedDescriptionOwner: string;
    archivedDescriptionAdmin: string;
  };
  
  // Mobile actions
  mobileActions: {
    linkCopied: string;
    linkCopiedDescription: string;
    shareText: string;
    statusUpdated: string;
    statusUpdateDescription: string;
    statusUpdateFailed: string;
  };
  
  // Compact offers
  compactOffers: {
    all: string;
    from: string;
    showMore: string;
  };
  
  // SellerOrderDetails  
  orderDetails: string;
  orderNotFound: string;
  orderNotFoundDesc: string;
  accessDeniedDesc: string;
  created: string;
  selfOrder: string;
  confirmPhotos: string;
  productInfo: string;
  name: string;
  brand: string;
  model: string;
  productPrice: string;
  deliveryCost: string;
  additionalInfo: string;
  mediaFiles: string;
  photos: string;
  files: string;
  open: string;
  participants: string;
  seller: string;
  buyer: string;
  buyerOptId: string;
  delivery: string;
  deliveryMethod: string;
  containerNumber: string;
  containerStatus: string;
  confirmationPhotos: string;
  labelInstruction: string;
  
  // Status labels
  createdStatus: string;
  sellerConfirmed: string;
  adminConfirmed: string;
  processingStatus: string;
  shipped: string;
  delivered: string;
  cancelled: string;
  
  // Delivery methods
  selfPickup: string;
  cargoRF: string;
  cargoKZ: string;
  
  // Container statuses
  waiting: string;
  inTransit: string;
  atCustoms: string;

  // Order Preview Dialog
  orderPreview: {
    title: string;
    description: string;
    ready: string;
    product: string;
    participants: string;
    seller: string;
    buyer: string;
    brand: string;
    model: string;
    price: string;
    delivery: string;
    places: string;
    mediaFiles: string;
    additionalInformation: string;
    orderSummary: string;
    products: string;
    photos: string;
    videos: string;
    checkDataBefore: string;
    backButton: string;
    createOrderButton: string;
    creating: string;
  };

  // Video Upload
  videoUpload: {
    limitExceeded: string;
    limitExceededMessage: string;
    invalidFileFormat: string;
    invalidFileFormatMessage: string;
    fileTooLarge: string;
    fileTooLargeMessage: string;
    uploadingToCloudinary: string;
    chooseVideos: string;
    addVideo: string;
    supportedFormats: string;
    maxFileSize: string;
  };

  // Image Upload
  imageUpload: {
    title: string;
    imagesCount: string;
    smartUpload: string;
    uploadPhotos: string;
    cancelUpload: string;
    imagesUploaded: string;
    smartCompressionLossless: string;
    smartCompressionActive: string;
    compressionInfo: {
      lossless: string;
      light: string;
      adaptive: string;
    };
  };

  // Additional keys for new components
  productDetailsTitle?: string;
  productInfoDetails?: {
    title: string;
    views: string;
    created: string;
  };
  productActions?: {
    updated: string;
    updateFailed: string;
  };
  register?: {
    title: string;
    subtitle: string;
  };
  
  // System messages and errors
  system?: {
    error: string;
    profileIncomplete: string;
    profileIncompleteDescription: string;
    userNotAuthorized: string;
    pageError: string;
    pageErrorDescription: string;
    cloudinaryIntegration: string;
    sellerDashboardBreadcrumb: string;
    addProductBreadcrumb: string;
    publishingProduct: string;
    productPublished: string;
    productSentForModeration: string;
    failedToCreateProduct: string;
  };
  
  // Communication dialog
  communication?: {
    connectingToTelegram: string;
    usingFallbackLink: string;
    telegramError: string;
    assistantContact: string;
    professionalContact: string;
    sellerContact: string;
  };
  
  // Media section
  media?: {
    uploadPhotos: string;
    addMorePhotos: string;
    uploadVideos: string;
    smartUpload: string;
    cancelUpload: string;
    mediaFiles: string;
    photos: string;
    videos: string;
    smartCompression: string;
    smartCompressionDescription: string;
    uploadedVideos: string;
    mediaCount: string;
    smartQuality: string;
    photoCount: string;
  };
}

const ru: SellerPagesTranslations = {
  // General
  loading: 'Загрузка...',
  error: 'Ошибка',
  back: 'Назад',
  cancel: 'Отменить',
  save: 'Сохранить',
  delete: 'Удалить',
  edit: 'Изменить',
  view: 'Просмотреть',
  refresh: 'Обновить',
  retry: 'Повторить',
  
  // Navigation
  dashboard: 'Панель управления',
  profile: 'Профиль',
  listings: 'Товары',
  orders: 'Заказы',
  navigation_priceOffers: 'Предложения цен',
  addProduct: 'Добавить товар',
  sellProduct: 'Продать товар',
  
  // SellerProfile
  sellerDashboard: 'Личный кабинет продавца',
  yourStore: 'Ваш магазин',
  verified: 'Проверен',
  manageStore: 'Управляйте своим магазином и отслеживайте статистику',
  viewStore: 'Просмотреть магазин',
  storeNotLoaded: 'Не удалось загрузить информацию о магазине',
  refreshingData: 'Обновление данных',
  loadingStoreInfo: 'Загружаем информацию о магазине...',
  
  // SellerListings
  sellerListings: 'Товары продавца',
  pendingFirst: 'Ожидающие проверки | Первыми',
  manageListing: 'Управляйте своими товарами. Ожидающие модерации товары отображаются первыми.',
  pendingModeration: 'Ожидают модерации',
  
  // SellerCreateOrder
  createOrder: 'Создать заказ',
  fillOrderInfo: 'Заполните информацию о заказе',
  creatingOrder: 'Создание заказа',
  orderCreated: 'Заказ создан',
  
  // SellerCreateOrder - Form sections
  createOrderForm: {
    mainOrderInformation: 'Основная информация о заказе',
    buyer: 'Покупатель',
    orderDetails: 'Детали заказа',
    productTitle: 'Название товара *',
    productTitlePlaceholder: 'Введите название товара...',
    brand: 'Бренд',
    brandPlaceholder: 'Выберите бренд...',
    model: 'Модель',
    modelPlaceholder: 'Выберите модель...',
    modelPlaceholderFirst: 'Сначала выберите бренд',
    productPrice: 'Цена товара *',
    deliveryCost: 'Стоимость доставки',
    buyerOptId: 'OPT_ID покупателя *',
    buyerPlaceholder: 'Выберите покупателя...',
    deliveryMethod: 'Способ доставки',
    numberOfPlaces: 'Количество мест *',
    additionalInfo: 'Дополнительная информация',
    additionalInfoPlaceholder: 'Введите дополнительную информацию о заказе...',
    videos: 'Видео',
    noBuyerProfiles: 'Нет профилей покупателей',
    noName: 'Без имени'
  },
  
  // SellerCreateOrder - Delivery methods
  deliveryMethods: {
    selfPickup: 'Самовывоз',
    cargoRf: 'Cargo РФ', 
    cargoKz: 'Cargo KZ'
  },
  
  // SellerCreateOrder - Validation and stages
  orderCreation: {
    duplicateSubmissionTitle: 'Заказ уже создается',
    duplicateSubmissionMessage: 'Пожалуйста, подождите, заказ уже создается',
    fillRequiredFields: 'Заполните обязательные поля',
    fillRequiredFieldsMessage: 'Необходимо заполнить название, цену и OPT_ID покупателя',
    validatingFormData: 'Проверка данных формы...',
    searchingBuyerProfile: 'Поиск профиля покупателя...',
    creatingOrderInDatabase: 'Создание заказа в базе данных...',
    fetchingCreatedOrderData: 'Получение данных созданного заказа...',
    savingVideos: 'Сохранение видео...',
    sendingNotification: 'Отправка уведомления...',
    orderCreatedSuccessfully: 'Заказ успешно создан!',
    defaultCreatingMessage: 'Создание заказа...',
    telegramNotificationBackground: 'Уведомление в Telegram будет отправлено в фоновом режиме.'
  },
  
  // SellerPriceOffers
  priceOffers: 'Предложения цен',
  managePriceOffers: 'Управляйте предложениями цен на ваши товары',
  noPriceOffers: 'Нет предложений цен',
  noPriceOffersDesc: 'Пока никто не сделал предложения цен на ваши товары.',
  acceptOffer: 'Принять предложение',
  rejectOffer: 'Отклонить',
  processingOffer: 'Обработка...',
  offerAccepted: 'Предложение принято!',
  offerRejected: 'Предложение отклонено',
  orderWillBeCreated: 'Заказ будет создан автоматически',
  messageTobuyer: 'Сообщение покупателю (необязательно)',
  reasonForRejection: 'Причина отклонения (необязательно)',
  yourPrice: 'Ваша цена',
  offer: 'Предложение',
  
  // Price Offer Statuses
  offerStatuses: {
    pending: 'Ожидает',
    accepted: 'Принято',
    rejected: 'Отклонено',
    expired: 'Истекло',
    cancelled: 'Отменено',
  },
  
  // Price Offer UI Elements
  offerElements: {
    originalPrice: 'Изначальная цена',
    totalOffers: 'Всего',
    priceOffersCount: 'Предложения цен',
    offeredPrice: 'Предложенная цена',
    message: 'Сообщение:',
    yourResponse: 'Ваш ответ:',
    orderCreated: 'Заказ создан',
    viewOrder: 'Просмотреть заказ',
    creatingOrder: 'Создание заказа...',
    orderCreatingMessage: 'Заказ создается автоматически. Обновите страницу через несколько секунд.',
    expires: 'Истекает',
    expired: 'Истекло',
    acceptPlaceholder: 'Спасибо за ваше предложение! Я принимаю вашу цену.',
    rejectPlaceholder: 'К сожалению, я не могу принять эту цену...',
    afterAcceptingMessage: 'После принятия предложения заказ будет создан автоматически',
  },
  
  // SellerSellProduct
  sellProductTitle: 'Продать товар',
  selectProductAndBuyer: 'Выберите товар из вашего инвентаря и покупателя для создания заказа',
  selectProduct: 'Товар',
  selectBuyer: 'Покупатель',
  step2Title: 'Шаг 2: Выберите покупателя',
  step2Description: 'Товар:',
  step1Title: 'Шаг 1: Выберите товар',
  step1Description: 'Выберите товар из вашего инвентаря',
  confirmation: 'Подтверждение',
  noProductsInInventory: 'Нет товаров в инвентаре',
  noProductsFound: 'Товары не найдены',
  addProductsFirst: 'Добавьте товары в ваш инвентарь для начала продаж',
  tryChangingSearchCriteria: 'Попробуйте изменить критерии поиска',
  productLabel: 'Товар:',
  selectBuyerPlaceholder: 'Выберите покупателя',
  
  // Order Confirmation
  orderInformation: 'Информация о заказе',
  productInformation: 'Информация о товаре',
  orderParameters: 'Параметры заказа',
  titleLabel: 'Название:',
  priceLabel: 'Цена:',
  brandLabel: 'Бренд:',
  modelLabel: 'Модель:',
  productMedia: 'Медиа товара:',
  deliveryLabel: 'Доставка:',
  deliveryPrice: 'Стоимость доставки:',
  numberOfPlaces: 'Количество мест:',
  totalLabel: 'Итого:',
  additionalInformation: 'Дополнительная информация:',
  sellerLabel: 'Продавец',
  buyerLabel: 'Покупатель',
  nameLabel: 'Имя:',
  optIdLabel: 'OPT ID:',
  telegramLabel: 'Telegram:',
  backToBuyers: 'Назад к покупателям',
  
  // Validation and messages
  dataRestored: 'Данные восстановлены',
  changesRestoredMessage: 'Ваши изменения были автоматически восстановлены',
  fieldUpdated: 'Поле обновлено',
  changesSaved: 'Изменения сохранены',
  validationError: 'Ошибка валидации',
  titleRequired: 'Название товара обязательно',
  priceRequired: 'Цена должна быть больше 0',
  placesRequired: 'Количество мест должно быть больше 0',
  errorTitle: 'Ошибка',
  orderCreateError: 'Не удалось подтвердить заказ. Попробуйте еще раз.',
  notSpecified: 'Не указано',
  enterProductTitle: 'Введите название товара',
  enterBrand: 'Введите бренд',
  enterModel: 'Введите модель',
  selectDeliveryMethod: 'Выберите способ доставки',
  additionalInfoPlaceholder: 'Укажите дополнительную информацию о заказе',
  additionalInfoEmpty: 'Нажмите, чтобы добавить дополнительную информацию',
  productsFromInventory: 'Товары из вашего инвентаря',
  productSelected: 'Товар выбран',
  buyerSelected: 'Покупатель выбран',
  orderCreationError: 'Ошибка создания заказа',
  accessError: 'Ошибка доступа',
  onlyForSellers: 'Эта страница доступна только продавцам',
  failedToLoadBuyers: 'Не удалось загрузить список покупателей',
  failedToLoadProducts: 'Не удалось загрузить ваши товары',
  notAllDataFilled: 'Не все данные заполнены',
  
  // SellerProductDetail
  productDetail: 'Детали товара',
  productNotFound: 'Товар не найден',
  accessDenied: 'Доступ запрещен',
  accessDeniedDescription: 'Вы можете просматривать только свои собственные объявления. Проверьте правильность ссылки или вернитесь к списку ваших объявлений.',
  unknownSeller: 'Неизвестный продавец',
  lotLabel: 'Лот',
  
  // Seller Info
  sellerInfo: {
    openProfile: '(Открыть профиль)',
    copyOptId: 'Копировать OPT ID',
    showOptId: 'Показать OPT ID',
  },
  
  // ProductDetailAlerts
  moderationAlert: {
    pendingTitle: 'Объявление на проверке',
    pendingDescription: 'Это объявление ожидает проверки модераторами.',
    pendingDescriptionOwner: 'Только вы и администраторы могут его видеть.',
    pendingDescriptionAdmin: 'Как администратор, вы можете видеть это объявление.',
    archivedTitle: 'Объявление в архиве',
    archivedDescription: 'Это объявление находится в архиве.',
    archivedDescriptionOwner: 'Только вы и администраторы могут его видеть.',
    archivedDescriptionAdmin: 'Как администратор, вы можете видеть это объявление.',
  },
  
  // Mobile actions
  mobileActions: {
    linkCopied: 'Ссылка скопирована',
    linkCopiedDescription: 'Ссылка на объявление скопирована в буфер обмена',
    shareText: 'Посмотрите это объявление',
    statusUpdated: 'Статус обновлен',
    statusUpdateDescription: 'Статус вашего объявления успешно изменен.',
    statusUpdateFailed: 'Не удалось обновить статус объявления.',
  },
  
  // Compact offers
  compactOffers: {
    all: 'Все',
    from: 'от',
    showMore: 'Показать ещё',
  },
  
  // SellerOrderDetails
  orderDetails: 'Детали заказа',
  orderNotFound: 'Заказ не найден',
  orderNotFoundDesc: 'Заказ с указанным ID не существует или у вас нет прав для его просмотра.',
  accessDeniedDesc: 'У вас нет прав для просмотра этого заказа.',
  created: 'Создан',
  selfOrder: 'Самозаказ',
  confirmPhotos: 'Подтв. фото',
  productInfo: 'Информация о товаре',
  name: 'Наименование',
  brand: 'Бренд',
  model: 'Модель',
  productPrice: 'Цена товара',
  deliveryCost: 'Стоимость доставки',
  additionalInfo: 'Дополнительная информация',
  mediaFiles: 'Медиафайлы',
  photos: 'Фотографии',
  files: 'файлов',
  open: 'Открыть',
  participants: 'Участники',
  seller: 'Продавец',
  buyer: 'Покупатель',
  buyerOptId: 'OPT ID покупателя',
  delivery: 'Доставка',
  deliveryMethod: 'Способ доставки',
  containerNumber: 'Номер контейнера',
  containerStatus: 'Статус контейнера',
  confirmationPhotos: 'Подтверждающие фотографии',
  labelInstruction: 'Подпишите товар и добавьте фото в заказ',
  
  // Status labels
  createdStatus: 'Создан',
  sellerConfirmed: 'Подтвержден продавцом',
  adminConfirmed: 'Подтвержден администратором',
  processingStatus: 'Обрабатывается',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
  
  // Delivery methods
  selfPickup: 'Самовывоз',
  cargoRF: 'Cargo РФ',
  cargoKZ: 'Cargo KZ',
  
  // Container statuses
  waiting: 'Ожидание',
  inTransit: 'В пути',
  atCustoms: 'На таможне',

  // Additional keys for new components
  productDetailsTitle: 'Детали товара',
  productInfoDetails: {
    title: 'Информация о товаре',
    views: 'просмотров',
    created: 'Создан'
  },
  productActions: {
    updated: 'Товар обновлён',
    updateFailed: 'Не удалось обновить товар'
  },
  register: {
    title: 'Станьте продавцом на',
    subtitle: 'Расширьте свой бизнес и привлеките новых клиентов, став частью ведущего B2B-маркетплейса автозапчастей в ОАЭ.'
  },
  
  system: {
    error: 'Ошибка',
    profileIncomplete: 'Профиль не завершен',
    profileIncompleteDescription: 'В вашем профиле отсутствует OPT ID. Обратитесь к администратору для его получения.',
    userNotAuthorized: 'Пользователь не авторизован',
    pageError: 'Ошибка страницы',
    pageErrorDescription: 'Произошла ошибка при загрузке страницы. Пожалуйста, попробуйте обновить страницу.',
    cloudinaryIntegration: 'Интеграция с Cloudinary',
    sellerDashboardBreadcrumb: 'Панель продавца',
    addProductBreadcrumb: 'Добавить товар',
    publishingProduct: 'Публикация товара...',
    productPublished: 'Товар успешно опубликован',
    productSentForModeration: 'Товар отправлен на модерацию',
    failedToCreateProduct: 'Не удалось создать товар. Попробуйте позже.',
  },

  // Communication dialog
  communication: {
    connectingToTelegram: 'Переходим в Telegram к менеджеру',
    usingFallbackLink: 'Используем резервную ссылку для связи',
    telegramError: 'Не удалось открыть Telegram. Попробуйте позже.',
    assistantContact: 'Связь через помощника',
    professionalContact: 'Связь с профессионалом',
    sellerContact: 'Связь с продавцом',
  },
  
  // Order Preview Dialog
  orderPreview: {
    title: 'Предпросмотр заказа',
    description: 'Проверьте данные перед созданием заказа',
    ready: 'Готов',
    product: 'Товар',
    participants: 'Участники',
    seller: 'Продавец',
    buyer: 'Покупатель',
    brand: 'Бренд:',
    model: 'Модель:',
    price: 'Цена',
    delivery: 'Доставка',
    places: 'Места',
    mediaFiles: 'Медиафайлы',
    additionalInformation: 'Дополнительная информация',
    orderSummary: 'Сводка заказа',
    products: 'Товары:',
    photos: 'Фото:',
    videos: 'Видео:',
    checkDataBefore: 'Проверьте все данные перед созданием заказа',
    backButton: 'Назад',
    createOrderButton: 'Создать заказ',
    creating: 'Создание...',
  },

  // Video Upload
  videoUpload: {
    limitExceeded: 'Превышен лимит',
    limitExceededMessage: 'Максимальное количество видео',
    invalidFileFormat: 'Неверный формат файла',
    invalidFileFormatMessage: 'имеет неподдерживаемый формат',
    fileTooLarge: 'Файл слишком большой',
    fileTooLargeMessage: 'превышает',
    uploadingToCloudinary: 'Загрузка в Cloudinary...',
    chooseVideos: 'Выберите видео',
    addVideo: 'Добавить видео',
    supportedFormats: 'Поддерживаются: mp4, mov, avi, webm. Загрузка через Cloudinary CDN. Максимум 20МБ на файл.',
    maxFileSize: 'МБ',
  },

  // Image Upload
  imageUpload: {
    title: 'Изображения заказа',
    imagesCount: '{count}/{max} изображений',
    smartUpload: 'Умная загрузка...',
    uploadPhotos: 'Загрузить фото ({count}/{max})',
    cancelUpload: 'Отменить загрузку',
    imagesUploaded: '✅ Изображений загружено: {count}',
    smartCompressionLossless: '🧠 Умное сжатие: файлы <400КБ без потерь',
    smartCompressionActive: '🧠 Умное сжатие активно',
    compressionInfo: {
      lossless: '• Файлы <400КБ - без сжатия (оригинальное качество)',
      light: '• Файлы 400КБ-2МБ - легкое сжатие (90% качества)',
      adaptive: '• Файлы >2МБ - адаптивное сжатие'
    }
  },

  media: {
    uploadPhotos: 'Загрузить фото',
    addMorePhotos: 'Добавить ещё фото',
    uploadVideos: 'Загрузить видео',
    smartUpload: 'Умная загрузка...',
    cancelUpload: 'Отменить загрузку',
    mediaFiles: 'Медиафайлы',
    photos: 'Фотографии',
    videos: 'Видео',
    smartCompression: 'Умное сжатие для товаров',
    smartCompressionDescription: 'Маленькие файлы (<400КБ) сохраняют исходное качество\nБольшие файлы сжимаются адаптивно без потери деталей',
    uploadedVideos: 'Загруженные видео',
    mediaCount: 'Медиафайлы',
    smartQuality: 'Умное качество',
    photoCount: 'Фото: {count} из {max}',
  },
};

const en: SellerPagesTranslations = {
  // General
  loading: 'Loading...',
  error: 'Error',
  back: 'Back',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  view: 'View',
  refresh: 'Refresh',
  retry: 'Retry',
  
  // Navigation
  dashboard: 'Dashboard',
  profile: 'Profile',
  listings: 'Listings',
  orders: 'Orders',
  navigation_priceOffers: 'Price Offers',
  addProduct: 'Add Product',
  sellProduct: 'Sell Product',
  
  // SellerProfile
  sellerDashboard: 'Seller Dashboard',
  yourStore: 'Your Store',
  verified: 'Verified',
  manageStore: 'Manage your store and track statistics',
  viewStore: 'View Store',
  storeNotLoaded: 'Failed to load store information',
  refreshingData: 'Refreshing Data',
  loadingStoreInfo: 'Loading store information...',
  
  // SellerListings
  sellerListings: 'Seller Listings',
  pendingFirst: 'Pending first',
  manageListing: 'Manage your listings. Pending (moderation) items appear first.',
  pendingModeration: 'Pending moderation',
  
  // SellerCreateOrder
  createOrder: 'Create Order',
  fillOrderInfo: 'Fill in the order information',
  creatingOrder: 'Creating order',
  orderCreated: 'Order created',
  
  // SellerCreateOrder - Form sections
  createOrderForm: {
    mainOrderInformation: 'Main Order Information',
    buyer: 'Buyer',
    orderDetails: 'Order Details',
    productTitle: 'Product Title *',
    productTitlePlaceholder: 'Enter product title...',
    brand: 'Brand',
    brandPlaceholder: 'Select brand...',
    model: 'Model',
    modelPlaceholder: 'Select model...',
    modelPlaceholderFirst: 'Select brand first',
    productPrice: 'Product Price *',
    deliveryCost: 'Delivery Cost',
    buyerOptId: 'Buyer\'s OPT_ID *',
    buyerPlaceholder: 'Select buyer...',
    deliveryMethod: 'Delivery Method',
    numberOfPlaces: 'Number of Places *',
    additionalInfo: 'Additional Information',
    additionalInfoPlaceholder: 'Enter additional order information...',
    videos: 'Videos',
    noBuyerProfiles: 'No buyer profiles available',
    noName: 'No name'
  },
  
  // SellerCreateOrder - Delivery methods
  deliveryMethods: {
    selfPickup: 'Self Pickup',
    cargoRf: 'Cargo RF',
    cargoKz: 'Cargo KZ'
  },
  
  // SellerCreateOrder - Validation and stages
  orderCreation: {
    duplicateSubmissionTitle: 'Order already being created',
    duplicateSubmissionMessage: 'Please wait, order is already being created',
    fillRequiredFields: 'Fill in required fields',
    fillRequiredFieldsMessage: 'You need to fill in the title, price and buyer\'s OPT_ID',
    validatingFormData: 'Validating form data...',
    searchingBuyerProfile: 'Searching buyer profile...',
    creatingOrderInDatabase: 'Creating order in database...',
    fetchingCreatedOrderData: 'Fetching created order data...',
    savingVideos: 'Saving videos...',
    sendingNotification: 'Sending notification...',
    orderCreatedSuccessfully: 'Order created successfully!',
    defaultCreatingMessage: 'Creating order...',
    telegramNotificationBackground: 'Telegram notification will be sent in the background.'
  },
  
  // SellerPriceOffers
  priceOffers: 'Price Offers',
  managePriceOffers: 'Manage price offers for your products',
  noPriceOffers: 'No Price Offers',
  noPriceOffersDesc: 'No one has made price offers for your products yet.',
  acceptOffer: 'Accept Offer',
  rejectOffer: 'Reject',
  processingOffer: 'Processing...',
  offerAccepted: 'Offer Accepted!',
  offerRejected: 'Offer Rejected',
  orderWillBeCreated: 'Order will be created automatically',
  messageTobuyer: 'Message to buyer (optional)',
  reasonForRejection: 'Reason for rejection (optional)',
  yourPrice: 'Your Price',
  offer: 'Offer',
  
  // Price Offer Statuses
  offerStatuses: {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
  },
  
  // Price Offer UI Elements
  offerElements: {
    originalPrice: 'Original Price',
    totalOffers: 'Total',
    priceOffersCount: 'Price Offers',
    offeredPrice: 'Offered Price',
    message: 'Message:',
    yourResponse: 'Your Response:',
    orderCreated: 'Order Created',
    viewOrder: 'View Order',
    creatingOrder: 'Creating order...',
    orderCreatingMessage: 'Order is being created automatically. Refresh the page in a few seconds.',
    expires: 'Expires',
    expired: 'Expired',
    acceptPlaceholder: 'Thank you for your offer! I accept your price.',
    rejectPlaceholder: 'Unfortunately, I cannot accept this price...',
    afterAcceptingMessage: 'After accepting the offer, order will be created automatically',
  },
  
  // SellerSellProduct
  sellProductTitle: 'Sell Product',
  selectProductAndBuyer: 'Select a product from your inventory and a buyer to create an order',
  selectProduct: 'Product',
  selectBuyer: 'Buyer',
  step2Title: 'Step 2: Select Buyer',
  step2Description: 'Product:',
  step1Title: 'Step 1: Select Product',
  step1Description: 'Select a product from your inventory',
  confirmation: 'Confirmation',
  noProductsInInventory: 'No products in inventory',
  noProductsFound: 'No products found',
  addProductsFirst: 'Add products to your inventory to start selling',
  tryChangingSearchCriteria: 'Try changing your search criteria',
  productLabel: 'Product:',
  selectBuyerPlaceholder: 'Select buyer',
  
  // Order Confirmation
  orderInformation: 'Order Information',
  productInformation: 'Product Information',
  orderParameters: 'Order Parameters',
  titleLabel: 'Title:',
  priceLabel: 'Price:',
  brandLabel: 'Brand:',
  modelLabel: 'Model:',
  productMedia: 'Product Media:',
  deliveryLabel: 'Delivery:',
  deliveryPrice: 'Delivery Price:',
  numberOfPlaces: 'Number of Places:',
  totalLabel: 'Total:',
  additionalInformation: 'Additional Information:',
  sellerLabel: 'Seller',
  buyerLabel: 'Buyer',
  nameLabel: 'Name:',
  optIdLabel: 'OPT ID:',
  telegramLabel: 'Telegram:',
  backToBuyers: 'Back to Buyers',
  
  // Validation and messages
  dataRestored: 'Data Restored',
  changesRestoredMessage: 'Your changes have been automatically restored',
  fieldUpdated: 'Field Updated',
  changesSaved: 'Changes Saved',
  validationError: 'Validation Error',
  titleRequired: 'Product title is required',
  priceRequired: 'Price must be greater than 0',
  placesRequired: 'Number of places must be greater than 0',
  errorTitle: 'Error',
  orderCreateError: 'Failed to confirm order. Please try again.',
  notSpecified: 'Not specified',
  enterProductTitle: 'Enter product title',
  enterBrand: 'Enter brand',
  enterModel: 'Enter model',
  selectDeliveryMethod: 'Select delivery method',
  additionalInfoPlaceholder: 'Specify additional order information',
  additionalInfoEmpty: 'Click to add additional information',
  productsFromInventory: 'Products from your inventory',
  productSelected: 'Product selected',
  buyerSelected: 'Buyer selected',
  orderCreationError: 'Order Creation Error',
  accessError: 'Access Error',
  onlyForSellers: 'This page is only available to sellers',
  failedToLoadBuyers: 'Failed to load buyers list',
  failedToLoadProducts: 'Failed to load your products',
  notAllDataFilled: 'Not all data is filled',
  
  // SellerProductDetail
  productDetail: 'Product Details',
  productNotFound: 'Product not found',
  accessDenied: 'Access Denied',
  accessDeniedDescription: 'You can only view your own listings. Please check the link or return to your listings.',
  unknownSeller: 'Unknown Seller',
  lotLabel: 'Lot',
  
  // Seller Info
  sellerInfo: {
    openProfile: '(Open Profile)',
    copyOptId: 'Copy OPT ID',
    showOptId: 'Show OPT ID',
  },
  
  // ProductDetailAlerts
  moderationAlert: {
    pendingTitle: 'Listing Under Review',
    pendingDescription: 'This listing is awaiting moderator review.',
    pendingDescriptionOwner: 'Only you and administrators can see it.',
    pendingDescriptionAdmin: 'As an administrator, you can see this listing.',
    archivedTitle: 'Listing Archived',
    archivedDescription: 'This listing is archived.',
    archivedDescriptionOwner: 'Only you and administrators can see it.',
    archivedDescriptionAdmin: 'As an administrator, you can see this listing.',
  },
  
  // Mobile actions
  mobileActions: {
    linkCopied: 'Link Copied',
    linkCopiedDescription: 'Listing link copied to clipboard',
    shareText: 'Check out this listing',
    statusUpdated: 'Status Updated',
    statusUpdateDescription: 'Your listing status has been successfully changed.',
    statusUpdateFailed: 'Failed to update listing status.',
  },
  
  // Compact offers
  compactOffers: {
    all: 'All',
    from: 'from',
    showMore: 'Show more',
  },
  
  // SellerOrderDetails
  orderDetails: 'Order Details',
  orderNotFound: 'Order not found',
  orderNotFoundDesc: 'The order with the specified ID does not exist or you do not have permission to view it.',
  accessDeniedDesc: 'You do not have permission to view this order.',
  created: 'Created',
  selfOrder: 'Self-order',
  confirmPhotos: 'Conf. Photos',
  productInfo: 'Product Information',
  name: 'Name',
  brand: 'Brand',
  model: 'Model',
  productPrice: 'Product Price',
  deliveryCost: 'Delivery Cost',
  additionalInfo: 'Additional Information',
  mediaFiles: 'Media Files',
  photos: 'Photos',
  files: 'files',
  open: 'Open',
  participants: 'Participants',
  seller: 'Seller',
  buyer: 'Buyer',
  buyerOptId: 'Buyer OPT ID',
  delivery: 'Delivery',
  deliveryMethod: 'Delivery Method',
  containerNumber: 'Container Number',
  containerStatus: 'Container Status',
  confirmationPhotos: 'Confirmation Photos',
  labelInstruction: 'Label the product and add photos to the order',
  
  // Status labels
  createdStatus: 'Created',
  sellerConfirmed: 'Seller Confirmed',
  adminConfirmed: 'Admin Confirmed',
  processingStatus: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  
  // Delivery methods
  selfPickup: 'Self Pickup',
  cargoRF: 'Cargo RF',
  cargoKZ: 'Cargo KZ',
  
  // Container statuses
  waiting: 'Waiting',
  inTransit: 'In Transit',
  atCustoms: 'At Customs',

  // Additional keys for new components
  productDetailsTitle: 'Product Details',
  productInfoDetails: {
    title: 'Product Information',
    views: 'views',
    created: 'Created'
  },
  productActions: {
    updated: 'Product Updated',
    updateFailed: 'Failed to update product'
  },
  register: {
    title: 'Become a seller on',
    subtitle: 'Expand your business and attract new customers by becoming part of the leading B2B auto parts marketplace in the UAE.'
  },
  
  // Order Preview Dialog
  orderPreview: {
    title: 'Order Preview',
    description: 'Check data before creating',
    ready: 'Ready',
    product: 'Product',
    participants: 'Participants',
    seller: 'Seller',
    buyer: 'Buyer',
    brand: 'Brand:',
    model: 'Model:',
    price: 'Price',
    delivery: 'Delivery',
    places: 'Places',
    mediaFiles: 'Media Files',
    additionalInformation: 'Additional Information',
    orderSummary: 'Order Summary',
    products: 'Products:',
    photos: 'Photos:',
    videos: 'Videos:',
    checkDataBefore: 'Check all data before creating the order',
    backButton: 'Back',
    createOrderButton: 'Create Order',
    creating: 'Creating...',
  },

  // Video Upload
  videoUpload: {
    limitExceeded: 'Limit Exceeded',
    limitExceededMessage: 'Maximum number of videos',
    invalidFileFormat: 'Invalid File Format',
    invalidFileFormatMessage: 'has unsupported format',
    fileTooLarge: 'File Too Large',
    fileTooLargeMessage: 'exceeds',
    uploadingToCloudinary: 'Uploading to Cloudinary...',
    chooseVideos: 'Choose Videos',
    addVideo: 'Add Video',
    supportedFormats: 'Up to {maxVideos} videos. Supported: mp4, mov, avi, webm. Upload via Cloudinary CDN. Maximum 20MB per file.',
    maxFileSize: 'MB',
  },

  // Image Upload
  imageUpload: {
    title: 'Order Images',
    imagesCount: '{count}/{max} images',
    smartUpload: 'Smart Upload...',
    uploadPhotos: 'Upload Photos ({count}/{max})',
    cancelUpload: 'Cancel Upload',
    imagesUploaded: '✅ Images Uploaded: {count}',
    smartCompressionLossless: '🧠 Smart Compression: Files <400KB Lossless',
    smartCompressionActive: '🧠 Smart Compression Active',
    compressionInfo: {
      lossless: '• Files <400KB - No compression (original quality)',
      light: '• Files 400KB-2MB - Light compression (90% quality)',
      adaptive: '• Files >2MB - Adaptive compression'
    }
  },

  system: {
    error: 'Error',
    profileIncomplete: 'Profile Incomplete',
    profileIncompleteDescription: 'Your profile is missing an OPT ID. Please contact the administrator to obtain one.',
    userNotAuthorized: 'User not authorized',
    pageError: 'Page Error',
    pageErrorDescription: 'An error occurred while loading the page. Please try refreshing the page.',
    cloudinaryIntegration: 'Cloudinary integration',
    sellerDashboardBreadcrumb: 'Seller Dashboard',
    addProductBreadcrumb: 'Add Product',
    publishingProduct: 'Publishing product...',
    productPublished: 'Product successfully published',
    productSentForModeration: 'Product sent for moderation',
    failedToCreateProduct: 'Failed to create product. Please try again later.',
  },

  // Communication dialog
  communication: {
    connectingToTelegram: 'Redirecting to Telegram manager',
    usingFallbackLink: 'Using fallback link for communication',
    telegramError: 'Failed to open Telegram. Please try again later.',
    assistantContact: 'Assistant Contact',
    professionalContact: 'Professional Contact',
    sellerContact: 'Seller Contact',
  },
  
  media: {
    uploadPhotos: 'Upload Photos',
    addMorePhotos: 'Add More Photos',
    uploadVideos: 'Upload Videos',
    smartUpload: 'Smart Upload...',
    cancelUpload: 'Cancel Upload',
    mediaFiles: 'Media Files',
    photos: 'Photos',
    videos: 'Videos',
    smartCompression: 'Smart Compression for Products',
    smartCompressionDescription: 'Small files (<400KB) maintain original quality\nLarge files are compressed adaptively without losing details',
    uploadedVideos: 'Uploaded Videos',
    mediaCount: 'Media Files',
    smartQuality: 'Smart Quality',
    photoCount: 'Photos: {count} of {max}',
  },
};

const bn: SellerPagesTranslations = {
  // General
  loading: 'লোড হচ্ছে...',
  error: 'ত্রুটি',
  back: 'পেছনে',
  cancel: 'বাতিল',
  save: 'সংরক্ষণ',
  delete: 'মুছুন',
  edit: 'সম্পাদনা',
  view: 'দেখুন',
  refresh: 'রিফ্রেশ',
  retry: 'পুনরায় চেষ্টা',
  
  // Navigation
  dashboard: 'ড্যাশবোর্ড',
  profile: 'প্রোফাইল',
  listings: 'তালিকা',
  orders: 'অর্ডার',
  navigation_priceOffers: 'মূল্য অফার',
  addProduct: 'পণ্য যোগ করুন',
  sellProduct: 'পণ্য বিক্রয়',
  
  // SellerProfile
  sellerDashboard: 'বিক্রেতা ড্যাশবোর্ড',
  yourStore: 'আপনার দোকান',
  verified: 'যাচাইকৃত',
  manageStore: 'আপনার দোকান পরিচালনা করুন এবং পরিসংখ্যান ট্র্যাক করুন',
  viewStore: 'দোকান দেখুন',
  storeNotLoaded: 'দোকানের তথ্য লোড করতে ব্যর্থ',
  refreshingData: 'ডেটা রিফ্রেশ হচ্ছে',
  loadingStoreInfo: 'দোকানের তথ্য লোড হচ্ছে...',
  
  // SellerListings
  sellerListings: 'বিক্রেতার তালিকা',
  pendingFirst: 'অপেক্ষমাণ প্রথম',
  manageListing: 'আপনার তালিকা পরিচালনা করুন। অপেক্ষমাণ (মডারেশন) আইটেম প্রথমে প্রদর্শিত হয়।',
  pendingModeration: 'মডারেশনের অপেক্ষায়',
  
  // SellerCreateOrder
  createOrder: 'অর্ডার তৈরি করুন',
  fillOrderInfo: 'অর্ডারের তথ্য পূরণ করুন',
  creatingOrder: 'অর্ডার তৈরি হচ্ছে',
  orderCreated: 'অর্ডার তৈরি হয়েছে',
  
  // SellerCreateOrder - Form sections
  createOrderForm: {
    mainOrderInformation: 'প্রধান অর্ডার তথ্য',
    buyer: 'ক্রেতা',
    orderDetails: 'অর্ডারের বিস্তারিত',
    productTitle: 'পণ্যের শিরোনাম *',
    productTitlePlaceholder: 'পণ্যের শিরোনাম লিখুন...',
    brand: 'ব্র্যান্ড',
    brandPlaceholder: 'ব্র্যান্ড নির্বাচন করুন...',
    model: 'মডেল',
    modelPlaceholder: 'মডেল নির্বাচন করুন...',
    modelPlaceholderFirst: 'প্রথমে ব্র্যান্ড নির্বাচন করুন',
    productPrice: 'পণ্যের দাম *',
    deliveryCost: 'ডেলিভারির খরচ',
    buyerOptId: 'ক্রেতার OPT_ID *',
    buyerPlaceholder: 'ক্রেতা নির্বাচন করুন...',
    deliveryMethod: 'ডেলিভারি পদ্ধতি',
    numberOfPlaces: 'স্থানের সংখ্যা *',
    additionalInfo: 'অতিরিক্ত তথ্য',
    additionalInfoPlaceholder: 'অর্ডার সম্পর্কে অতিরিক্ত তথ্য লিখুন...',
    videos: 'ভিডিও',
    noBuyerProfiles: 'কোন ক্রেতার প্রোফাইল নেই',
    noName: 'কোন নাম নেই'
  },
  
  // SellerCreateOrder - Delivery methods
  deliveryMethods: {
    selfPickup: 'সেল্ফ পিকআপ',
    cargoRf: 'কার্গো আরএফ',
    cargoKz: 'কার্গো কেজেড'
  },
  
  // SellerCreateOrder - Validation and stages
  orderCreation: {
    duplicateSubmissionTitle: 'অর্ডার ইতিমধ্যে তৈরি হচ্ছে',
    duplicateSubmissionMessage: 'অনুগ্রহ করে অপেক্ষা করুন, অর্ডার ইতিমধ্যে তৈরি হচ্ছে',
    fillRequiredFields: 'প্রয়োজনীয় ক্ষেত্রগুলি পূরণ করুন',
    fillRequiredFieldsMessage: 'আপনাকে শিরোনাম, দাম এবং ক্রেতার OPT_ID পূরণ করতে হবে',
    validatingFormData: 'ফর্ম ডেটা যাচাই করা হচ্ছে...',
    searchingBuyerProfile: 'ক্রেতার প্রোফাইল খোঁজা হচ্ছে...',
    creatingOrderInDatabase: 'ডেটাবেসে অর্ডার তৈরি করা হচ্ছে...',
    fetchingCreatedOrderData: 'তৈরি করা অর্ডারের ডেটা আনা হচ্ছে...',
    savingVideos: 'ভিডিও সংরক্ষণ করা হচ্ছে...',
    sendingNotification: 'বিজ্ঞপ্তি পাঠানো হচ্ছে...',
    orderCreatedSuccessfully: 'অর্ডার সফলভাবে তৈরি হয়েছে!',
    defaultCreatingMessage: 'অর্ডার তৈরি করা হচ্ছে...',
    telegramNotificationBackground: 'টেলিগ্রাম বিজ্ঞপ্তি ব্যাকগ্রাউন্ডে পাঠানো হবে।'
  },
  
  // SellerPriceOffers
  priceOffers: 'মূল্য অফার',
  managePriceOffers: 'আপনার পণ্যের জন্য মূল্য অফার পরিচালনা করুন',
  noPriceOffers: 'কোন মূল্য অফার নেই',
  noPriceOffersDesc: 'আপনার পণ্যের জন্য এখনও কেউ মূল্য অফার করেননি।',
  acceptOffer: 'অফার গ্রহণ করুন',
  rejectOffer: 'প্রত্যাখ্যান',
  processingOffer: 'প্রক্রিয়াকরণ...',
  offerAccepted: 'অফার গৃহীত!',
  offerRejected: 'অফার প্রত্যাখ্যাত',
  orderWillBeCreated: 'অর্ডার স্বয়ংক্রিয়ভাবে তৈরি হবে',
  messageTobuyer: 'ক্রেতার জন্য বার্তা (ঐচ্ছিক)',
  reasonForRejection: 'প্রত্যাখ্যানের কারণ (ঐচ্ছিক)',
  yourPrice: 'আপনার মূল্য',
  offer: 'অফার',
  
  // Price Offer Statuses
  offerStatuses: {
    pending: 'অপেক্ষমাণ',
    accepted: 'গৃহীত',
    rejected: 'প্রত্যাখ্যাত',
    expired: 'মেয়াদ শেষ',
    cancelled: 'বাতিল',
  },
  
  // Price Offer UI Elements
  offerElements: {
    originalPrice: 'মূল মূল্য',
    totalOffers: 'মোট',
    priceOffersCount: 'মূল্য অফার',
    offeredPrice: 'প্রস্তাবিত মূল্য',
    message: 'বার্তা:',
    yourResponse: 'আপনার উত্তর:',
    orderCreated: 'অর্ডার তৈরি হয়েছে',
    viewOrder: 'অর্ডার দেখুন',
    creatingOrder: 'অর্ডার তৈরি হচ্ছে...',
    orderCreatingMessage: 'অর্ডার স্বয়ংক্রিয়ভাবে তৈরি হচ্ছে। কয়েক সেকেন্ড পরে পৃষ্ঠা রিফ্রেশ করুন।',
    expires: 'মেয়াদ শেষ',
    expired: 'মেয়াদ শেষ',
    acceptPlaceholder: 'আপনার প্রস্তাবের জন্য ধন্যবাদ! আমি আপনার মূল্য গ্রহণ করছি।',
    rejectPlaceholder: 'দুর্ভাগ্যবশত, আমি এই মূল্য গ্রহণ করতে পারি না...',
    afterAcceptingMessage: 'অফার গ্রহণ করার পর অর্ডার স্বয়ংক্রিয়ভাবে তৈরি হবে',
  },
  
  // SellerSellProduct
  sellProductTitle: 'পণ্য বিক্রয়',
  selectProductAndBuyer: 'একটি অর্ডার তৈরি করতে আপনার ইনভেন্টরি থেকে একটি পণ্য এবং একজন ক্রেতা নির্বাচন করুন',
  selectProduct: 'পণ্য',
  selectBuyer: 'ক্রেতা',
  step2Title: 'ধাপ ২: ক্রেতা নির্বাচন',
  step2Description: 'পণ্য:',
  step1Title: 'ধাপ ১: পণ্য নির্বাচন',
  step1Description: 'আপনার ইনভেন্টরি থেকে একটি পণ্য নির্বাচন করুন',
  confirmation: 'নিশ্চিতকরণ',
  noProductsInInventory: 'ইনভেন্টরিতে কোনো পণ্য নেই',
  noProductsFound: 'কোনো পণ্য পাওয়া যায়নি',
  addProductsFirst: 'বিক্রয় শুরু করতে আপনার ইনভেন্টরিতে পণ্য যোগ করুন',
  tryChangingSearchCriteria: 'অনুসন্ধানের শর্ত পরিবর্তন করে দেখুন',
  productLabel: 'পণ্য:',
  selectBuyerPlaceholder: 'ক্রেতা নির্বাচন করুন',
  
  // Order Confirmation
  orderInformation: 'অর্ডারের তথ্য',
  productInformation: 'পণ্যের তথ্য',
  orderParameters: 'অর্ডার প্যারামিটার',
  titleLabel: 'শিরোনাম:',
  priceLabel: 'মূল্য:',
  brandLabel: 'ব্র্যান্ড:',
  modelLabel: 'মডেল:',
  productMedia: 'পণ্যের মিডিয়া:',
  deliveryLabel: 'ডেলিভারি:',
  deliveryPrice: 'ডেলিভারির মূল্য:',
  numberOfPlaces: 'স্থানের সংখ্যা:',
  totalLabel: 'মোট:',
  additionalInformation: 'অতিরিক্ত তথ্য:',
  sellerLabel: 'বিক্রেতা',
  buyerLabel: 'ক্রেতা',
  nameLabel: 'নাম:',
  optIdLabel: 'OPT ID:',
  telegramLabel: 'Telegram:',
  backToBuyers: 'ক্রেতাদের কাছে ফিরে যান',
  
  // Validation and messages
  dataRestored: 'ডেটা পুনরুদ্ধার করা হয়েছে',
  changesRestoredMessage: 'আপনার পরিবর্তনগুলি স্বয়ংক্রিয়ভাবে পুনরুদ্ধার করা হয়েছে',
  fieldUpdated: 'ক্ষেত্র আপডেট হয়েছে',
  changesSaved: 'পরিবর্তনগুলি সংরক্ষিত হয়েছে',
  validationError: 'বৈধতা ত্রুটি',
  titleRequired: 'পণ্যের শিরোনাম প্রয়োজন',
  priceRequired: 'মূল্য ০ এর চেয়ে বেশি হতে হবে',
  placesRequired: 'স্থানের সংখ্যা ০ এর চেয়ে বেশি হতে হবে',
  errorTitle: 'ত্রুটি',
  orderCreateError: 'অর্ডার নিশ্চিত করতে ব্যর্থ। আবার চেষ্টা করুন।',
  notSpecified: 'নির্দিষ্ট নয়',
  enterProductTitle: 'পণ্যের শিরোনাম লিখুন',
  enterBrand: 'ব্র্যান্ড লিখুন',
  enterModel: 'মডেল লিখুন',
  selectDeliveryMethod: 'ডেলিভারি পদ্ধতি নির্বাচন করুন',
  additionalInfoPlaceholder: 'অর্ডার সম্পর্কে অতিরিক্ত তথ্য নির্দিষ্ট করুন',
  additionalInfoEmpty: 'অতিরিক্ত তথ্য যোগ করতে ক্লিক করুন',
  productsFromInventory: 'আপনার ইনভেন্টরি থেকে পণ্য',
  productSelected: 'পণ্য নির্বাচিত',
  buyerSelected: 'ক্রেতা নির্বাচিত',
  orderCreationError: 'অর্ডার তৈরির ত্রুটি',
  accessError: 'অ্যাক্সেস ত্রুটি',
  onlyForSellers: 'এই পৃষ্ঠাটি কেবল বিক্রেতাদের জন্য উপলব্ধ',
  failedToLoadBuyers: 'ক্রেতাদের তালিকা লোড করতে ব্যর্থ',
  failedToLoadProducts: 'আপনার পণ্য লোড করতে ব্যর্থ',
  notAllDataFilled: 'সব তথ্য পূরণ করা হয়নি',
  
  // SellerProductDetail
  productDetail: 'পণ্যের বিশদ',
  productNotFound: 'পণ্য পাওয়া যায়নি',
  accessDenied: 'অ্যাক্সেস অস্বীকৃত',
  accessDeniedDescription: 'আপনি শুধুমাত্র আপনার নিজের তালিকা দেখতে পারেন। লিংকটি যাচাই করুন বা আপনার তালিকায় ফিরে যান।',
  unknownSeller: 'অজানা বিক্রেতা',
  lotLabel: 'লট',
  
  // Seller Info
  sellerInfo: {
    openProfile: '(প্রোফাইল খুলুন)',
    copyOptId: 'OPT ID কপি করুন',
    showOptId: 'OPT ID দেখান',
  },
  
  // ProductDetailAlerts
  moderationAlert: {
    pendingTitle: 'তালিকা পর্যালোচনাধীন',
    pendingDescription: 'এই তালিকাটি মডারেটর পর্যালোচনার অপেক্ষায় রয়েছে।',
    pendingDescriptionOwner: 'শুধুমাত্র আপনি এবং প্রশাসকরা এটি দেখতে পারেন।',
    pendingDescriptionAdmin: 'প্রশাসক হিসেবে, আপনি এই তালিকাটি দেখতে পারেন।',
    archivedTitle: 'তালিকা সংরক্ষণাগারভুক্ত',
    archivedDescription: 'এই তালিকাটি সংরক্ষণাগারভুক্ত।',
    archivedDescriptionOwner: 'শুধুমাত্র আপনি এবং প্রশাসকরা এটি দেখতে পারেন।',
    archivedDescriptionAdmin: 'প্রশাসক হিসেবে, আপনি এই তালিকাটি দেখতে পারেন।',
  },
  
  // Mobile actions
  mobileActions: {
    linkCopied: 'লিঙ্ক কপি করা হয়েছে',
    linkCopiedDescription: 'তালিকার লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে',
    shareText: 'এই তালিকাটি দেখুন',
    statusUpdated: 'স্ট্যাটাস আপডেট হয়েছে',
    statusUpdateDescription: 'আপনার তালিকার স্ট্যাটাস সফলভাবে পরিবর্তন করা হয়েছে।',
    statusUpdateFailed: 'তালিকার স্ট্যাটাস আপডেট করতে ব্যর্থ।',
  },
  
  // Compact offers
  compactOffers: {
    all: 'সব',
    from: 'থেকে',
    showMore: 'আরো দেখান',
  },
  
  // SellerOrderDetails
  orderDetails: 'অর্ডারের বিবরণ',
  orderNotFound: 'অর্ডার পাওয়া যায়নি',
  orderNotFoundDesc: 'নির্দিষ্ট ID সহ অর্ডারটি বিদ্যমান নেই বা আপনার দেখার অনুমতি নেই।',
  accessDeniedDesc: 'এই অর্ডার দেখার অনুমতি আপনার নেই।',
  created: 'তৈরি',
  selfOrder: 'স্ব-অর্ডার',
  confirmPhotos: 'নিশ্চিত ফটো',
  productInfo: 'পণ্যের তথ্য',
  name: 'নাম',
  brand: 'ব্র্যান্ড',
  model: 'মডেল',
  productPrice: 'পণ্যের মূল্য',
  deliveryCost: 'ডেলিভারি খরচ',
  additionalInfo: 'অতিরিক্ত তথ্য',
  mediaFiles: 'মিডিয়া ফাইল',
  photos: 'ছবি',
  files: 'ফাইল',
  open: 'খুলুন',
  participants: 'অংশগ্রহণকারী',
  seller: 'বিক্রেতা',
  buyer: 'ক্রেতা',
  buyerOptId: 'ক্রেতা OPT ID',
  delivery: 'ডেলিভারি',
  deliveryMethod: 'ডেলিভারি পদ্ধতি',
  containerNumber: 'কন্টেইনার নম্বর',
  containerStatus: 'কন্টেইনার স্ট্যাটাস',
  confirmationPhotos: 'নিশ্চিতকরণ ছবি',
  labelInstruction: 'পণ্যে লেবেল করুন এবং অর্ডারে ছবি যোগ করুন',
  
  // Status labels
  createdStatus: 'তৈরি',
  sellerConfirmed: 'বিক্রেতা নিশ্চিত',
  adminConfirmed: 'প্রশাসক নিশ্চিত',
  processingStatus: 'প্রক্রিয়াকরণ',
  shipped: 'পাঠানো হয়েছে',
  delivered: 'ডেলিভার করা হয়েছে',
  cancelled: 'বাতিল',
  
  // Delivery methods
  selfPickup: 'স্ব-সংগ্রহ',
  cargoRF: 'কার্গো RF',
  cargoKZ: 'কার্গো KZ',
  
  // Container statuses
  waiting: 'অপেক্ষা',
  inTransit: 'পথে',
  atCustoms: 'শুল্কে',

  // Additional keys for new components
  productDetailsTitle: 'পণ্যের বিবরণ',
  productInfoDetails: {
    title: 'পণ্যের তথ্য',
    views: 'দেখা হয়েছে',
    created: 'তৈরি হয়েছে'
  },
  productActions: {
    updated: 'পণ্য আপডেট হয়েছে',
    updateFailed: 'পণ্য আপডেট করা যায়নি'
  },
  register: {
    title: 'বিক্রেতা হন',
    subtitle: 'ইউএই-এর শীর্ষস্থানীয় B2B অটো পার্টস মার্কেটপ্লেসের অংশ হয়ে আপনার ব্যবসা সম্প্রসারিত করুন এবং নতুন গ্রাহকদের আকর্ষণ করুন।'
  },
  
  system: {
    error: 'ত্রুটি',
    profileIncomplete: 'প্রোফাইল অসম্পূর্ণ',
    profileIncompleteDescription: 'আপনার প্রোফাইলে OPT ID নেই। এটি পেতে প্রশাসকের সাথে যোগাযোগ করুন।',
    userNotAuthorized: 'ব্যবহারকারী অনুমোদিত নয়',
    pageError: 'পৃষ্ঠা ত্রুটি',
    pageErrorDescription: 'পৃষ্ঠা লোড করার সময় একটি ত্রুটি ঘটেছে। দয়া করে পৃষ্ঠা রিফ্রেশ করার চেষ্টা করুন।',
    cloudinaryIntegration: 'Cloudinary ইন্টিগ্রেশন',
    sellerDashboardBreadcrumb: 'বিক্রেতা ড্যাশবোর্ড',
    addProductBreadcrumb: 'পণ্য যোগ করুন',
    publishingProduct: 'পণ্য প্রকাশ করা হচ্ছে...',
    productPublished: 'পণ্য সফলভাবে প্রকাশিত',
    productSentForModeration: 'পণ্য পরিমার্জনার জন্য পাঠানো হয়েছে',
    failedToCreateProduct: 'পণ্য তৈরি করতে ব্যর্থ। দয়া করে পরে আবার চেষ্টা করুন।',
  },

  // Communication dialog
  communication: {
    connectingToTelegram: 'টেলিগ্রাম ম্যানেজারের কাছে পুনঃনির্দেশ',
    usingFallbackLink: 'যোগাযোগের জন্য বিকল্প লিঙ্ক ব্যবহার',
    telegramError: 'টেলিগ্রাম খুলতে ব্যর্থ। দয়া করে পরে আবার চেষ্টা করুন।',
    assistantContact: 'সহায়তাকারী যোগাযোগ',
    professionalContact: 'পেশাদার যোগাযোগ',
    sellerContact: 'বিক্রেতা যোগাযোগ',
  },
  
  // Order Preview Dialog
  orderPreview: {
    title: 'অর্ডার প্রিভিউ',
    description: 'অর্ডার তৈরির আগে ডেটা চেক করুন',
    ready: 'প্রস্তুত',
    product: 'পণ্য',
    participants: 'অংশগ্রহণকারী',
    seller: 'বিক্রেতা',
    buyer: 'ক্রেতা',
    brand: 'ব্র্যান্ড:',
    model: 'মডেল:',
    price: 'মূল্য',
    delivery: 'ডেলিভারি',
    places: 'স্থান',
    mediaFiles: 'মিডিয়া ফাইল',
    additionalInformation: 'অতিরিক্ত তথ্য',
    orderSummary: 'অর্ডার সারসংক্ষেপ',
    products: 'পণ্য:',
    photos: 'ছবি:',
    videos: 'ভিডিও:',
    checkDataBefore: 'অর্ডার তৈরির আগে সমস্ত ডেটা চেক করুন',
    backButton: 'পিছনে',
    createOrderButton: 'অর্ডার তৈরি করুন',
    creating: 'তৈরি হচ্ছে...',
  },

  // Video Upload
  videoUpload: {
    limitExceeded: 'সীমা অতিক্রম',
    limitExceededMessage: 'সর্বোচ্চ ভিডিও সংখ্যা',
    invalidFileFormat: 'অবৈধ ফাইল ফরম্যাট',
    invalidFileFormatMessage: 'অসমর্থিত ফরম্যাট রয়েছে',
    fileTooLarge: 'ফাইল খুব বড়',
    fileTooLargeMessage: 'অতিক্রম করে',
    uploadingToCloudinary: 'Cloudinary-তে আপলোড হচ্ছে...',
    chooseVideos: 'ভিডিও বেছে নিন',
    addVideo: 'ভিডিও যোগ করুন',
    supportedFormats: '{maxVideos} পর্যন্ত ভিডিও। সমর্থিত: mp4, mov, avi, webm। Cloudinary CDN এর মাধ্যমে আপলোড। ফাইল প্রতি সর্বোচ্চ 20MB।',
    maxFileSize: 'MB'
  },

  // Image Upload
  imageUpload: {
    title: 'অর্ডার ছবি',
    imagesCount: '{count}/{max} ছবি',
    smartUpload: 'স্মার্ট আপলোড...',
    uploadPhotos: 'ছবি আপলোড করুন ({count}/{max})',
    cancelUpload: 'আপলোড বাতিল করুন',
    imagesUploaded: '✅ ছবি আপলোড হয়েছে: {count}',
    smartCompressionLossless: '🧠 স্মার্ট কম্প্রেশন: ফাইল <400KB ক্ষতিহীন',
    smartCompressionActive: '🧠 স্মার্ট কম্প্রেশন সক্রিয়',
    compressionInfo: {
      lossless: '• ফাইল <400KB - কোন সংকোচন নেই (মূল গুণমান)',
      light: '• ফাইল 400KB-2MB - হালকা সংকোচন (90% গুণমান)',
      adaptive: '• ফাইল >2MB - অভিযোজিত সংকোচন'
    }
  },

  media: {
    uploadPhotos: 'ছবি আপলোড করুন',
    addMorePhotos: 'আরও ছবি যোগ করুন',
    uploadVideos: 'ভিডিও আপলোড করুন',
    smartUpload: 'স্মার্ট আপলোড...',
    cancelUpload: 'আপলোড বাতিল করুন',
    mediaFiles: 'মিডিয়া ফাইল',
    photos: 'ছবি',
    videos: 'ভিডিও',
    smartCompression: 'পণ্যের জন্য স্মার্ট কম্প্রেশন',
    smartCompressionDescription: 'ছোট ফাইল (<400KB) মূল গুণমান বজায় রাখে\nবড় ফাইলগুলি বিস্তারিত হারানো ছাড়াই অভিযোজিত সংকোচন হয়',
    uploadedVideos: 'আপলোড করা ভিডিও',
    mediaCount: 'মিডিয়া ফাইল',
    smartQuality: 'স্মার্ট মান',
    photoCount: 'ছবি: {count} এর মধ্যে {max}',
  },
};

export const sellerPagesTranslations: Record<Lang, SellerPagesTranslations> = {
  ru,
  en,
  bn,
};

export const getSellerPagesTranslations = (lang: Lang): SellerPagesTranslations => {
  return sellerPagesTranslations[lang] || sellerPagesTranslations.en;
};
