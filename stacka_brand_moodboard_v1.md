# Stacka – Moodboard, färgschema och logga-system (v1)

Det här dokumentet sammanfattar en brand-/designriktning för **Stacka** som matchar din nuvarande **matta Japandi + mjuk neumorphism**-känsla, men blir **tydligare, modernare och mer engagement-vänlig**.

---

## 1) Brandkänsla (ord som styr allt)

**Calm confidence • Scandinavian/Japandi • Soft tactile UI • Money clarity • Friendly, not fintech-hård**

Visuella associationer:
- **Sage-grönt + varma neutrala** (tryggt, vuxet, premium)
- **Tactile surfaces** (mjuka kort, inset inputs)
- **Tydlig hierarki** (siffror först, text sekundärt)
- **Micro-delight** (små, varma highlights)

---

## 2) Färger – 2 paletter som funkar med din nuvarande design

Du ligger redan nära en dämpad sage-grön bas. För att få mer “pop” utan att tappa Japandi: lägg till **en varm accent** och ev. **en kall accent** (används sparsamt).

### Palette A: “Sage + Clay” (varm, premium, Japandi)

**Primär (Sage):**
- Primary: `#5B6F5E`
- Primary soft: `#849685`
- Primary tint: `#D9E2D9`

**Neutrala (matta):**
- Bg: `#F7F6F2`
- Surface: `#FFFFFF`
- Surface 2: `#F1F2ED`
- Border/line: `#E3E6DE`

**Text:**
- Text strong: `#1E2521`
- Text: `#3A433D`
- Muted: `#6B756E`

**Accent (Clay – för CTA/Highlights):**
- Accent: `#C47B5A`
- Accent tint: `#F2D6CB`

**Status:**
- Success: `#2F7D57`
- Warning: `#B8842B`
- Error: `#B24A4A`

**Varför den här?** Clay ger “mänsklig värme” och gör att viktiga knappar/insikter sticker ut utan neon.

---

### Palette B: “Sage + Ink” (kallare, mer tech men fortfarande mjuk)

**Primär (Sage):**
- Primary: `#5B6F5E`
- Primary soft: `#849685`
- Primary tint: `#D9E2D9`

**Neutrala (matta):**
- Bg: `#F7F6F2`
- Surface: `#FFFFFF`
- Surface 2: `#F1F2ED`
- Border/line: `#E3E6DE`

**Text:**
- Text strong: `#1E2521`
- Text: `#3A433D`
- Muted: `#6B756E`

**Accent (Ink/Blue-gray):**
- Accent: `#334155`
- Accent tint: `#D7E0EA`

**Varför den här?** Ger lite mer “produkt/precision” för grafer, analyser och tabeller.

---

## 3) Dark mode (tätare kontrast men fortfarande mjukt)

Rekommenderad dark-botten (mer läsbarhet och snyggare kort):
- Bg: `#0F1311`
- Surface: `#151A17`
- Surface 2: `#1A1F1C`
- Border: `#262D28`

- Text strong: `#E8EEE9`
- Text: `#C7D0C9`
- Muted: `#93A097`

- Primary: `#849685` (funkar bra i dark)
- CTA (om du kör Clay): `#C47B5A`

---

## 4) Typografi (det som gör appen “dyrare” direkt)

**Rekommendation (enkelt, safe, snyggt):**
- **Inter** (UI-standard, superläsbar, bra siffror)

**Alternativ (mer premium):**
- **Plus Jakarta Sans**
- **DM Sans**

**Hierarki (för dina vyer):**
- H1 (siffror): 32–36 / semibold
- H2 (sektion): 18–20 / semibold
- Body: 14–16 / regular
- Muted labels: 12–13 / medium

**Pro-tips:** använd **tabular numbers** för alla belopp (så rader linjerar snyggt).

---

## 5) Ikoner & UI-stil (matcha neumorphism utan att bli “för mjuk”)

- Ikoner: **rounded line icons**, 1.5–2px stroke, inte för detaljerade.
- Cards: en nivå av elevation (inte flera).
- Inputs: **inset** (som du redan har) men med lite mer kontrast i dark mode.

**Microinteractions:**
- Hover: 2–3% ljusare surface
- Press: inset + ~0.98 scale
- Duration: 160–220ms, ease-out

---

## 6) Logga – ett system med 4 versioner

### Loggidé (passar namnet “Stacka”)
**Kärnikon:** en “stack” av 3–4 rundade plattor som kan läsas som:
- staplade kort (budget, konton, utgifter)
- bar chart (ekonomi)
- subtil “S” i negativ yta (valfritt)

### Versioner att ta fram
1) **Primary lockup**: ikon + “Stacka” wordmark (landing, login, settings)
2) **Icon only**: bara stack-ikonen (app-ikon, navbar, onboarding)
3) **Favicon**: superenkel (2–3 lager eller ett “S-block”)
4) **Monochrome**: 1-färg (svart/vit) för export, pdf, kvitton, mm.

### Form-spec (för en tidlös logga)
- Rundningar: samma radie som dina cards (t.ex. 16 eller 20)
- Geometri: 45° subtil offset mellan lagren (ser “stackat” ut)
- Undvik tunna outlines i loggan → kör **filled shapes** (känns mer premium)

---

## 7) Design tokens (copy-paste)

Exempel som CSS-variabler (Palette A):

```css
:root {
  --bg: #F7F6F2;
  --surface: #FFFFFF;
  --surface-2: #F1F2ED;
  --border: #E3E6DE;

  --text-strong: #1E2521;
  --text: #3A433D;
  --muted: #6B756E;

  --primary: #5B6F5E;
  --primary-soft: #849685;
  --primary-tint: #D9E2D9;

  --accent: #C47B5A;
  --accent-tint: #F2D6CB;

  --success: #2F7D57;
  --warning: #B8842B;
  --error: #B24A4A;
}

[data-theme="dark"] {
  --bg: #0F1311;
  --surface: #151A17;
  --surface-2: #1A1F1C;
  --border: #262D28;

  --text-strong: #E8EEE9;
  --text: #C7D0C9;
  --muted: #93A097;

  --primary: #849685;
  --primary-soft: #A5AEA3;
  --primary-tint: #263028;

  --accent: #C47B5A;
  --accent-tint: #3A2A24;
}
```

---

## 8) Nästa steg (om du vill)

Om du vill kan jag även ta fram:
- **Moodboard-bild** (grid med färgrutor, typografi, UI-känsla, textures)
- **Logga-sheet** med 4 versioner (primary, icon, favicon, mono)
- **SVG-vänlig spec** (grid, radier, mått) så loggan kan återskapas exakt i Figma/Illustrator eller direkt i kod.
