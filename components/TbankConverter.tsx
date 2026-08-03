'use client';

import { useState, useRef, useCallback } from 'react';
import { parseTbankCsv, convertToActualCsv, type TbankRow } from '@/lib/tbank-converter';

export default function TbankConverter() {
  const [rows, setRows] = useState<TbankRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-8 text-center max-w-md">
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

            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              Период: {dateRange}
            </p>

            <div className="mt-6 w-full overflow-x-auto">
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

            <button
              onClick={handleDownload}
              className="mt-6 h-12 px-8 rounded-full bg-black text-white dark:bg-white dark:text-black font-medium hover:opacity-80 transition-opacity"
            >
              Скачать CSV для Actual Budget
            </button>
          </>
        )}
      </main>
    </div>
  );
}
