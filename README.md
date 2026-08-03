# Т-Банк → Actual Budget

Конвертер выписки Т-Банка (расчётный счёт ИП) в CSV для импорта в [Actual Budget](https://actualbudget.org).

Вся конвертация происходит локально — данные не отправляются на сервер.

## Использование

### Веб-версия (проще всего)

Откройте [страницу на GitHub Pages](https://dealenx.github.io/actualbudget-tbank-import/), перетащите CSV-файл и скачайте конвертированный.

### CLI (локально, без браузера)

```bash
bunx github:dealenx/actualbudget-tbank-import выписка.csv
```

Рядом с файлом появится `выписка-converted.csv` — его импортировать в Actual Budget.

**Или напрямую (без bunx):**

```bash
node bin/cli.js выписка.csv
```

**Или через stdin/stdout:**

```bash
cat выписка.csv | node bin/cli.js > результат.csv
```

## Импорт в Actual Budget

1. Откройте счёт → **Import** → выберите `-converted.csv`
2. Разделитель: `,` (запятая)
3. Формат даты: `yyyy-mm-dd`
4. Сопоставьте колонки: Date, Payee, Notes, Amount

## Формат на входе

Ожидается выписка Т-Банка для ИП в формате CSV (разделитель `;`, кодировка UTF-8 или Windows-1251).

## Разработка

```bash
bun install
bun run dev     # веб-версия локально
bun run build   # сборка для GitHub Pages
bun run vitest  # тесты
```
