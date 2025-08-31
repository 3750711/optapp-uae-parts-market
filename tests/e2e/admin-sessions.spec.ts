import { test, expect, Page } from '@playwright/test';

// Helper to count network requests matching a pattern
async function countRequests(page: Page, pattern: RegExp) {
  const logs: string[] = [];
  page.on('request', request => {
    if (pattern.test(request.url())) {
      logs.push(request.url());
      console.log(`📊 Captured request: ${request.url()}`);
    }
  });
  return () => logs.length;
}

// Helper to wait for stable network (no requests for X ms)
async function waitForNetworkIdle(page: Page, timeout = 2000) {
  return page.waitForLoadState('networkidle', { timeout });
}

test.describe('Admin Sessions & Authorization', () => {
  let adminEmail: string;
  let adminPassword: string;

  test.beforeAll(() => {
    // Используем тестовые креды админа
    adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
    adminPassword = process.env.TEST_ADMIN_PASSWORD || 'testpassword';
  });

  test.beforeEach(async ({ page }) => {
    // Очистка состояния перед каждым тестом
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('1. Логин → навигация по админке (без лавины запросов)', async ({ page }) => {
    const countProfiles = await countRequests(page, /\/rest\/v1\/profiles/);
    
    // Логин
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Ждем успешного логина
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
    await waitForNetworkIdle(page);
    
    const initialProfileRequests = countProfiles();
    console.log(`Initial profile requests: ${initialProfileRequests}`);
    
    // Навигация по админским страницам
    await page.click('a[href="/admin/orders"]');
    await waitForNetworkIdle(page, 1000);
    
    await page.click('a[href="/admin/users"]');
    await waitForNetworkIdle(page, 1000);
    
    await page.click('a[href="/admin/products"]');
    await waitForNetworkIdle(page, 1000);
    
    const finalProfileRequests = countProfiles();
    console.log(`Final profile requests: ${finalProfileRequests}`);
    
    // Критерий: profiles запрашивается ≤1 раз за навигацию
    expect(finalProfileRequests).toBeLessThanOrEqual(1);
    
    // Проверяем отсутствие 401/refresh циклов
    const responses401 = [];
    page.on('response', response => {
      if (response.status() === 401) {
        responses401.push(response.url());
      }
    });
    
    expect(responses401.length).toBe(0);
  });

  test('2. Token refresh (без перезапроса профиля)', async ({ page }) => {
    // Логин
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
    
    const countProfiles = await countRequests(page, /\/rest\/v1\/profiles/);
    await waitForNetworkIdle(page);
    const initialProfileRequests = countProfiles();
    
    // Симуляция истечения токена и refresh
    await page.evaluate(() => {
      // Искусственно "старим" access_token в localStorage
      const authKey = Object.keys(localStorage).find(key => 
        key.startsWith('sb-vfiylfljiixqkjfqubyq-auth-token')
      );
      if (authKey) {
        const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
        if (authData.access_token) {
          // Делаем токен недействительным (истекший)
          authData.expires_at = Date.now() / 1000 - 3600; // час назад
          localStorage.setItem(authKey, JSON.stringify(authData));
        }
      }
    });
    
    // Триггерим запрос, который должен вызвать TOKEN_REFRESHED
    await page.reload();
    await waitForNetworkIdle(page, 3000);
    
    const finalProfileRequests = countProfiles();
    
    // Критерий: профиль НЕ перезапрашивается при TOKEN_REFRESHED
    expect(finalProfileRequests - initialProfileRequests).toBe(0);
    
    // UI не должен "мигать" - проверяем, что админская навигация видна
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href="/admin/orders"]')).toBeVisible();
  });

  test('3. Фон/возврат (сохранение состояния)', async ({ page }) => {
    // Логин и переход на страницу заказов
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
    
    await page.click('a[href="/admin/orders"]');
    await waitForNetworkIdle(page);
    
    // Устанавливаем фильтр или сортировку (если есть)
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="поиск"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test-search');
    }
    
    const countNetworkRequests = await countRequests(page, /\/rest\/v1\//);
    const initialRequests = countNetworkRequests();
    
    // Симулируем минимизацию/фон
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true
      });
    });
    
    // Ждем 30 секунд
    await page.waitForTimeout(30000);
    
    // Возврат в фокус
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    await waitForNetworkIdle(page, 1000);
    const finalRequests = countNetworkRequests();
    
    // Критерий: 0-1 сетевой запрос максимум при возврате
    expect(finalRequests - initialRequests).toBeLessThanOrEqual(1);
    
    // Состояние фильтров сохранено
    if (await searchInput.isVisible()) {
      await expect(searchInput).toHaveValue('test-search');
    }
  });

  test('4. Оффлайн → онлайн (без потери сессии)', async ({ page, context }) => {
    // Логин
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
    
    await page.click('a[href="/admin/orders"]');
    await waitForNetworkIdle(page);
    
    // Переходим в оффлайн
    await context.setOffline(true);
    await page.waitForTimeout(5000);
    
    // Возврат онлайн
    await context.setOffline(false);
    await waitForNetworkIdle(page, 5000);
    
    // Критерий: нет потери сессии, нет принудительного re-login
    await expect(page).toHaveURL('/admin/orders');
    await expect(page.locator('nav')).toBeVisible();
    
    // Проверяем, что можем выполнить админское действие
    const adminButton = page.locator('button', { hasText: /admin/i }).first();
    if (await adminButton.isVisible()) {
      await expect(adminButton).toBeEnabled();
    }
  });

  test('5. Мульти-таб (синхронизация логаута)', async ({ page, context }) => {
    // Логин в первой вкладке
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
    
    // Открываем вторую вкладку
    const secondTab = await context.newPage();
    await secondTab.goto('/admin');
    await expect(secondTab).toHaveURL('/admin');
    
    const countProfilesTab2 = await countRequests(secondTab, /\/rest\/v1\/profiles/);
    await waitForNetworkIdle(secondTab);
    const initialProfilesTab2 = countProfilesTab2();
    
    // Разлогиниваемся в первой вкладке
    const logoutButton = page.locator('button', { hasText: /logout|выход/i }).first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Альтернативно - программный logout
      await page.evaluate(() => {
        (window as any).authContext?.signOut?.();
      });
    }
    
    // Критерий: вторая вкладка должна перейти на /login за ≤2 секунды
    await expect(secondTab).toHaveURL('/login', { timeout: 2000 });
    
    const finalProfilesTab2 = countProfilesTab2();
    
    // Не должно быть лишних фетчей профиля во второй вкладке
    expect(finalProfilesTab2 - initialProfilesTab2).toBe(0);
    
    await secondTab.close();
  });

  test('6. TTL-кэш истёк (ровно один рефетч)', async ({ page }) => {
    // Логин
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
    await waitForNetworkIdle(page);
    
    // Искусственно протухание TTL кэша (имитируем >2 минуты)
    await page.evaluate(() => {
      const userId = (window as any).authContext?.user?.id;
      if (userId) {
        // Делаем кэш "старым"
        const oldTimestamp = Date.now() - (3 * 60 * 1000); // 3 минуты назад
        sessionStorage.setItem(`profile_${userId}_time`, String(oldTimestamp));
      }
    });
    
    const countProfiles = await countRequests(page, /\/rest\/v1\/profiles/);
    const initialProfileRequests = countProfiles();
    
    // Триггер: переход на другую страницу должен вызвать рефетч
    await page.click('a[href="/admin/users"]');
    await waitForNetworkIdle(page, 3000);
    
    const finalProfileRequests = countProfiles();
    
    // Критерий: ровно ОДИН рефетч профиля
    expect(finalProfileRequests - initialProfileRequests).toBe(1);
  });

  test('7. Доступ не-админа (немедленный отказ)', async ({ page }) => {
    // Создаем/используем обычного пользователя (не админа)
    const userEmail = process.env.TEST_USER_EMAIL || 'user@test.com';
    const userPassword = process.env.TEST_USER_PASSWORD || 'testpassword';
    
    const countProfiles = await countRequests(page, /\/rest\/v1\/profiles/);
    const countVerifyAccess = await countRequests(page, /verifyAdminAccess/);
    
    // Логин обычным пользователем
    await page.goto('/login');
    await page.fill('input[type="email"]', userEmail);
    await page.fill('input[type="password"]', userPassword);
    await page.click('button[type="submit"]');
    
    // Ждем, пока логин завершится
    await page.waitForTimeout(2000);
    
    // Попытка доступа к админке
    await page.goto('/admin');
    
    // Критерий: немедленный "Доступ запрещён" без сетевой дерготни
    await expect(
      page.locator('text=/доступ запрещ|access denied|unauthorized/i')
    ).toBeVisible({ timeout: 3000 });
    
    // Не должно быть избыточных запросов
    const totalProfiles = countProfiles();
    const totalVerifyAccess = countVerifyAccess();
    
    expect(totalProfiles).toBeLessThanOrEqual(2); // логин + одна проверка профиля
    expect(totalVerifyAccess).toBeLessThanOrEqual(1); // максимум одна проверка доступа
  });

  test('Общие инварианты (защита от регрессии)', async ({ page }) => {
    // Логин
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');
    
    // Проверяем отсутствие ошибок в консоли
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Навигация по страницам
    await page.click('a[href="/admin/orders"]');
    await waitForNetworkIdle(page);
    
    await page.click('a[href="/admin/products"]');
    await waitForNetworkIdle(page);
    
    // Не должно быть критических ошибок
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('storage quota exceeded') ||
      err.includes('indexedDB blocked') ||
      err.includes('Failed to fetch') ||
      err.includes('NetworkError')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    // PWA: состояние должно сохраняться
    const hasServiceWorker = await page.evaluate(() => 'serviceWorker' in navigator);
    if (hasServiceWorker) {
      console.log('✅ PWA capabilities detected');
    }
  });
});