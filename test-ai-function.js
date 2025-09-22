// Тестовый скрипт для AI обогащения
// Выполнить в консоли браузера на странице /admin/settings

const testAIEnrichment = async () => {
  const productData = {
    product_id: "ee604f77-64e4-4dbc-94e1-d74ff469126b",
    title: "Renault clio. Nose cut bonnet fender 2pcs back lights 2pcs back bumper digi side mirror 2pcs",
    brand: "",
    model: ""
  };

  console.log("🧪 Testing AI enrichment with:", productData);

  try {
    // Используем Supabase client из глобального контекста
    const { data, error } = await supabase.functions.invoke('ai-enrich-product', {
      body: productData
    });

    if (error) {
      console.error("❌ AI Function Error:", error);
      return;
    }

    console.log("✅ AI Enrichment Success:", data);
    
  } catch (err) {
    console.error("❌ Test Error:", err);
  }
};

// Запуск теста
testAIEnrichment();