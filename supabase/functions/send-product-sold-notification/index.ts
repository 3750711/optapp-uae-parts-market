
// ======================== IMPORTANT NOTICE ========================
// Функция для отправки уведомления о продаже товара в Telegram
// при создании заказа с привязкой к товару.
// 
// Version: 1.0.0
// Created: 2025-05-22
// ================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Настройки CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Константы для API Telegram
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7251106221:AAE3UaXbAejz1SzkhknDTrsASjpe-glhL0s';
const PRODUCT_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-4623601047';

// Основная функция сервера
serve(async (req) => {
  // Обрабатываем CORS preflight запросы
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Создаем Supabase клиент
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // Парсим данные запроса
    const reqData = await req.json();
    console.log('Получены данные запроса:', reqData);

    // Проверяем обязательные параметры
    if (!reqData.productId) {
      console.log('Отсутствует обязательный параметр productId');
      return new Response(
        JSON.stringify({ error: 'Отсутствует обязательный параметр productId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Получаем информацию о товаре
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', reqData.productId)
      .single();

    if (productError) {
      console.error('Ошибка при получении данных товара:', productError);
      return new Response(
        JSON.stringify({ error: 'Не удалось получить информацию о товаре' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!product) {
      console.log('Товар не найден');
      return new Response(
        JSON.stringify({ error: 'Товар не найден' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Найден товар:', product.title, 'статус:', product.status);

    // Формируем текст сообщения
    const brandModel = [product.brand, product.model].filter(Boolean).join(' ');
    const messageText = `😔 Жаль, но Лот #${product.lot_number} ${product.title} ${brandModel} уже ушел!\nКто-то оказался быстрее... в следующий раз повезет - будь начеку.`;
    
    console.log('Отправляем сообщение в Telegram:', messageText);

    // Отправляем сообщение в Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: PRODUCT_GROUP_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error('Ошибка при отправке сообщения в Telegram:', telegramData);
      return new Response(
        JSON.stringify({ error: 'Ошибка при отправке сообщения в Telegram', details: telegramData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Уведомление о продаже товара успешно отправлено');

    // Возвращаем успешный ответ
    return new Response(
      JSON.stringify({ success: true, message: 'Уведомление о продаже товара успешно отправлено' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
