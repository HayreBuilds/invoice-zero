# 🧾 invoice-zero

[![Build Status](https://img.shields.io/github/actions/workflow/status/HayreBuilds/invoice-zero/ci.yml?branch=main)](https://github.com/HayreBuilds/invoice-zero/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HayreBuilds/invoice-zero/pulls)
[![Star History](https://img.shields.io/github/stars/HayreBuilds/invoice-zero?style=social)](https://github.com/HayreBuilds/invoice-zero/stargazers)

**Free, self-hosted invoicing tool for freelancers. No subscriptions. No cloud. You own your data.**

> Tired of paying $20/month for FreshBooks or Wave just to send a few invoices? **invoice-zero** is a dead-simple, local-first app that runs on your machine and generates professional PDFs in seconds.

---

## 🚀 Quick Start

```bash
# Start the local invoicing server
npx invoice-zero
```

Open **[http://localhost:3000](http://localhost:3000)** to start creating your first invoice.

---

## ✨ Key Features

- **🏠 Self-Hosted & Private**: All data stays on your machine in a simple JSON file.
- **📄 Professional PDFs**: Generate clean, modern invoices ready to send to clients.
- **🕒 Time Tracking**: Log hours per client and convert them into invoice line items instantly.
- **📊 Payment Tracking**: Mark invoices as paid, overdue, or pending.
- **📦 Data Portability**: Export your entire history to CSV for tax season.
- **⚡ Zero Setup**: No database to configure. No account to create.

---

## 💻 Installation

```bash
npm install -g invoice-zero
```

---

## 🛠️ Usage

### Manage Clients & Projects
Add your clients and their billing details through the intuitive web interface.

### Generate Invoices
Create new invoices, add line items (manual or from logged hours), and download the PDF.

### Track Payments
View a dashboard of your total earnings and outstanding payments.

---

## 🔍 Why "Zero"?

1. **Zero Cost**: No monthly subscriptions or transaction fees.
2. **Zero Cloud**: Your sensitive client data never leaves your hard drive.
3. **Zero Friction**: Start the app and send an invoice in under 2 minutes.

---

## ⚙️ Configuration

| Option | Default | Description |
|:---|:---|:---|
| `--port <n>` | `3000` | Port for the web interface |
| `--data <path>`| `~/.invoice-zero/` | Directory to store invoices and client data |
| `--currency` | `USD` | Default currency for new invoices |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 💖 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=HayreBuilds/invoice-zero&type=Date)](https://star-history.com/#HayreBuilds/invoice-zero&Date)
