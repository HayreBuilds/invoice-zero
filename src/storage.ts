import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DATA_DIR = path.join(os.homedir(), ".invoice-zero");
const DATA_FILE = path.join(DATA_DIR, "data.json");

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  taxRate: number;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  description: string;
  hours: number;
  rate: number;
  date: string;
  invoiceId?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
  notes: string;
  dueDate: string;
  issuedDate: string;
  paidDate?: string;
  createdAt: string;
}

export interface BusinessInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  logo?: string;
  bankDetails?: string;
  currency: string;
  defaultRate: number;
  defaultTaxRate: number;
}

export interface AppData {
  business: BusinessInfo;
  clients: Client[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  nextInvoiceNumber: number;
}

function ensureDir() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 }); }

const DEFAULT_DATA: AppData = {
  business: { name: "Your Business", email: "", address: "", city: "", country: "", taxId: "", currency: "USD", defaultRate: 100, defaultTaxRate: 0 },
  clients: [], timeEntries: [], invoices: [], nextInvoiceNumber: 1001,
};

export function loadData(): AppData {
  if (!fs.existsSync(DATA_FILE)) return { ...DEFAULT_DATA };
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); } catch { return { ...DEFAULT_DATA }; }
}

export function saveData(data: AppData): void {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), { encoding: "utf-8", mode: 0o600 });
}

export function generateId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export function calcInvoice(items: InvoiceItem[], taxRate: number): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = parseFloat((subtotal * taxRate / 100).toFixed(2));
  const total = parseFloat((subtotal + taxAmount).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), taxAmount, total };
}

export function getUnbilledHours(data: AppData, clientId: string): TimeEntry[] {
  return data.timeEntries.filter(e => e.clientId === clientId && !e.invoiceId);
}

export function exportInvoicesCSV(data: AppData): string {
  const headers = ["number","client","issued","due","total","currency","status","paid_date"];
  const rows = data.invoices.map(inv => {
    const client = data.clients.find(c => c.id === inv.clientId);
    return [inv.number, client?.name ?? "Unknown", inv.issuedDate, inv.dueDate, inv.total, inv.currency, inv.status, inv.paidDate ?? ""]
      .map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function exportTimeCSV(data: AppData): string {
  const headers = ["date","client","description","hours","rate","total","status"];
  const rows = data.timeEntries.map(e => {
    const client = data.clients.find(c => c.id === e.clientId);
    return [e.date, client?.name ?? "Unknown", e.description, e.hours, e.rate, (e.hours * e.rate).toFixed(2), e.invoiceId ? "billed" : "unbilled"]
      .map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function getOverdueInvoices(data: AppData): Invoice[] {
  const today = new Date().toISOString().split("T")[0]!;
  return data.invoices.filter(i => i.status === "sent" && i.dueDate < today);
}

export function markOverdueInvoices(data: AppData): number {
  const overdue = getOverdueInvoices(data);
  for (const inv of overdue) inv.status = "overdue";
  return overdue.length;
}

export function exportInvoicesCSV(data: AppData): string {
  const headers = ["number","client","issued","due","total","currency","status","paid_date"];
  const rows = data.invoices.map(inv => {
    const client = data.clients.find(c => c.id === inv.clientId);
    return [inv.number, client?.name ?? "Unknown", inv.issuedDate, inv.dueDate, inv.total, inv.currency, inv.status, inv.paidDate ?? ""]
      .map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export function exportTimeCSV(data: AppData): string {
  const headers = ["date","client","description","hours","rate","total","status"];
  const rows = data.timeEntries.map(e => {
    const client = data.clients.find(c => c.id === e.clientId);
    return [e.date, client?.name ?? "Unknown", e.description, e.hours, e.rate, (e.hours * e.rate).toFixed(2), e.invoiceId ? "billed" : "unbilled"]
      .map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}
