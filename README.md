# invoice-zero

> Free, self-hosted invoicing for freelancers. Create clients, log hours, generate PDF invoices, track payments. No subscription. No cloud. No account. Runs on your machine.

```
$ npx invoice-zero

  ◆ invoice-zero — http://127.0.0.1:3333
  Data: ~/.invoice-zero/data.json
```

---

## Install

```bash
# Run immediately
npx invoice-zero

# Install globally
npm install -g invoice-zero
invoice-zero
```

Open http://127.0.0.1:3333 — your invoicing app is running.

## Features

**Clients**
- Add and manage clients with contact info, billing address, and default currency
- Per-client tax rates
- Multi-currency support (USD, EUR, GBP, CAD, AUD)

**Time Tracking**
- Log hours with description, rate, and date
- See unbilled vs billed hours at a glance
- Per-client unbilled hours summary

**Invoices**
- Create invoices from line items or from tracked time entries
- Auto-numbered (INV-1001, INV-1002, ...)
- Professional HTML invoice — click "Print / Save as PDF" to export
- Status tracking: Draft → Sent → Paid / Overdue
- Due date, notes, and tax support

**Business Info**
- Set your business name, email, address, and tax ID
- Default hourly rate and tax rate
- Shows on every invoice header

**Dashboard**
- Total paid, outstanding, and unbilled hours at a glance

## No Subscription. No Cloud.

Everything is stored in `~/.invoice-zero/data.json`. Your data is yours.

Compare to alternatives:

| | invoice-zero | FreshBooks | Wave | HoneyBook |
|---|---|---|---|---|
| Price | **Free** | $17/mo | Free (acquired) | $36/mo |
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| No account | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| PDF invoices | ✅ | ✅ | ✅ | ✅ |
| Time tracking | ✅ | ✅ | ✅ | ✅ |

## PDF Invoices

invoice-zero generates clean HTML invoices with a "Print / Save as PDF" button. Use your browser's built-in print-to-PDF — works on Chrome, Firefox, Safari, and Edge with no extra software.

## Data Storage

All data lives in `~/.invoice-zero/data.json`. Back this file up to keep your records. It's plain JSON — import it into any other tool if you ever switch.

## API

invoice-zero exposes a local REST API:

```bash
# Clients
GET    /api/clients
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id

# Time tracking
GET    /api/time?clientId=&unbilled=true
POST   /api/time
PUT    /api/time/:id
DELETE /api/time/:id

# Invoices
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id/html   ← printable HTML invoice
PUT    /api/invoices/:id
DELETE /api/invoices/:id

# Stats
GET    /api/stats
```

## License

MIT

## Backup

All data is in `~/.invoice-zero/data.json`. Back it up regularly:

```bash
# Daily backup
cp ~/.invoice-zero/data.json ~/Dropbox/invoice-zero-backup-$(date +%Y%m%d).json
```

Or set up a cron job:
```
0 9 * * * cp ~/.invoice-zero/data.json ~/backups/invoice-$(date +%Y%m%d).json
```
