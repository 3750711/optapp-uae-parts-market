
const handleContactTelegram = () => {
  if (product?.telegram_url) {
    const productUrl = product?.product_url || `https://preview--optapp-uae-parts-market.lovable.app/product/${id}`;
    const message = `I'm interested in this product, ${productUrl} please can you send more information`;
    window.open(`https://t.me/${product.telegram_url}?text=${message}`, '_blank', 'noopener,noreferrer');
  } else {
    toast({
      title: "Ошибка",
      description: "Telegram продавца недоступен",
      variant: "destructive"
    });
  }
};

const handleContactWhatsApp = () => {
  if (product?.phone_url) {
    const productUrl = product?.product_url || `https://preview--optapp-uae-parts-market.lovable.app/product/${id}`;
    const message = `I'm interested in this product, ${productUrl} please can you send more information`;
    window.open(`https://wa.me/${product.phone_url}?text=${message}`, '_blank', 'noopener,noreferrer');
  } else {
    toast({
      title: "Ошибка",
      description: "Номер телефона продавца недоступен",
      variant: "destructive"
    });
  }
};
