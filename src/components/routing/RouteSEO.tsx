
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeMetaData: Record<string, { title: string; description: string; keywords: string }> = {
  '/': {
    title: 'PartsBay.ae - Оптовый рынок автозапчастей из ОАЭ',
    description: 'B2B маркетплейс автозапчастей. Покупайте оптом у проверенных поставщиков из ОАЭ.',
    keywords: 'автозапчасти оптом, ОАЭ, Дубай, B2B маркетплейс'
  },
  '/catalog': {
    title: 'Каталог автозапчастей - PartsBay.ae',
    description: 'Широкий выбор автозапчастей от проверенных поставщиков из ОАЭ. Оптовые цены.',
    keywords: 'каталог автозапчастей, запчасти оптом, ОАЭ'
  },
  '/stores': {
    title: 'Магазины автозапчастей - PartsBay.ae',
    description: 'Проверенные магазины и поставщики автозапчастей в ОАЭ.',
    keywords: 'магазины автозапчастей, поставщики ОАЭ'
  },
  '/requests': {
    title: 'Запросы на автозапчасти - PartsBay.ae',
    description: 'Разместите запрос на нужные автозапчасти и получите предложения от поставщиков.',
    keywords: 'запросы автозапчасти, поиск запчастей'
  },
  '/about': {
    title: 'О нас - PartsBay.ae',
    description: 'PartsBay.ae - лидирующий B2B маркетплейс автозапчастей из ОАЭ.',
    keywords: 'о компании, PartsBay, автозапчасти ОАЭ'
  },
  '/contact': {
    title: 'Контакты - PartsBay.ae',
    description: 'Свяжитесь с нами для получения информации о сотрудничестве.',
    keywords: 'контакты, связаться, PartsBay'
  }
};

const RouteSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const currentRoute = location.pathname;
    const meta = routeMetaData[currentRoute];

    if (meta) {
      document.title = meta.title;
      
      // Устанавливаем meta description
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) {
        descriptionMeta.setAttribute('content', meta.description);
      }

      // Устанавливаем meta keywords
      const keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (keywordsMeta) {
        keywordsMeta.setAttribute('content', meta.keywords);
      }
    }
  }, [location]);

  return null;
};

export default RouteSEO;
