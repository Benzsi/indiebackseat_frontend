# IndieBackseat Frontend Szolgáltatás (Kliens Alkalmazás)

Ez a dokumentáció tartalmazza az **IndieBackseat** projekt felhasználói oldali (Frontend) részének részletes szoftverarchitektúráját, életciklusát, konfigurációs irányelveit és az építési (deployment) szempontokat. Ez a felület határozza meg a játékosok és fejlesztők publikus elköteleződését a rendszer felé.

---

## 1. Technikai Ökoszisztéma és Architektúra

A projekt komponens-alapú szeparációra és utility-first stílusalapelvekre íródott, ezzel támogatva a nagy méretű SPA (Single Page Application) karbantarthatóságát:

- **Alaprendszer (Core)**: [React 18](https://react.dev/) teljesen típusosított (TypeScript) adatfolyammal.
- **Fordítás és fejlesztői környezet (Build Tool)**: [Vite](https://vitejs.dev/) - Az ES Modulokra és a natív gépi kódú fordításra építve az extrém rövid betöltési időért és az eszméletlen gyors HMR (Hot Module Replacement) támogatásáért.
- **Formátum és Stíluskezelés**: [Tailwind CSS](https://tailwindcss.com/) egyéni konfigurációval a gyors prototipizáláshoz és a kódduplikáció kiküszöböléséhez.
- **Állapot és Útvonal (Routing)**: React Router DOM (v6), deklaratív útvonalvezérlések és paraméterezett linkek (pl. `/games/:id`).
- **Grafikus Készlet**: Lucide-React SVG komponens tárak biztosítják az alacsony helyigényű, vektoros renderelést.

---

## 2. Inicializálás és Fejlesztési Folyamat

Az értelmező futtatásához és az alkalmazás lokális megtekintéséhez az alábbi parancsok futtatása elvárt a projekt gyökerében.

### 2.1 Csomagok Telepítése
Telepítse az `package.json`-ben meghatározott Node modulokat:
```bash
cd indiebackseat_frontend
npm install
```

### 2.2 Fejlesztői Szerver Indítása (Dev Mode)
Fejlesztéshez a Vite dedikált futtatója ajánlott, ami figyeli a kódbázis változásait:
```bash
npm run dev
```
Böngészőn a `http://localhost:5173` hivatkozás használatával érhető el a futó vizuális portál.

### 2.3 IDE és Szerkesztő Finomhangolása (VS Code)
Kifejezetten fontos: a React + Tailwind struktúrában az `.index.css` fájl tartalmaz `@tailwind` vagy `@apply` direktívákat.  Mivel ez szigorú alap CSS-szabvány szerint nem validált at-rule, a standard beépített CSS nyelv ellenőrzők hibaüzenetet ("Unknown at rule @tailwind") generálnak.
Ezt a `bookink_frontend/.vscode/settings.json` lokális definiálásával letiltottuk a kényelmes munka érdekében. Az éles Build-et ez egyáltalán nem érinti, a PostCSS és Vite ezeket az at-rulekat tökéletesen lefordítja natív CSS kóddá.

---

## 3. Komponensek és Könyvtárstruktúra Mátrixa

A kódbázis az `src` könyvtárban aggregálva biztosít struktúrát:

- `src/components/` : Szigorú atomi elemek (Atomic design pattern). Itt kapnak helyet pl. gombok, legördülő opciók (`Dropdown`), Modális ablakok és Játékkártya (Card) UI tervek. Ezek a komponensek belső üzleti adatoktól elválasztva funkcionálnak ("Dumb components").
- `src/pages/` : A View-layer legfelső szintű integrációi (Context aggregációk).
  - `Home.tsx` - Statisztikák és Játék szűrési felület
  - `GameDetails.tsx` - Komplex API adatkinyerés egy id specifikus megjelenéshez
  - `DevLogs.tsx` - A felhasználók és fiókok specifikus lapja a fejlesztői naplók beolvasására
- `src/index.css` - Belépési és definiálási pont a Tailwind Utility classok számára.
- `src/App.tsx` - Dinamikus Router komponens réteg (BrowserRouter) a megfelelő path -> render párosításra.

---

## 4. API Adatkapcsolat, Backend Mátrix (Integration)

A frontend kliens HTTPS Fetch API mechanizmusokon keresztül kezeli a szerver tranzakcióit.

### 4.1. Hálózati Irányítás (Networking)
Alapértelmezett RESTful hivatkozás: `http://localhost:3000/api`

Minden olyan kérés, mely nem GET folyamat és valamilyen validálandó rekord változásához vezet, kötelezett egy Authorization header beágyazására. Bármely valid HTTP kérő kód az alábbit vizsgája az API végpontnál:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json' // Fájlfeltöltésnél (Multer) a FormData natívan beállítja a multipart-ot
}
```

### 4.2. Hitelesítési (Auth) Folyamat Áttekintése
1. Felhasználó hitelesítése a `/login` aloldalon (JWT igénylés).
2. A frontend megkapja a titkosított PayloadTokent és a Felhasználói DTO Entitást. Állapotfrissítés történik a React appban, ezáltal a Navbar kicserélődik bejelentkezett nézetre.
3. A Local Storage eltárolja az autorizációt (`localStorage.setItem('token', ...)`).
4. Kilépés esetén a JS üríti a token kulcsokat és szigorúan visszairányít a publikus `/` nézetbe védelem gyanánt.

---

## 5. Produkciós Kiadás (Build & Deploy)

Szervert nélküli vagy CI/CD pipeline segítségével végrehajtott közzététel lépései (Netlify, Vercel, NGINX Cloud):

```bash
# Optimalizált, bundle generálása
npm run build
```
Az izolált, "tree-shaking" optimalizáción és minifikáción átesett publikálható fájlcsomag a létrejövő `dist/` mappában fog megjelenni. Ennek ellenörzése és lokális kipróbálása a Vite belső megtekintőjével azonnali kiértékelést is nyújt:
```bash
npm run preview
```
Élesítést követően ezek az optimalizált statikus fájlok fogják betölteni a klienst az arra látogató gépeken. 
