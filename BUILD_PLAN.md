# 🚀 Stacka - Build Plan

**Strukturerad utvecklingsplan med tydliga dependencies och prioriteringar**

---

## 📋 Innehållsförteckning

1. [MVP Status](#mvp-status)
2. [Fas 1: Grundläggande MVP](#fas-1-grundläggande-mvp)
3. [Fas 2: Partner & Budget](#fas-2-partner--budget)
4. [Fas 3: Avancerade Funktioner](#fas-3-avancerade-funktioner)
5. [Fas 4: Polering & Optimerad UX](#fas-4-polering--optimerad-ux)
6. [Framtida Funktioner](#framtida-funktioner)

---

## ✅ MVP Status

**Prioriterade MVP-funktioner:**
- ✅ Auth (Login/Register)
- ✅ Onboarding
- ✅ Partner Connection (grundläggande)
- ✅ Dashboard
- ✅ Budget (grundläggande)
- ✅ Expenses (lägg till/lista)
- ✅ Settings (profil, kategorier)

**Förväntad tidslinje för MVP:** 4-6 veckor

---

## 🎯 Fas 1: Grundläggande MVP

**Mål:** En fungerande app där användare kan logga in, lägga till utgifter och se översikt

### 1.1 Autentisering & Onboarding
- [x] **Auth Flow**
  - [x] Login med email/password
  - [x] Registrering med email/password
  - [x] OAuth (Google/Apple) - *valfritt för MVP*
  - [x] Auth callback hantering
  - [x] Protected routes middleware

- [x] **Onboarding Flow**
  - [x] Namn-input (hämtas från registration om möjligt)
  - [x] Löndag väljare
  - [x] Partner connection invitation
  - [x] Default kategorier skapas automatiskt
  - [x] Standard inkomst skapas (valfritt)
  - [x] Onboarding completion tracking

**Dependencies:** Auth måste vara klar före onboarding

---

### 1.2 Dashboard & Översikt
- [x] **Dashboard Sidan**
  - [x] Personlig hälsning
  - [x] Budgetperiod visning
  - [x] KPI-kort (Kvar att spendera, Förbrukat, Dagar till lön, Sparkvot)
  - [x] Budgetöversikt
  - [x] Fördelning (chart)
  - [x] Senaste utgifter (top 5)

- [x] **Beräkningar**
  - [x] Budgetperiod logik (baserat på löndag)
  - [x] Hushållsinkomst (user + partner om kopplad)
  - [x] Kvar att spendera beräkning
  - [x] Progress mot budget

**Dependencies:** Incomes, Expenses, Budgets måste finnas

---

### 1.3 Utgifter (Expenses)
- [x] **Lägg till Utgift**
  - [x] Belopp-input (centrerad, snygg UX)
  - [x] Beskrivning
  - [x] Kategori-dropdown (sökbar)
  - [x] Datumväljare
  - [x] CCM-toggle (om aktiverat)
  - [x] Cost assignment (personal/shared/partner)

- [x] **Utgiftslista**
  - [x] Visa alla utgifter
  - [x] Filtrera per period
  - [x] Sortera (datum, belopp, kategori)
  - [x] Redigera utgift
  - [x] Ta bort utgift

- [x] **Återkommande Utgifter** ✅ KLART
  - [x] Skapa återkommande utgift
  - [x] Välj frekvens (dag i månaden)
  - [x] Automatisk skapande av utgifter (cron-jobb)
  - [x] Hantera återkommande utgifter lista
  - [x] Dashboard-widget med kommande utgifter
  - [x] Realtime-synkning

**Dependencies:** Categories måste finnas

---

### 1.4 Kategorier
- [x] **Standardkategorier**
  - [x] Auto-skapas vid onboarding
  - [x] Fasta kostnader (Hyra, El, etc)
  - [x] Rörliga kostnader (Mat, Nöje, etc)
  - [x] Sparande kategorier

- [x] **Kategori-hantering**
  - [x] Visa alla kategorier
  - [x] Skapa egen kategori
  - [x] Redigera kategori
  - [x] Ta bort kategori (validera att inga utgifter använder den)

**Dependencies:** Inga kritiska dependencies

---

### 1.5 Inkomster
- [x] **Inkomst-hantering**
  - [x] Visa egna inkomster (på profilsida)
  - [x] Lägg till inkomst
  - [x] Redigera inkomst
  - [x] Ta bort inkomst
  - [x] Hushållsinkomst funktion (för budget)

**Dependencies:** Profil-sidan måste finnas

---

### 1.6 Inställningar
- [x] **Profil**
  - [x] Redigera namn
  - [x] Ändra löndag
  - [x] Inkomster lista (endast egna)
  - [x] Spara ändringar

- [x] **Kategorier**
  - [x] Hantera kategorier

- [x] **Partner Connection**
  - [x] Generera inbjudningskod
  - [x] Gå med med kod
  - [x] Visa kopplad partner
  - [x] Koppla från partner
  - [x] Delningslogik (från kopplingstidpunkt)

- [x] **CCM (Credit Card Manager)** ✅ KLART
  - [x] Aktivera CCM
  - [x] Sätt faktura brytdatum
  - [x] Visa CCM-utgifter separat (ny flik på expenses-sidan)

- [x] **Lån** ✅ KLART
  - [x] Lägg till lån (bolån, övriga)
  - [x] Visa alla lån med gruppering
  - [x] Redigera och ta bort lån
  - [x] Amorteringsplan (per månad/år)
  - [x] Räntekostnadsberäkning
  - [x] Snittränta (viktad mot skuld)
  - [x] Månads- och totalöversikt

**Dependencies:** Profil måste vara klar för att kunna ändra inställningar

---

## 🎯 Fas 2: Partner & Budget

**Mål:** Fullständig partner-delning och fungerande budget-system

### 2.1 Partner Delning (Förbättringar)
- [x] **Grundläggande Delning**
  - [x] RLS policies för partner-delning
  - [x] Dela utgifter (från kopplingstidpunkt)
  - [x] Dela kategorier (endast custom, inte default)
  - [x] Dela inkomster (för budgetberäkningar)

- [x] **Avancerad Delning**
  - [ ] Välja att dela historik vid koppling
  - [x] Expense assignment (personal/shared/partner)
  - [x] Synkronisering i realtid (Supabase Realtime) ✅ KLART
  - [ ] Notifikationer vid nya utgifter

**Dependencies:** Partner connection måste vara klar

---

### 2.2 Budget System
- [x] **Budget Översikt**
  - [x] Budget-lista
  - [x] Visa budget för aktuell period

- [x] **Skapa Budget**
  - [x] Budget-period väljare
  - [x] Inkomst-input (från båda partners om kopplad)
  - [x] Budget-items per kategori
  - [x] Fasta kostnader
  - [x] Rörliga kostnader
  - [x] Sparande mål
  - [x] Total översikt och validering
  - [x] Spara budget

- [x] **Redigera Budget**
  - [x] Öppna befintlig budget
  - [x] Uppdatera budget-items
  - [x] Visa progress vs faktiska utgifter
  - [x] Budget-varningar (när man närmar sig limit)

- [x] **Budget Beräkningar**
  - [x] Automatisk fördelning av inkomst
  - [x] Sparande-procent beräkning
  - [x] Kvar att spendera per kategori
  - [x] Budget vs faktiskt jämförelse

- [x] **Budget UX Förbättringar** ✅ KLART
  - [x] Partner-specifika belopp per kategori (split-funktion)
  - [x] Inkomstfält i budget-formulär (förifyllt från databas)
  - [x] Per-partner sammanställning (kvar att spendera per person)
  - [x] API för hushållsinkomster (bypass RLS för partner-data)
  - [x] Kategorier med standardvärden (default amounts som används vid ny budget)
  - [x] Kopiera budget från föregående period med ett klick
  - [x] Visa föregående månads värden (toggle + visning under varje kategori)
  - [x] Ändra kategori-typ (Fast/Rörlig/Sparande) i kategori-dialogen

**Dependencies:** Incomes, Expenses, Categories, Partner connection måste vara klara

---

### 2.3 Dashboard Förbättringar
- [ ] **Partner-specifika vyer**
  - [ ] Visa partnerns senaste utgifter
  - [ ] Hushålls-översikt
  - [ ] Delade vs personliga utgifter

**Dependencies:** Budget system måste vara klart

---

## 🎯 Fas 3: Avancerade Funktioner

**Mål:** Lägga till sparande, lån, och AI-funktioner

### 3.1 Sparande-mål (Savings Goals) ✅ KLART
- [x] **Sparande-sidor**
  - [x] Lista alla sparande-mål (tabs: Nytt/Aktiva/Uppnådda)
  - [x] Skapa nytt sparande-mål (formulär med målbelopp, typ, måldatum, månadssparande)
  - [x] Progress tracking (procent, kvar att spara, tid kvar)
  - [ ] Automatisk överföring från budget (kräver recurring expenses)

- [x] **Sparande-hantering**
  - [x] Lägg till nya mål med fullständigt formulär
  - [x] Visa progress (procent och kr, progress-bar)
  - [x] Avsluta/arkivera mål (via dropdown-meny)
  - [x] Sparande-kategorier (koppling till budget-kategorier)
  - [x] Partner-delning (is_shared toggle)
  - [x] Månadssparande-beräkning (visar vad som behövs per månad)

**Dependencies:** Budget system, Categories

---

### 3.2 Lån (Loans) ✅ KLART
- [x] **Lån-hantering**
  - [x] Lägg till lån (lånebelopp, ränta, amorteringstid)
  - [x] Visa alla lån med lån-grupperingar (Bolån, Övriga)
  - [x] Redigera och ta bort lån
  - [x] Räntehistorik (databasstruktur klar, UI för historik kan utökas)
  - [x] Amorteringsplan (per månad och per år)
  - [x] Beräkning av total skuld, snittränta, månadskostnad

**Dependencies:** Inga kritiska dependencies

---

### 3.3 CCM (Credit Card Manager) ✅ KLART
- [x] **CCM Grundfunktioner**
  - [x] Aktivera CCM i inställningar
  - [x] Sätt faktura brytdatum
  - [x] Markera utgifter som CCM
  - [x] Visa CCM-utgifter i dedikerad dashboard (/settings/ccm)
  - [x] CCM-toggle aktiverad som default när CCM är aktiverat
  - [x] Filter på "Senaste"-fliken (Alla/Kreditkort/Direkta)

- [x] **CCM Avancerat**
  - [x] Faktura-perioder (gruppering baserat på brytdatum)
  - [x] Automatisk gruppering av CCM-utgifter per fakturaperiod
  - [x] Faktura-översikt med totalsumma och antal
  - [x] Ange faktiskt fakturabelopp per period
  - [x] Betalningsfördelning (user/partner baserat på cost_assignment)
  - [x] Varning om registrerat > faktura (dubbelregistrering)
  - [x] Oregistrerade utgifter delas 50/50
  - [ ] Betalning tracking (framtida förbättring)

**Dependencies:** Expenses, Settings

---

### 3.4 Statement Analyzer (AI)
- [ ] **Upload & Parsing**
  - [ ] Upload bankutdrag (PDF/CSV)
  - [ ] AI-parsing av transaktioner
  - [ ] Automatisk kategorisering
  - [ ] Förhandsgranskning

- [ ] **Import Process**
  - [ ] Granska importerade transaktioner
  - [ ] Justera kategorier
  - [ ] Bekräfta och importera till expenses
  - [ ] Hantera dubbletter

**Dependencies:** Expenses, Categories, OpenAI API

**Notera:** Detta är en avancerad funktion som kan komma efter MVP

---

## 🎯 Fas 4: Polering & Optimerad UX

**Mål:** Göra appen snabb, snygg och användarvänlig

### 4.1 Prestanda & Optimerad UX
- [x] **Loading States** ✅ KLART
  - [x] Skeletons för laddning (Dashboard, Expenses, Budget)
  - [ ] Optimistiska uppdateringar
  - [ ] Error boundaries

- [ ] **Optimeringar**
  - [ ] Image optimization
  - [ ] Code splitting
  - [ ] Query optimization (TanStack Query)
  - [ ] Realtime subscriptions optimering

- [ ] **Caching**
  - [ ] Smart caching strategi
  - [ ] Cache invalidation
  - [ ] Offline support (PWA)

---

### 4.2 Realtid & Notifikationer
- [x] **Supabase Realtime** ✅ KLART
  - [x] Partner-expense synkning
  - [ ] Budget-uppdateringar (realtime aktiverad, hook ej implementerad)
  - [ ] Partner-aktivitet visning

- [ ] **Notifikationer**
  - [ ] Push notifications (valfritt)
  - [ ] In-app notifikationer
  - [ ] Budget-varningar

**Dependencies:** Partner connection, Budget system

---

### 4.3 Internationellisering (i18n)
- [x] **Grundläggande**
  - [x] Svenska som default
  - [x] next-intl setup
  - [x] Translation files struktur

- [ ] **Komplett Översättning**
  - [ ] Alla texter översatta till engelska
  - [ ] Språk-växlare i inställningar
  - [ ] Datum/valuta-formatering per språk

**Dependencies:** Alla sidor måste vara klara

---

### 4.4 Mobile Optimization
- [ ] **Mobile-first Förbättringar**
  - [ ] Touch-optimering
  - [ ] Swipe-gester
  - [ ] Bottom sheet för åtgärder
  - [ ] Keyboard handling

- [ ] **PWA Features**
  - [x] Manifest file
  - [ ] Service worker
  - [ ] Offline mode
  - [ ] Install prompt

---

### 4.5 Analytics & Insights
- [ ] **Statistik & Rapporter**
  - [ ] Månadsrapport
  - [ ] Kategori-analys
  - [ ] Trend-diagram
  - [ ] Export till CSV/PDF

**Dependencies:** Expenses, Budgets måste ha tillräckligt med data

---

## 🔮 Framtida Funktioner

**Ideer från tidigare "zaveio" notes och framtida förbättringar:**

### Kategorisering & Automatisering
- [ ] **Smart Kategorisering**
  - [ ] AI-baserad automatisk kategorisering av utgifter
  - [ ] Lära sig från användarens val
  - [ ] Föreslå kategorier baserat på beskrivning

- [ ] **Regler & Automatisering**
  - [ ] Skapa regler för automatisk kategorisering
  - [ ] Automatisk kostnadsfördelning (t.ex. hälften till partner)
  - [ ] Återkommande betalningar som regler

---

### Export & Integration
- [ ] **Export Funktionalitet**
  - [ ] Export alla data (GDPR compliance)
  - [ ] Export budget/expenses till Excel/CSV
  - [ ] Årsrapport generation

- [ ] **Bank Integration** (Premium)
  - [ ] Open Banking integration
  - [ ] Automatisk import från banker
  - [ ] Konto-synkronisering
  - [ ] Automatisk matchning med manuellt registrerade utgifter
  - [ ] Rekonsiliering av transaktioner

---

### Avancerad Budgetering
- [ ] **Budget Templates**
  - [ ] Fördefinierade budget-mallar
  - [ ] Spara egna mallar
  - [ ] Kopiera budget från föregående månad

- [ ] **Flexibla Budgetar** (Premium)
  - [ ] Skapa flera budgetar parallellt (t.ex. månadsbudget + resebudget)
  - [ ] Specifika budgetar för projekt (t.ex. "Portugal 2025")
  - [ ] Konsolidera flera budgetar till huvudbudget
  - [ ] Separata budgetar för olika syften
  - [ ] Nya användare får 2 separata budgetar gratis

- [ ] **Scenario Planning**
  - [ ] "Vad händer om"-kalkylatorer
  - [ ] Jämför olika budget-scenarion

---

### Avancerad Lånhantering
- [ ] **Billån**
  - [ ] Specifik låntyp för billån
  - [ ] Koppling till fordon (registreringsnummer, märke, modell)
  - [ ] Restvärde-beräkning
  - [ ] Leasing vs köp-jämförelse

- [ ] **Studielån (CSN)**
  - [ ] Specifik hantering för CSN-lån
  - [ ] Årsbelopp och avbetalningsplan
  - [ ] Ränta efter studier

- [ ] **Lån-optimering**
  - [ ] Jämför lån mellan banker
  - [ ] "Vad kostar det att amortera extra?"-kalkylator
  - [ ] Refinansierings-analys

---

### Social Features (valfritt)
- [ ] **Dela Budgets**
  - [ ] Dela budget med familj/vänner (read-only)
  - [ ] Budget-tips och råd

---

### Expense Tracking & Organisation
- [ ] **Expense Numbering/Tracking**
  - [ ] Automatisk nummerering av utgifter
  - [ ] Unik ID per utgift för spårning
  - [ ] Matcha mot importerade transaktioner
  - [ ] Rekonsiliering mot bankutdrag
  - [ ] Jämförelse och verifiering

- [ ] **Tags & Projects**
  - [ ] Lägg till tags på utgifter
  - [ ] Skapa projekt (t.ex. "Portugal 2025")
  - [ ] Filtra utgifter per tag/projekt
  - [ ] Projekt-specifik budget och spårning
  - [ ] Visa totalt per projekt/tag
  - [ ] Projekt-rapporter

- [ ] **Multi-Currency Support** (Premium)
  - [ ] Lägg till utgifter i olika valutor
  - [ ] Välj valuta per utgift
  - [ ] Automatisk konvertering till huvudvaluta (SEK)
  - [ ] En gångs-konvertering för optimerad prestanda
  - [ ] Uppdatera expense-tabellen med utländsk valuta-värden
  - [ ] Valuta-växelkurser (manuell eller API)
  - [ ] Visa utgifter i originalvaluta + konverterat värde

---

## 📊 Progress Tracker

### Fas 1: Grundläggande MVP
**Status:** 🟢 100% klar ✅

- [x] Auth & Onboarding
- [x] Dashboard
- [x] Expenses (grundläggande)
- [x] Categories
- [x] Incomes
- [x] Settings (grundläggande)
- [x] Lån (komplett: CRUD, amorteringsplan, beräkningar)
- [x] Återkommande utgifter ✅ KLART

### Fas 2: Partner & Budget
**Status:** 🟢 100% klar ✅

- [x] Partner connection (grundläggande)
- [x] Partner-delning av utgifter
- [x] Partner-delning förbättringar (Realtid-synkning)
- [x] Budget skapa/redigera
- [x] Budget beräkningar
- [x] Budget UX (komplett: split, inkomst, föregående månad, kopiera, standardvärden)

### Fas 3: Avancerade Funktioner
**Status:** 🟢 ~75% klar

- [x] Sparande-mål ✅ KLART (UI, formulär, progress, arkivering)
- [x] Lån ✅ KLART
- [x] CCM ✅ KLART (inställningar, fakturaperioder, kreditkortsflik)
- [ ] Statement Analyzer

### Fas 4: Polering & UX
**Status:** 🟡 ~50% klar

- [x] Grundläggande i18n
- [x] PWA manifest
- [x] Realtid-synkning (expenses)
- [x] Skeleton loaders (Dashboard, Expenses, Budget)
- [ ] Mobile optimization
- [ ] Analytics

---

## 🎯 Nästa Steg (Prioriterad Order)

### Omedelbara Prioriteringar:

1. **Slutför MVP Grundfunktioner**
   - [ ] Återkommande utgifter
   - [ ] CCM grundläggande

2. **Budget System** ✅ KLART
   - [x] Skapa budget UI
   - [x] Budget beräkningar
   - [x] Budget vs faktiskt visning

3. **Partner Förbättringar** ✅ KLART
   - [x] Realtid-synkning (Supabase Realtime)
   - [x] Expense assignment UI

4. **Sparande-mål** ✅ KLART
   - [x] UI för sparande (tabs, formulär, kort)
   - [x] Progress tracking (procent, kr, tid kvar)

5. **Lån** ✅ KLART
   - [x] Lånhantering UI (lägg till, redigera, ta bort)
   - [x] Lånegrupper (Bolån, Övriga)
   - [x] Amorteringsplan (per månad/år)
   - [x] Beräkningar (total skuld, snittränta, månadskostnad)

6. **Polering**
   - [ ] Mobile optimization
   - [x] Loading states (Skeleton loaders)
   - [ ] Error handling

---

## 📝 Notes & Best Practices

### Development Guidelines

1. **Dependencies är viktiga**
   - Implementera alltid i rätt ordning
   - Testa dependencies innan du går vidare
   - Dokumentera dependencies i koden

2. **Testa med Partner**
   - Testa alltid partner-funktioner med två konton
   - Verifiera RLS policies
   - Testa edge cases (disconnect, reconnect)

3. **Mobile-first**
   - Designa alltid för mobil först
   - Testa på riktiga enheter
   - Tänk på touch-interaktioner

4. **Data Integrity**
   - Validera alltid data innan sparning
   - Hantera edge cases (t.ex. tomma kategorier)
   - Tänk på cascade deletes

5. **Performance**
   - Använd TanStack Query för caching
   - Lazy load stora komponenter
   - Optimera queries (begränsa data)

---

## 🔄 Regular Updates

**Uppdatera denna plan regelbundet:**
- Bocka av completed tasks
- Uppdatera status
- Lägg till nya funktioner när de identifieras
- Justera prioriteringar baserat på feedback

**Senast uppdaterad:** 2026-01-14

### Senaste ändringar (2026-01-14):
- ✅ **CCM (Credit Card Manager) - komplett implementation v2:**
  - Omstrukturerad: CCM-dashboard nu under /settings/ccm
  - Inställningar flyttade till /settings/ccm/settings
  - Filter på "Senaste"-fliken i expenses (Alla/Kreditkort/Direkta)
  - Ange faktiskt fakturabelopp per period (ccm_invoices tabell)
  - Betalningsfördelning mellan partners baserat på cost_assignment
  - Varning när registrerat belopp > fakturabelopp
  - Oregistrerade utgifter delas 50/50 mellan partners
  - use-ccm-invoices.ts hook för faktura-hantering
  - Migration: 20240101000015_ccm_invoices.sql

### Tidigare ändringar (2025-12-23):
- ✅ **CCM (Credit Card Manager) - första implementation:**
  - CCM-inställningssida med aktivering och brytdatum
  - CCM-toggle aktiverad som default när CCM är aktiverat
  - useCCMExpenses hook med getInvoicePeriod och groupExpensesByInvoicePeriod

- ✅ **Återkommande utgifter - komplett:**
  - RecurringExpensesWidget på dashboard
  - Realtime-synkning via use-recurring-expenses-realtime.ts
  - Cron-jobb för automatisk bearbetning

- ✅ **TypeScript-fel fixade:**
  - Alla hooks uppdaterade med korrekta type assertions
  - Build går nu igenom utan fel

### Tidigare ändringar (2025-12-22):
- ✅ **Sparande-mål (Savings Goals) - komplett UI:**
  - Skapat `savings-goal-form.tsx` med fullständigt formulär (målbelopp, typ, måldatum, månadssparande, partner-delning)
  - Skapat `savings-goal-card.tsx` med progress-bar, dropdown-meny, tid kvar, behövt månadssparande
  - Skapat `dropdown-menu.tsx` UI-komponent (saknades)
  - Uppdaterad `/savings/page.tsx` med tabs (Nytt/Aktiva/Uppnådda), sammanfattningskort
  - Skapat `en.json` med engelska översättningar för hela appen
  - Navigation finns redan i Settings → Ekonomi → Sparmål

- ✅ **Lån-hantering (komplett implementation):**
  - Skapat `use-loans.ts` hook med CRUD-operationer
  - Skapat `use-loan-groups.ts` hook för lånegrupper (Bolån, Övriga)
  - LoanForm-komponent för att lägga till/redigera lån
  - LoanCard-komponent med översikt och statistik
  - AmortizationPlanDialog för detaljerad amorteringsplan (per månad/år)
  - Beräkningar: total skuld, snittränta (viktad), månadskostnad, år kvar
  - Uppdaterad settings/loans/page.tsx med fullständig funktionalitet
  - Översättningar tillagda i sv.json
  - Future features: Billån, Studielån (CSN), Lån-optimering

### Tidigare ändringar (2025-12-04):
- ✅ **Supabase Realtime-synkning:**
  - Implementerad `use-expenses-realtime.ts` hook
  - RealtimeProvider integrerad i app-shell
  - Partner-utgifter synkas i realtid mellan användare
  - Realtime aktiverad på 8 tabeller: expenses, budgets, budget_items, categories, incomes, recurring_expenses, partner_connections, savings_goals, profiles
  - Query invalidation för expenses och dashboard
- ✅ **Skeleton Loaders:**
  - Skapat bas-skeleton komponenter (`skeleton.tsx`)
  - Dashboard-specifika skeletons (`dashboard-skeleton.tsx`)
  - Expense list skeletons (`expense-list-skeleton.tsx`)
  - Budget list skeletons (`budget-list-skeleton.tsx`)
  - Shimmer-animation tillagd i globals.css
  - Ersatt full-page LoadingPage med granulära skeletons

### Tidigare ändringar (2025-12-04):
- ✅ **Kategori-inställningar utökade:**
  - Standardvärde för budget (default_value) per kategori
  - Möjlighet att ändra kategori-typ (Fast/Rörlig/Sparande)
  - Visar standardvärde i kategorilistan
- ✅ **Föregående månads budget:**
  - Toggle för att visa föregående månads värden
  - Värden visas under varje kategori-input
  - Kopiera-knapp med bekräftelsedialog
  - Kopierar alla utgifter (ej inkomster) från föregående månad
- ✅ **Smart default period:**
  - Ny budget öppnas för nästa period utan budget
  - Om december 2025 finns → default januari 2026
- ✅ **Budget-utkast (auto-save):**
  - Sparar automatiskt till localStorage var 2:a sekund (helt tyst)
  - Sparar både utgifter OCH inkomster per period
  - Återställer utkast när man återvänder till en period
  - Ingen toast-notifikation - värden visas direkt
  - Inkomster återställs till databasvärden för nya perioder utan utkast
  - Utkast rensas när budget sparas
- ✅ **Read-only för sparade budgets i /new:**
  - Visar info-banner när period redan har budget
  - Alla fält blir read-only
  - Länk till budgetsidan för redigering

### Ändringar (2025-12-03):
- ✅ Budget split-funktion: Möjlighet att sätta olika belopp per partner
- ✅ Inkomstfält i budgetformulär med förifyllda värden från databasen
- ✅ Per-partner sammanställning som visar kvarvarande budget per person
- ✅ API-route för hushållsinkomster (bypass RLS med service role key)
- ✅ Alert-dialog UI-komponent tillagd

---

## 💎 Premium Features (Från Zaveio Notes)

**Funktioner markerade som Premium kan vara betalfunktioner i framtiden:**

- 🔒 **Bank Integration** - Automatisk import och synkronisering
- 🔒 **Flexibla Budgetar** - Flera parallella budgetar (rese, projekt, etc)
- 🔒 **Multi-Currency** - Stöd för flera valutor med konvertering

**Notera:** Premium-markeringar är för framtida monetarisering. Implementera först funktionaliteten, markera sedan som premium i UI.

---

**Varje checkbox representerar en specifik funktion eller komponent. Fokusera på att slutföra en fas i taget! 🚀**

