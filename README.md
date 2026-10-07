# 👗 Nguo Classic — Multi-Tenant Boutique & Apparel E-Commerce Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](https://github.com/Nyisulya/nguo-classic)

> **100% Free & Open Source (Huria na Bure Kabisa)** 
> Mfumo wa kisasa wa maduka ya nguo na mitindo (SaaS Multi-Tenant Boutique E-Commerce Platform) unaoruhusu usimamizi wa maduka mengi, katalogi ya bidhaa, mauzo (POS), udhibiti wa stoki, na maagizo ya moja kwa moja kupitia WhatsApp.

---

## ✨ Sifa Kuu za Mfumo (Key Features)

### 🏬 1. Multi-Tenant SaaS Architecture
* **Mfumo wa Maduka Mengi:** Kila duka linapata jina/subdomain yake kipekee (mfano: `mitindo.mitoko.nyisu.com` au `localhost:5000` kulingana na mpangilio).
* **Mgawanyo Salama wa Data:** Kila duka lina faili na hifadhidata yake huru ya bidhaa, mipangilio, na mauzo bila kuingiliana.

### 🛍️ 2. Duka la Mtandaoni (Customer Storefront)
* **Katalogi ya Kisasa:** Muonekano maridadi wenye glassmorphism, responsive kwa simu na kompyuta.
* **Vichujio na Utafutaji:** Uteuzi kulingana na kategoria (Vazi la Kike, la Kiume, Viatu, n.k.) na saizi (S, M, L, XL, n.k.).
* **Kuagiza kwa WhatsApp:** Wateja wanaweka oda zao moja kwa moja kwenye nambari ya WhatsApp ya muuzaji ikiwa na maelezo kamili ya bidhaa.

### 📊 3. Dashibodi ya Admin wa Duka (Store Admin Portal)
* **Usimamizi wa Bidhaa:** Ongeza, hariri, na ufute bidhaa kwa urahisi ukiwa na bei ya kununua na bei ya kuuza.
* **Stoki & POS:** Mfumo wa mauzo ya dukani kwa haraka (Point of Sale), ufuatiliaji wa faida halisi (net profit), na punguzo (discounts).
* **Ubadilishaji wa Muonekano:** Kubadili rangi za duka, nembo, jina la duka, ramani ya Google Maps, na sarafu (Tsh, USD, n.k.).

### 🛡️ 4. Superadmin Portal (Usimamizi Mkuu)
* **Udhibiti wa Maduka Yote:** Fungua maduka mapya, ongeza muda wa matumizi (subscription expiration), simamisha (suspend) au futa duka.
* **Expiration Lock:** Duka linapomaliza muda wa leseni, mfumo unajifunga kiotomatiki na kuelekeza mmiliki kwenye WhatsApp ya Superadmin kufanya malipo/kusasisha.

### ⚡ 5. Image Compression & WebP Optimization
* Picha zote zinazopakiwa huchakatwa kiotomatiki kwa kutumia maktaba ya **`sharp`**, kubadilishwa kuwa mfumo mwepesi wa **WebP** na ukubwa stahiki (max 1000px) kwa ajili ya kasi ya juu hata kwenye intaneti ya simu.

---

## 🚀 Jinsi ya Kuanza (Getting Started)

### Mahitaji ya Awali (Prerequisites)
* [Node.js](https://nodejs.org) (Toleo la 18 au zaidi)
* [Git](https://git-scm.com)
* [npm](https://www.npmjs.com/)

### 1. Pakua Mradi (Clone Repository)
```bash
git clone https://github.com/Nyisulya/nguo-classic.git
cd nguo-classic
```

### 2. Sakinisha Vitegemezi (Install Dependencies)
Sakinisha vifurushi vya backend pamoja na frontend:
```bash
# Sakinisha backend
npm install

# Sakinisha frontend
cd frontend
npm install
cd ..
```

### 3. Mpangilio wa Mazingira (Environment Variables)
Tengeneza faili la `.env` kwa kunakili kutoka `.env.example`:
```bash
cp .env.example .env
```
Ndani ya `.env`, weka:
```env
PORT=5000
JWT_SECRET=siri_yako_salama_kabisa_hapa_12345
PRIMARY_DOMAIN=mitoko.nyisu.com
```

### 4. Kuwasha Mradi (Running the Application)
Unaweza kuwasha backend na frontend kwa pamoja kwa amri moja:
```bash
npm run dev
```

Au endesha moja baada ya nyingine kwenye vituo viwili tofauti vya terminal:

* **Backend API:**
  ```bash
  npm run server
  ```
  *(Inapatikana kwenye: `http://localhost:5000`)*

* **Frontend Client:**
  ```bash
  npm run client
  ```
  *(Inapatikana kwenye: `http://localhost:5173`)*

---

## 📁 Muundo wa Folda (Project Structure)

```text
nguo-classic/
├── database/                    # Hifadhidata ya mfumo (JSON-based)
│   ├── superadmin.json          # Mipangilio na hash ya Superadmin
│   ├── tenants.json             # Orodha ya maduka yote yaliyosajiliwa
│   └── tenants/                 # Folda maalum za kila duka
│       └── mitindo/
│           ├── products.json    # Orodha ya bidhaa za duka
│           ├── sales.json       # Kumbukumbu za mauzo na faida
│           └── settings.json    # Mipangilio na nenosiri la duka
├── frontend/                    # Kiolesura cha Mtumiaji (React 19 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/           # Dashibodi ya usimamizi wa duka
│   │   │   ├── Superadmin/      # Dashibodi ya msimamizi mkuu
│   │   │   ├── Navbar.jsx       # Upau wa juu
│   │   │   └── ProductCard.jsx  # Kadi ya bidhaa
│   │   ├── App.jsx              # Routing na mtiririko mkuu
│   │   └── index.css            # Mitindo ya CSS (Design System)
├── uploads/                     # Picha za bidhaa zilizoboreshwa (WebP)
├── server.js                    # Express Backend REST API
├── package.json                 # Vifurushi na maelekezo ya backend
├── LICENSE                      # Leseni ya MIT (Open Source)
└── README.md                    # Nyaraka za mradi
```

---

## 🛠️ Teknolojia Zilizotumika (Tech Stack)

* **Backend:** [Node.js](https://nodejs.org), [Express.js](https://expressjs.com)
* **Frontend:** [React 19](https://react.dev), [Vite](https://vitejs.dev), [Lucide React](https://lucide.dev)
* **Uchakataji wa Picha:** [Sharp](https://sharp.pixelplumbing.com/) (WebP conversion)
* **Usalama:** [JSON Web Token (JWT)](https://jwt.io/), [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
* **Styling:** Vanilla Modern CSS with Glassmorphism & Micro-animations

---

## 🤝 Mchango (Contributing)

Mradi huu ni **wazi na huria (Open Source)** kwa kila mtu! Michango, maoni na maboresho yanakaribishwa sana:

1. Fanya **Fork** ya mradi huu.
2. Tengeneza tawi lako la kipengele (`git checkout -b feature/KipengeleKipya`).
3. Fanya mabadiliko kisha yaweke (`git commit -m 'feat: nimeongeza kipengele kipya'`).
4. Sukuma tawi lako (`git push origin feature/KipengeleKipya`).
5. Fungua **Pull Request**.

---

## 📄 Leseni (License)

Mradi huu unalindwa chini ya leseni ya **[MIT License](LICENSE)**. Ni bure kutumia, kubadilisha, kusambaza au kutumia kibiashara.

---

<p align="center">
  Imetengenezwa kwa ❤️ na <a href="https://github.com/Nyisulya">Nyisulya</a>
</p>
