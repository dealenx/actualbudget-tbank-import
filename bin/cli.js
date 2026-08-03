#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ABBREVIATIONS = [
  'АО', 'ЗАО', 'ОАО', 'ООО', 'ПАО', 'ИП', 'НКО', 'КПК',
  'СНТ', 'ДНТ', 'ТСН', 'ТСЖ', 'ЖСК', 'ГУП', 'МУП',
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePayee(name) {
  let result = name;
  for (const abbr of ABBREVIATIONS) {
    const regex = new RegExp(`(?<=^|[\\s"])${escapeRegex(abbr)}(?=[\\s"]|$)`,'gi');
    result = result.replace(regex, abbr);
  }
  return result;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function convertDate(dateStr) {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
}

function parseAmount(amountStr, operationType) {
  const normalized = amountStr.replace(',','.').replace(/\s/g,'');
  const value = parseFloat(normalized);
  if (isNaN(value)) return 0;
  return operationType === 'Дебет' ? -Math.abs(value) : Math.abs(value);
}

function extractPayee(raw) {
  return normalizePayee(raw.counterpartyName || raw.payerName || raw.recipientName || '');
}

function extractNotes(raw) {
  return raw.paymentPurpose || raw.operationDescription || '';
}

function convertRow(raw) {
  return {
    date: convertDate(raw.dateRaw),
    amount: parseAmount(raw.amountRaw, raw.operationType),
    payee: extractPayee(raw),
    notes: extractNotes(raw),
    importedId: raw.paymentNumber,
  };
}

function parseTbankCsv(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const rawRows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 26) continue;
    rawRows.push({
      accountNumber: cols[0],
      operationType: cols[1],
      dateRaw: cols[2],
      paymentNumber: cols[3],
      currency: cols[4],
      amountRaw: cols[5],
      accountCurrency: cols[6],
      operationDescription: cols[7],
      paymentPurpose: cols[8],
      payerAccount: cols[9],
      payerInn: cols[10],
      payerKpp: cols[11],
      payerName: cols[12],
      payerBic: cols[13],
      payerCorrAccount: cols[14],
      recipientAccount: cols[15],
      recipientContract: cols[16],
      recipientInn: cols[17],
      recipientKpp: cols[18],
      recipientName: cols[19],
      recipientBic: cols[20],
      recipientCorrAccount: cols[21],
      counterpartyAccount: cols[22],
      counterpartyInn: cols[23],
      counterpartyName: cols[24],
      counterpartyBic: cols[25],
    });
  }

  return rawRows.map(convertRow);
}

function escapeCsvField(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g,'""')}"`;
  }
  return value;
}

function convertToActualCsv(rows) {
  const header = 'Date,Payee,Notes,Amount,ImportedID';
  const lines = rows.map(r => {
    const amount = r.amount.toFixed(2);
    return `${r.date},${escapeCsvField(r.payee)},${escapeCsvField(r.notes)},${amount},${r.importedId}`;
  });
  return [header, ...lines].join('\n');
}

function stripBom(text) {
  if (text.charCodeAt(0) === 0xFEFF) return text.slice(1);
  return text;
}

function main() {
  const args = process.argv.slice(2);

  function getInput() {
    if (args.length > 0) {
      const filePath = path.resolve(args[0]);
      let raw = fs.readFileSync(filePath, 'utf-8');
      raw = stripBom(raw);
      return raw;
    }
    const raw = fs.readFileSync(0, 'utf-8');
    return stripBom(raw);
  }

  function writeOutput(csv) {
    const bom = '\uFEFF';
    const content = bom + csv;
    if (args.length > 1) {
      fs.writeFileSync(path.resolve(args[1]), content, 'utf-8');
    } else if (args.length === 1) {
      const inputPath = path.resolve(args[0]);
      const parsed = path.parse(inputPath);
      const outputPath = path.join(parsed.dir, parsed.name + '-converted' + parsed.ext);
      fs.writeFileSync(outputPath, content, 'utf-8');
      process.stderr.write(`Сохранено: ${outputPath}\n`);
    } else {
      process.stdout.write(content);
    }
  }

  try {
    const csvText = getInput();
    const rows = parseTbankCsv(csvText);
    if (rows.length === 0) {
      process.stderr.write('Ошибка: не найдено транзакций. Проверьте формат файла.\n');
      process.exit(1);
    }
    const csv = convertToActualCsv(rows);
    writeOutput(csv);
  } catch (err) {
    process.stderr.write(`Ошибка: ${err.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseTbankCsv, convertToActualCsv };
