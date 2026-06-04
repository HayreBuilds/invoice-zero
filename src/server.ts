#!/usr/bin/env node
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { loadData, saveData, generateId, calcInvoice, getUnbilledHours } from "./storage.js";
import type { Client, TimeEntry, Invoice, InvoiceItem } from "./storage.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3333;
const HOST = "127.0.0.1";
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(status === 204 ? "" : JSON.stringify(data, null, 2));
}

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", c => d += c);
    req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } });
  });
}

function generateInvoiceNumber(next: number): string { return `INV-${String(next).padStart(4, "0")}`; }

function generateSimpleHtml(invoice: Invoice, client: Client, business: { name: string; email: string; address: string; taxId?: string }): string {
  const rows = invoice.items.map(i =>
    `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${invoice.currency} ${i.unitPrice.toFixed(2)}</td><td>${invoice.currency} ${i.total.toFixed(2)}</td></tr>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.number}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#333;padding:20px}
h1{color:#1a1a2e}.meta{display:flex;justify-content:space-between;margin:20px 0}
table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{padding:10px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5}
.total{text-align:right;font-size:1.2em;font-weight:bold;color:#1a1a2e}
.status{display:inline-block;padding:4px 12px;border-radius:4px;font-size:12px;text-transform:uppercase;font-weight:bold}
.paid{background:#d4edda;color:#155724}.draft{background:#fff3cd;color:#856404}.sent{background:#d1ecf1;color:#0c5460}
@media print{button{display:none}}</style></head>
<body>
<div style="display:flex;justify-content:space-between;align-items:start">
<div><h1>${invoice.number}</h1><span class="status ${invoice.status}">${invoice.status}</span></div>
<div style="text-align:right"><strong>${business.name}</strong><br>${business.email}<br>${business.address}<br>${business.taxId ? "Tax ID: " + business.taxId : ""}</div>
</div>
<div class="meta">
<div><strong>Bill To:</strong><br>${client.name}<br>${client.email}<br>${client.address}</div>
<div><strong>Issued:</strong> ${invoice.issuedDate}<br><strong>Due:</strong> ${invoice.dueDate}<br>${invoice.paidDate ? "<strong>Paid:</strong> " + invoice.paidDate : ""}</div>
</div>
<table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="total">
<p>Subtotal: ${invoice.currency} ${invoice.subtotal.toFixed(2)}</p>
${invoice.taxRate > 0 ? `<p>Tax (${invoice.taxRate}%): ${invoice.currency} ${invoice.taxAmount.toFixed(2)}</p>` : ""}
<p style="font-size:1.4em">Total: ${invoice.currency} ${invoice.total.toFixed(2)}</p>
</div>
${invoice.notes ? `<div style="margin-top:20px;padding:15px;background:#f9f9f9;border-radius:4px"><strong>Notes:</strong><br>${invoice.notes}</div>` : ""}
<br><button onclick="window.print()" style="padding:10px 20px;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px">🖨 Print / Save as PDF</button>
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", `http://${HOST}`);
  const p = u.pathname;
  const method = req.method ?? "GET";

  if (method === "GET" && !p.startsWith("/api/")) {
    const file = p === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, p.slice(1));
    if (fs.existsSync(file) && !file.includes("..")) {
      const mime: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
      res.writeHead(200, { "Content-Type": mime[path.extname(file)] ?? "text/plain" });
      fs.createReadStream(file).pipe(res); return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(path.join(PUBLIC_DIR, "index.html")).pipe(res); return;
  }

  // API
  const data = loadData();

  if (p === "/api/business") {
    if (method === "GET") return json(res, 200, data.business);
    if (method === "PUT") { const b = await parseBody(req); data.business = { ...data.business, ...(b as typeof data.business) }; saveData(data); return json(res, 200, data.business); }
  }

  if (p === "/api/clients") {
    if (method === "GET") return json(res, 200, data.clients);
    if (method === "POST") {
      const b = await parseBody(req);
      const client: Client = { id: generateId(), name: b["name"] as string ?? "Client", email: b["email"] as string ?? "", address: b["address"] as string ?? "", city: b["city"] as string ?? "", country: b["country"] as string ?? "", currency: b["currency"] as string ?? data.business.currency, taxRate: (b["taxRate"] as number) ?? data.business.defaultTaxRate, createdAt: new Date().toISOString() };
      data.clients.push(client); saveData(data); return json(res, 201, client);
    }
  }

  const clientMatch = p.match(/^\/api\/clients\/([^/]+)$/);
  if (clientMatch) {
    const id = clientMatch[1]!;
    const idx = data.clients.findIndex(c => c.id === id);
    if (method === "GET") return idx === -1 ? json(res, 404, { error: "Not found" }) : json(res, 200, data.clients[idx]);
    if (method === "PUT") { if (idx === -1) return json(res, 404, { error: "Not found" }); const b = await parseBody(req); data.clients[idx] = { ...data.clients[idx]!, ...(b as Client), id }; saveData(data); return json(res, 200, data.clients[idx]); }
    if (method === "DELETE") { if (idx === -1) return json(res, 404, { error: "Not found" }); data.clients.splice(idx, 1); saveData(data); return json(res, 204, null); }
  }

  if (p === "/api/time") {
    if (method === "GET") {
      const clientId = u.searchParams.get("clientId");
      const unbilled = u.searchParams.get("unbilled");
      let entries = data.timeEntries;
      if (clientId) entries = entries.filter(e => e.clientId === clientId);
      if (unbilled === "true") entries = entries.filter(e => !e.invoiceId);
      return json(res, 200, entries);
    }
    if (method === "POST") {
      const b = await parseBody(req);
      const entry: TimeEntry = { id: generateId(), clientId: b["clientId"] as string ?? "", description: b["description"] as string ?? "", hours: (b["hours"] as number) ?? 1, rate: (b["rate"] as number) ?? data.business.defaultRate, date: b["date"] as string ?? new Date().toISOString().split("T")[0]! };
      data.timeEntries.push(entry); saveData(data); return json(res, 201, entry);
    }
  }

  const timeMatch = p.match(/^\/api\/time\/([^/]+)$/);
  if (timeMatch) {
    const id = timeMatch[1]!; const idx = data.timeEntries.findIndex(e => e.id === id);
    if (method === "DELETE") { if (idx === -1) return json(res, 404, { error: "Not found" }); data.timeEntries.splice(idx, 1); saveData(data); return json(res, 204, null); }
    if (method === "PUT") { if (idx === -1) return json(res, 404, { error: "Not found" }); const b = await parseBody(req); data.timeEntries[idx] = { ...data.timeEntries[idx]!, ...(b as TimeEntry), id }; saveData(data); return json(res, 200, data.timeEntries[idx]); }
  }

  if (p === "/api/invoices") {
    if (method === "GET") return json(res, 200, data.invoices);
    if (method === "POST") {
      const b = await parseBody(req);
      const clientId = b["clientId"] as string;
      const client = data.clients.find(c => c.id === clientId);
      if (!client) return json(res, 404, { error: "Client not found" });
      const items = b["items"] as InvoiceItem[] ?? [];
      const taxRate = (b["taxRate"] as number) ?? client.taxRate ?? 0;
      const { subtotal, taxAmount, total } = calcInvoice(items, taxRate);
      const now = new Date();
      const due = new Date(); due.setDate(due.getDate() + 30);
      const invoice: Invoice = {
        id: generateId(), number: generateInvoiceNumber(data.nextInvoiceNumber),
        clientId, items, subtotal, taxRate, taxAmount, total, currency: client.currency,
        status: "draft", notes: b["notes"] as string ?? "",
        dueDate: due.toISOString().split("T")[0]!, issuedDate: now.toISOString().split("T")[0]!,
        createdAt: now.toISOString(),
      };
      // mark time entries as billed
      const entryIds = b["timeEntryIds"] as string[] ?? [];
      for (const eid of entryIds) { const e = data.timeEntries.find(t => t.id === eid); if (e) e.invoiceId = invoice.id; }
      data.invoices.push(invoice); data.nextInvoiceNumber++;
      saveData(data); return json(res, 201, invoice);
    }
  }

  const invMatch = p.match(/^\/api\/invoices\/([^/]+)(?:\/(html|pdf))?$/);
  if (invMatch) {
    const id = invMatch[1]!; const sub = invMatch[2];
    const idx = data.invoices.findIndex(i => i.id === id);
    if (idx === -1) return json(res, 404, { error: "Not found" });
    if (method === "GET" && sub === "html") {
      const inv = data.invoices[idx]!;
      const client = data.clients.find(c => c.id === inv.clientId);
      if (!client) return json(res, 404, { error: "Client not found" });
      const html = generateSimpleHtml(inv, client, { name: data.business.name, email: data.business.email, address: data.business.address, taxId: data.business.taxId });
      res.writeHead(200, { "Content-Type": "text/html" }); res.end(html); return;
    }
    if (method === "GET") return json(res, 200, data.invoices[idx]);
    if (method === "PUT") { const b = await parseBody(req); data.invoices[idx] = { ...data.invoices[idx]!, ...(b as Invoice), id }; if ((b as Invoice).status === "paid" && !data.invoices[idx]!.paidDate) data.invoices[idx]!.paidDate = new Date().toISOString().split("T")[0]!; saveData(data); return json(res, 200, data.invoices[idx]); }
    if (method === "DELETE") { data.invoices.splice(idx, 1); saveData(data); return json(res, 204, null); }
  }

  if (p === "/api/stats") {
    const paid = data.invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
    const outstanding = data.invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0);
    return json(res, 200, { totalClients: data.clients.length, totalInvoices: data.invoices.length, paidTotal: paid, outstandingTotal: outstanding, unbilledHours: data.timeEntries.filter(e => !e.invoiceId).reduce((s, e) => s + e.hours, 0) });
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  process.stdout.write(`\n  ◆ invoice-zero — ${url}\n  Data: ~/.invoice-zero/data.json\n\n`);
  const { exec } = require("child_process");
  exec(`open ${url} 2>/dev/null || xdg-open ${url} 2>/dev/null`, () => {});
});
// TODO: POST /api/invoices/:id/duplicate — copy invoice with new date and draft status
// TODO: GET /api/invoices?status=overdue — filter by status
// TODO: POST /api/invoices/:id/send — mark as sent and record sent date
