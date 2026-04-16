# IndieBackseat Projekt (BookInk)

Az **IndieBackseat** egy komplex webes platform, amely a játékosokat és a játékfejlesztőket hozza össze. A felhasználók játékokat értékelhetnek, "backseat" stílusú tippekkel/kommentekkel láthatják el őket, valamint a fejlesztők bemutathatják saját, készülő projektjeiket (DevLogs), amelyekre a közösség reagálhat (Upvote, Kedvencek).

A projekt két fő komponensből áll: egy modern **React / Vite** alapú Frontendből, és egy masszív **NestJS / Prisma** alapú Backendből.

---

## 🏛️ Áttekintés

- **Frontend Repository**: `front/bookink_frontend/`
- **Backend Repository**: `back/bookink_backend/`
- **Fő Keresztezések (API URL)**: Alapértelmezésben a Frontend a `http://localhost:3000/api` végpontokon kommunikál a Backenddel.

---

## 🎨 1. Frontend (Kliens)

A kliens alkalmazás nyújtja a letisztult, modern és dinamikus felhasználói élményt (UI).

### Alkalmazott Technológiák
- **React 18** (TypeScript)
- **Vite** (Rendkívül gyors fejlesztői környezet)
- **Tailwind CSS** (Utility-first dizájn keretrendszer)
- **React Router DOM** (Kliens oldali navigáció)
- **Lucide-React** (Vektoros ikon készlet)

### Telepítés és Indítás
1. Lépj be a frontend mappába a terminálból:
   ```bash
   cd path/to/front/bookink_frontend
   ```
2. Telepítsd a függőségeket:
   ```bash
   npm install
   ```
3. Indítsd el a fejlesztői szervert:
   ```bash
   npm run dev
   ```
Az oldal a `http://localhost:5173` címen fog behozni egy azonnal frissülő felületet.

### Fő Mappaszerkezet (Frontend)
- `src/components/`: Újrahasznosítható UI elemek (Nav, Modals, Kártyák).
- `src/pages/`: Integrált képernyő-nézetek (Home, GameDetails, DevLogs, Profile).
- `src/index.css`: Globális beállítások és Tailwind konfiguráció.

> **Megjegyzés a szerkesztőhöz**: Ha a VSCode sárgával aláhúzza az `@apply` vagy `@tailwind` CSS szabályokat az `index.css`-ben, az csak egy esztétikai hiba (Linter warning), a kód így is tökéletesen fut a Vite feldolgozásában. A `.vscode/settings.json`-ban ezt orvosoltuk.

---

## ⚙️ 2. Backend (Szerver API)

Az adatok mentéséért, a fájlfeltöltésért, a biztonságos bejelentkezésekért és az üzleti logikáért (pl. ki törölhet kommentet) felelős réteg.

### Alkalmazott Technológiák
- **Node.js + NestJS** (TypeScript)
- **Prisma ORM** (Biztonságos adatbázis kezelés)
- **Kapcsolódás**: MySQL / PostgreSQL / SQLite
- **Autentikáció**: JWT (JSON Web Tokens), Passport, Session
- **Dokumentáció**: Swagger / OpenAPI
- **Fájl feltöltés**: Multer

### Telepítés és Indítás
1. Lépj be a backend mappába:
   ```bash
   cd path/to/back/bookink_backend
   ```
2. Telepítsd a függőségeket:
   ```bash
   npm install
   ```
3. Hozd létre a `.env` fájlt (a projekt gyökerében), például a következő tartalommal:
   ```env
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
   JWT_SECRET="biztonsagos_szerver_kulcs"
   SESSION_SECRET="titkos_session_kulcs"
   STEAM_API_KEY="A_TE_STEAM_API_KULCSOD_IDE"
   PORT=3000
   ```
4. Futtasd le a Prisma adatbázis sémát és töltsd fel a kezdőadatokkal (Seeding):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
5. Indítsd el a backendet a folyamatos megfigyelés (watch) funkcióval:
   ```bash
   npm run start:dev
   ```

A szerver alapesetben elkezdi kiszolgálni a felé érkező kéréseket a `http://localhost:3000` porton.

### API Dokumentáció (Swagger)
Minden elérhető API végpont - a paramétereivel és példa JSON bemenetekkel - vizuálisan elérhető a böngészőben. A teszteléshez nyisd meg az alábbi linket, ha fut a backend:
- **[http://localhost:3000/api](http://localhost:3000/api)**

---

## 🔒 Hitelesítés & Szerepkörök (Roles)
- **Alapértelmezett Admin**: `admin` / `admin` (Jogosult mások projektjeinek és kommentjeinek törlésére)
- **Alapértelmezett Fejlesztő**: `developer` / `developer`, valamint `mate` (Csinálhatnak DevLogokat, frissíthetik azok állapotát)

Gyakorlatilag minden API végpontnál, ami módosítással jár (POST, DELETE) szükséges a `Bearer Token` elküldése az Auth headerben (Amit a Sikeres bejelentkezés állít be automatikusan az alkalmazásban, vagy Swagger esetén manuálisan kell felmásolni).
