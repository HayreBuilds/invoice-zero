# Contributing to invoice-zero

## Running locally

```bash
npm install
ts-node src/server.ts
# Open http://127.0.0.1:3333
```

## Adding a new invoice field

1. Add to the `Invoice` interface in `src/storage.ts`
2. Handle in the POST /api/invoices route in `src/server.ts`
3. Add to the `generateSimpleHtml()` function if it should appear on printed invoices
4. Add to the form in `public/index.html`

## PDF generation

Currently uses browser print-to-PDF. A future enhancement could use
Puppeteer or wkhtmltopdf for server-side PDF generation.
