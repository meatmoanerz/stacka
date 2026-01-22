# Stacka - Personal Finance App

Stacka är en personlig finansapp byggd med Next.js och Supabase för att hjälpa användare att hantera sin ekonomi, budgetera och spara mot mål.

## Funktioner

### Budget & Utgifter
- Skapa och hantera månadsbudgetar
- Spåra utgifter i olika kategorier (fasta, rörliga, sparande)
- Stöd för delad ekonomi med partner
- CCM (kreditkortsmärkning) för att separera kontantflöde från kreditköp

### Sparmål
- Skapa sparmål med målbelopp och datum
- **Automatisk kategori**: När ett sparmål skapas, skapas automatiskt en kategori med samma namn
- **Bidrag via utgifter**: Lägg till en utgift i sparmålets kategori för att automatiskt bidra till målet
- **Delat sparande**: Vid delade utgifter fördelas bidraget 50/50 mellan dig och din partner
- **Anpassade måltyper**: Skapa egna måltyper med valfri ikon
- **Detaljvy**: Klicka på ett sparmål för att se inbetalningshistorik och statistik

### Kategorier
- Fördefinierade kategorier för vanliga utgifter
- Möjlighet att skapa egna kategorier
- Kategorier länkas automatiskt till sparmål

### Partner-funktionalitet
- Bjud in en partner för delad ekonomi
- Se kombinerad budget och utgifter
- Spåra individuella bidrag till gemensamma mål

## Teknisk Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: React Query, Zustand
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Kom igång

### Förutsättningar
- Node.js 18+
- Supabase-projekt

### Installation

1. Klona repositoryt
```bash
git clone <repository-url>
cd stacka
```

2. Installera beroenden
```bash
npm install
```

3. Kopiera miljövariabler
```bash
cp .env.example .env.local
```

4. Fyll i dina Supabase-credentials i `.env.local`

5. Kör databasmigrationer i Supabase Dashboard

6. Starta utvecklingsservern
```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Databasschema

### Huvudtabeller
- `profiles` - Användarprofiler
- `categories` - Utgiftskategorier
- `expenses` - Utgifter
- `savings_goals` - Sparmål
- `savings_goal_contributions` - Bidrag till sparmål (från utgifter)
- `custom_goal_types` - Användardefinierade måltyper
- `budgets` - Månadsbudgetar
- `budget_items` - Budgetposter

### Sparmål-logik

När ett sparmål skapas:
1. En kategori skapas automatiskt med samma namn som sparmålet
2. Kategorin länkas till sparmålet via `linked_savings_goal_id`

När en utgift skapas med en sparmålskategori:
1. Utgiften skapas som vanligt
2. Ett bidrag (`savings_goal_contribution`) skapas automatiskt
3. Sparmålets totala sparande uppdateras via databastrigger

Bidragsfördelning vid delad utgift:
- `personal`: 100% till användaren
- `shared`: 50% till varje partner
- `partner`: 100% till partnern

## Deployment

Se [DEPLOYMENT.md](./DEPLOYMENT.md) för deploymentinstruktioner.

## Licens

Privat projekt.
