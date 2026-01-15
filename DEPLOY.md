# Инструкция по деплою

## Почему возникала проблема со старой версией?

### Причины в development режиме:
1. **Кеш Vite** (`node_modules/.vite`) - хранит оптимизированные зависимости
2. **Кеш браузера** - браузер кеширует JS/CSS файлы
3. **HMR (Hot Module Replacement)** - иногда не подхватывает изменения

### Решение:
- Очистка кеша Vite: `rm -rf node_modules/.vite`
- Жесткая перезагрузка браузера: `Ctrl+Shift+R` (или `Cmd+Shift+R` на Mac)
- Перезапуск dev-сервера

## Production деплой - проблемы НЕ будет!

### Почему в production все будет работать:

1. **Vite автоматически добавляет хеши к именам файлов:**
   - `main.js` → `main.a1b2c3d4.js`
   - `style.css` → `style.e5f6g7h8.css`
   
2. **При каждом обновлении имена файлов меняются:**
   - Старая версия: `main.abc123.js`
   - Новая версия: `main.def456.js`
   - Браузер автоматически загрузит новый файл

3. **index.html НЕ кешируется:**
   - Vite не добавляет хеш к `index.html`
   - Браузер всегда загружает свежий `index.html`
   - `index.html` содержит ссылки на файлы с новыми хешами

### Рекомендации для production:

1. **Настройте сервер правильно:**
   ```nginx
   # Для index.html - не кешировать
   location = /index.html {
     add_header Cache-Control "no-cache, no-store, must-revalidate";
   }
   
   # Для статических файлов с хешами - кешировать долго
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   ```

2. **При деплое всегда делайте:**
   ```bash
   # Очистите старую сборку
   rm -rf dist
   
   # Соберите новую версию
   npm run build
   
   # Задеплойте dist/ на сервер
   ```

3. **Проверьте, что файлы с хешами генерируются:**
   ```bash
   npm run build
   ls -la dist/assets/
   # Должны быть файлы типа: main.abc123.js, style.def456.css
   ```

## Итог:

✅ **В production проблем НЕ будет** - Vite автоматически решает проблему кеширования через хеши файлов

⚠️ **В development** - иногда нужно очищать кеш вручную
