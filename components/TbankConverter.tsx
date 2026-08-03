'use client';

import { useState, useRef, useCallback } from 'react';
import { parseTbankCsv, convertToActualCsv, type TbankRow } from '@/lib/tbank-converter';

export default function TbankConverter() {
  const [rows, setRows] = useState<TbankRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSample, setIsSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsv = `Номер счёта;Тип операции (пополнение/списание);Дата проведения;Номер платежа;Валюта операции;Сумма в валюте счёта;Валюта счёта;Описание операции;Назначение платежа;Счет плательщика;ИНН плательщика;КПП плательщика;Наименование плательщика;БИК банка плательщика;Корр. счет плательщика;Счет получателя;Договор получателя;ИНН получателя;КПП получателя;Наименование получателя;БИК банка получателя;Корр. счет получателя;Счет контрагента;ИНН контрагента;Наименование контрагента;БИК банка контрагента
40802810500003893212;Кредит;05.02.2026;1001;643;15000,0;643;Поступление от контрагента;Оплата по договору №45 от 01.02.2026;40702810202500088523;7712345678;;ООО "ПОСТАВЩИК";044525104;30101810745374525104;40802810500003893212;7059104955;421414680099;;ИП Иванов Иван Иванович;044525974;30101810145250000974;40702810202500088523;7712345678;ООО "ПОСТАВЩИК";044525104
40802810500003893212;Дебет;10.02.2026;1002;643;3200,0;643;Оплата услуг хостинга;За услуги хостинга за февраль 2026;40802810500003893212;421414680099;0;ИП Иванов Иван Иванович;044525974;30101810145250000974;40817810900028356756;7059104955;7710140679;771301001;АО "ТБанк";044525974;30101810145250000974;40817810900028356756;7710140679;АО "ТБанк";044525974
40802810500003893212;Кредит;15.03.2026;1003;643;8500,0;643;Возврат от поставщика;Возврат излишне уплаченных средств по счёту №123;40702810202500088523;7712345678;;ООО "ПОСТАВЩИК";044525104;30101810745374525104;40802810500003893212;7059104955;421414680099;;ИП Иванов Иван Иванович;044525974;30101810145250000974;40702810202500088523;7712345678;ООО "ПОСТАВЩИК";044525104
40802810500003893212;Дебет;20.03.2026;1004;643;1200,0;643;Пополнение карты;Перевод собственных средств на карту *1234;40802810500003893212;421414680099;0;ИП Иванов Иван Иванович;044525974;30101810145250000974;40817810900028356756;5314503680;421414680099;0;Иванов Иван;044525974;30101810145250000974;40817810900028356756;421414680099;Иванов Иван;044525974
40802810500003893212;Дебет;05.04.2026;1005;643;500,0;643;Комиссия за обслуживание;Плата за обслуживание счета за март 2026;40802810500003893212;421414680099;0;ИП Иванов Иван Иванович;044525974;30101810145250000974;47423810800008227871;7059104955;7710140679;771301001;АО "ТБанк";044525974;30101810145250000974;47423810800008227871;7710140679;АО "ТБанк";044525974`;

  const loadSample = () => {
    setError(null);
    setFileName('example.csv');
    setIsSample(true);
    const parsed = parseTbankCsv(sampleCsv);
    setRows(parsed);
  };

  const downloadSampleOriginal = () => {
    const blob = new Blob(['\uFEFF' + sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_tbank.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleConverted = () => {
    const parsed = parseTbankCsv(sampleCsv);
    const csv = convertToActualCsv(parsed);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_actualbudget.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseTbankCsv(text);
        if (parsed.length === 0) {
          setError('Не найдено транзакций. Проверьте формат файла.');
          setRows([]);
          return;
        }
        setRows(parsed);
      } catch {
        setError('Ошибка при обработке файла. Проверьте формат CSV.');
        setRows([]);
      }
    };
    reader.onerror = () => {
      setError('Не удалось прочитать файл.');
    };
    reader.readAsText(file, 'windows-1251');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDownload = () => {
    const csv = convertToActualCsv(rows);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.csv$/i, '') + '_for_actualbudget.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalInflow = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const totalOutflow = rows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  const dateRange = rows.length > 0
    ? `${rows[0].date} — ${rows[rows.length - 1].date}`
    : '—';

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-center py-16 px-8 bg-white dark:bg-black">
        <div className="flex items-center gap-3 mb-2">
          <img src="/actualbudget-tbank-import/tbank-logo.svg" alt="Т-Банк" className="h-8" />
          <span className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">→</span>
          <img src="/actualbudget-tbank-import/actual-logo.webp" alt="Actual Budget" className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50 mb-1">
          Т-Банк → Actual Budget
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-2 text-center max-w-md">
          Конвертер выписки Т-Банка в CSV для импорта в Actual Budget
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-12 text-center max-w-md">
          Ваши данные не отправляются на сервер — вся конвертация происходит в вашем браузере.
        </p>

        <div
          className={`w-full max-w-lg border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-4xl mb-3 text-zinc-400">📄</div>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
            {isDragging ? 'Отпустите файл' : 'Нажмите или перетащите CSV-файл'}
          </p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
            Выписка Т-Банка в формате .csv
          </p>
        </div>

        <div className="mt-16 w-full max-w-lg">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-black px-4 text-xs text-zinc-400 dark:text-zinc-500">или попробуйте с примером</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={loadSample}
              className="w-full h-11 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-medium hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
            >
              Загрузить пример выписки
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm max-w-lg w-full">
            {error}
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-lg text-center">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                <div className="text-2xl font-semibold text-black dark:text-zinc-50">{rows.length}</div>
                <div className="text-xs text-zinc-500 mt-1">Транзакций</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                <div className="text-2xl font-semibold text-green-700 dark:text-green-300">
                  {totalInflow.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Поступления</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                <div className="text-2xl font-semibold text-red-700 dark:text-red-300">
                  {totalOutflow.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">Списания</div>
              </div>
            </div>

            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
              Период: {dateRange}
            </p>

            <div className="mt-8 w-full overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Дата</th>
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Контрагент</th>
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Назначение</th>
                    <th className="text-right py-2 px-3 text-zinc-500 font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{row.date}</td>
                      <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate">{row.payee}</td>
                      <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400 max-w-[300px] truncate">{row.notes}</td>
                      <td className={`py-2 px-3 text-right whitespace-nowrap font-medium ${row.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {row.amount >= 0 ? '+' : ''}{row.amount.toFixed(2)} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isSample && (
              <div className="mt-6 flex gap-4 w-full">
                <button
                  onClick={downloadSampleOriginal}
                  className="flex-1 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 font-medium hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                >
                  Скачать пример Т-Банк
                </button>
                <button
                  onClick={downloadSampleConverted}
                  className="flex-1 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 font-medium hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                >
                  Скачать пример Actual
                </button>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleDownload}
                className="h-12 px-8 rounded-full bg-black text-white dark:bg-white dark:text-black font-medium hover:opacity-80 transition-opacity"
              >
                Скачать CSV для Actual Budget
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
