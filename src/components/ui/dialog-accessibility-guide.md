
# Dialog Accessibility Guide

## Обязательные требования для DialogContent

Каждый `DialogContent` **ДОЛЖЕН** иметь соответствующий `DialogTitle` для обеспечения доступности.

### ✅ Правильное использование:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Название диалога</DialogTitle>
      <DialogDescription>Описание диалога (опционально)</DialogDescription>
    </DialogHeader>
    {/* Содержимое диалога */}
  </DialogContent>
</Dialog>
```

### ✅ Скрытый заголовок для визуального дизайна:

```tsx
import { VisuallyHidden } from "@/components/ui/visually-hidden";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <VisuallyHidden>
      <DialogTitle>Название для скринридеров</DialogTitle>
    </VisuallyHidden>
    {/* Содержимое диалога без видимого заголовка */}
  </DialogContent>
</Dialog>
```

### ❌ Неправильное использование:

```tsx
// НЕ ДЕЛАЙТЕ ТАК - отсутствует DialogTitle
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Содержимое без заголовка */}
  </DialogContent>
</Dialog>
```

## Почему это важно?

- **Скринридеры** используют DialogTitle для объявления содержимого диалога
- **Навигация с клавиатуры** требует четкой идентификации элементов
- **WCAG 2.1** требования для доступности веб-контента
- **SEO** и семантическая разметка

## Рекомендации по заголовкам:

1. **Описательные**: "Редактирование профиля", "Подтверждение удаления"
2. **Краткие**: не более 5-7 слов
3. **Уникальные**: каждый диалог должен иметь уникальный заголовок
4. **На русском языке**: соответствовать языку интерфейса

## Компоненты для использования:

- `DialogTitle` - видимый заголовок
- `DialogDescription` - дополнительное описание
- `VisuallyHidden` - для скрытых заголовков
- `DialogHeader` - контейнер для заголовка и описания
