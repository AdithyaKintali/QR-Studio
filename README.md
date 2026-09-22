# QR Studio

A browser-based QR Code Generator & Designer — create, customize, preview, and download QR codes with no backend required.

🔗 **Live Demo:** [Add your Vercel/Netlify link here]

---

## 📖 Overview

QR Studio lets users generate QR codes from multiple types of input (URLs, text, email, phone numbers, and Wi-Fi credentials), customize their appearance in real time, and download the final result as an image — all directly in the browser.

---

## ✨ Features

- **Real-time QR generation** — see your QR code update as you type
- **Multiple QR types** — URL, Plain Text, Email, Phone Number, Wi-Fi
- **Full customization**
  - Size
  - Foreground & background color
  - Error correction level
  - Margin/padding
- **Presets** — quick-start visual styles that remain fully editable
- **Download as PNG** — pixel-perfect match with the live preview
- **Input validation** — clear error messages for invalid or incomplete data
- **Scan reliability warnings** — alerts when customization may reduce scannability
- **Recent QR codes** — stored locally and persist across page refreshes
- **Responsive design** — works smoothly on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React / Vue.js / Angular *(choose one)* |
| Languages | HTML, CSS, JavaScript / TypeScript |
| QR Generation | *(e.g., qrcode.react, qrcode.js, or similar)* |
| Storage | Browser `localStorage` |
| Deployment | Vercel / Netlify |

> Update this table with the specific libraries and framework you land on.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/QR-Studio.git
cd QR-Studio

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000` (or the port shown in your terminal).

### Build for Production

```bash
npm run build
```

---

## 📱 Supported QR Code Types

| Type | Input Fields |
|---|---|
| URL | Website link |
| Plain Text | Free text |
| Email | Recipient, subject, body (optional) |
| Phone Number | Phone number |
| Wi-Fi | SSID, password, encryption type |

The input form dynamically adapts based on the selected QR type.

---

## 🎨 Customization Options

- **Size** — adjust QR code dimensions
- **Colors** — set foreground and background colors independently
- **Error Correction Level** — Low (L), Medium (M), Quartile (Q), High (H)
- **Margin/Padding** — control quiet-zone spacing around the code

All changes apply instantly to the live preview before download.

---

## 🧩 Presets

Choose from a set of predefined visual styles to quickly style a QR code, then fine-tune any individual setting afterward — presets are a starting point, not a lock.

---

## 💾 Recent QR Codes

Generated QR codes are automatically saved to `localStorage`, allowing users to:
- View a history of recently created codes
- Reuse previous configurations
- Retain history across page refreshes

---

## ✅ Validation & Scan Reliability

- Invalid or incomplete inputs (e.g., malformed URLs, missing Wi-Fi password) trigger clear inline error messages
- The app warns users when certain customizations (e.g., low contrast colors, low error correction with a logo overlay) may affect scan reliability

---

## 📲 Responsive Design

The interface is built to work seamlessly across desktop, tablet, and mobile screen sizes.

---

## 🧪 Testing Checklist

- [ ] All QR types generate correctly (URL, Text, Email, Phone, Wi-Fi)
- [ ] All customization options update the preview correctly
- [ ] Downloaded PNG matches the on-screen preview
- [ ] Invalid inputs are caught and display appropriate errors
- [ ] Recent QR codes persist after a page refresh
- [ ] Layout is responsive on both desktop and mobile

---

## 🌟 Optional Enhancements

- [ ] SVG download support
- [ ] Add a custom logo to the center of QR codes
- [ ] Gradient QR code coloring
- [ ] Copy QR code image to clipboard
- [ ] Custom QR dot/eye patterns
- [ ] Dark/light theme toggle

---

## 📂 Project Structure

```
QR-Studio/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   └── App.(jsx|tsx|vue)
├── package.json
└── README.md
```

> Adjust this to match your actual folder layout once the project structure is finalized.

---

## 🚢 Deployment

This project is deployed via **Vercel**.

1. Push changes to the `main` branch
2. Vercel automatically detects the push and redeploys
3. Live URL: *(add your deployed link here)*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙌 Acknowledgements

- QR code generation powered by *(name your chosen library)*
- Built and deployed with [Vercel](https://vercel.com)
