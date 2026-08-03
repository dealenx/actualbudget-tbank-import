export interface TbankRow {
  date: string;
  amount: number;
  payee: string;
  notes: string;
  importedId: string;
}

interface TbankRawRow {
  accountNumber: string;
  operationType: string;
  dateRaw: string;
  paymentNumber: string;
  currency: string;
  amountRaw: string;
  accountCurrency: string;
  operationDescription: string;
  paymentPurpose: string;
  payerAccount: string;
  payerInn: string;
  payerKpp: string;
  payerName: string;
  payerBic: string;
  payerCorrAccount: string;
  recipientAccount: string;
  recipientContract: string;
  recipientInn: string;
  recipientKpp: string;
  recipientName: string;
  recipientBic: string;
  recipientCorrAccount: string;
  counterpartyAccount: string;
  counterpartyInn: string;
  counterpartyName: string;
  counterpartyBic: string;
}

export function parseTbankCsv(csvText: string): TbankRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const rawRows: TbankRawRow[] = [];
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

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
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

function convertRow(raw: TbankRawRow): TbankRow {
  return {
    date: convertDate(raw.dateRaw),
    amount: parseAmount(raw.amountRaw, raw.operationType),
    payee: extractPayee(raw),
    notes: extractNotes(raw),
    importedId: raw.paymentNumber,
  };
}

function convertDate(dateStr: string): string {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseAmount(amountStr: string, operationType: string): number {
  const normalized = amountStr.replace(',', '.').replace(/\s/g, '');
  const value = parseFloat(normalized);
  if (isNaN(value)) return 0;
  return operationType === 'Дебет' ? -Math.abs(value) : Math.abs(value);
}

function extractPayee(raw: TbankRawRow): string {
  return raw.counterpartyName || raw.payerName || raw.recipientName || '';
}

function extractNotes(raw: TbankRawRow): string {
  return raw.paymentPurpose || raw.operationDescription || '';
}

export function convertToActualCsv(rows: TbankRow[]): string {
  const header = 'Date,Payee,Notes,Amount,ImportedID';
  const lines = rows.map((r) => {
    const amount = r.amount.toFixed(2);
    return `${r.date},${escapeCsvField(r.payee)},${escapeCsvField(r.notes)},${amount},${r.importedId}`;
  });
  return [header, ...lines].join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
