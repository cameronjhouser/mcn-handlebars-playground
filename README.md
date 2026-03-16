# MCN Handlebars Playground

A local dev environment for authoring and testing **Marketing Cloud Next Handlebars** templates.

Implements all documented MCN helpers (Object/List, String, Date/Time, Comparison, Utility, Math) using [Handlebars.js](https://handlebarsjs.com/) + custom JavaScript helpers that match [Handlebars.Net](https://github.com/Handlebars-Net/Handlebars.Net) behavior.

**Source docs:** [Handlebars for Marketing Cloud Next — Salesforce Developers](https://developer.salesforce.com/docs/marketing/handlebars-for-marketing-cloud-next/)

---

## Quickstart (local dev)

**Requirements:** Node.js 18+

```bash
# 1. Install dependencies (one time)
npm install

# 2. Start the dev server
npm run dev
# → opens at http://localhost:5173
```

---

## Using the playground

| Area | What it does |
|---|---|
| **Template** (top-left) | Write Handlebars syntax — re-renders automatically on every keystroke |
| **Data (JSON)** (bottom-left) | Your data payload — edit inline or load from the `data/` folder |
| **Output** (top-right) | Live rendered HTML preview, isolated in an iframe |
| **Console** (bottom-right) | Template errors and render status |
| **Reference bar** (bottom) | Quick-reference for every helper — click a name to insert its syntax at cursor |

### Using your own data payload

1. Drop a `.json` file into the `data/` folder
2. It appears automatically in the **Data file** dropdown (HMR hot-reloads it)
3. Edit the file in VS Code / any editor — the playground updates instantly
4. Hit **↺ Reload** if hot-reload doesn't catch a change

---

## Available helpers

### Object & List
| Helper | Syntax |
|---|---|
| `each` | `{{#each list}} ... {{/each}}` — built-in, provides `@index`, `@key`, `@first`, `@last` |
| `filter` | `{{filter list "field" "op" value "type"}}` — ops: `>` `<` `==` `!=` `>=` `<=` `CONTAINS` `IS_NULL` `IS_NOT_NULL` |
| `flatten` | `{{flatten nestedList}}` — flattens one level |
| `get` | `{{get collection indexOrKey}}` — 0-based index or object key |
| `map` | `{{map list "fieldName"}}` — extract field from each item |
| `slice` | `{{slice list startIndex [endIndex]}}` — 0-based, negative indices OK |

### String
| Helper | Syntax |
|---|---|
| `char` | `{{char code [repeated]}}` — Unicode character from decimal code |
| `concat` | `{{concat val1 val2 ...}}` — join values into a string |
| `indexOf` | `{{indexOf subject search}}` — 0-based position, -1 if not found |
| `lowercase` | `{{lowercase subject [culture]}}` |
| `properCase` | `{{properCase subject}}` — capitalises first letter of each word |
| `replace` | `{{replace subject search replacement}}` — all occurrences, case-sensitive |
| `substring` | `{{substring subject start [length]}}` — ⚠️ **1-based** start index |
| `trim` | `{{trim subject}}` |
| `uppercase` | `{{uppercase subject [culture]}}` |

### Date & Time
| Helper | Syntax |
|---|---|
| `now` | `{{now}}` — current time in CST (UTC-6). Format: `M/D/YYYY h:mm:ss AM/PM -06:00` |

### Comparison
| Helper | Syntax |
|---|---|
| `and` | `{{and v1 v2 ...}}` / `{{#and ...}} ... {{/and}}` |
| `compare` | `{{compare left "op" right}}` — ops: `>` `<` `>=` `<=` `==` `!=` |
| `equals` | `{{equals v1 v2 [compareAs]}}` — compareAs: `string` `number` `date` `datetime` |
| `if` | `{{#if cond}} ... {{else if c2}} ... {{else}} ... {{/if}}` — built-in |
| `iif` | `{{iif expr trueVal falseVal}}` — ternary (both branches always evaluated) |
| `isEmpty` | `{{isEmpty val}}` — true if null, `""`, or `[]` |
| `isNull` | `{{isNull val}}` — true if null/undefined |
| `not` | `{{not val}}` / `{{#not val}} ... {{/not}}` |
| `or` | `{{or v1 v2 ...}}` / `{{#or ...}} ... {{/or}}` |
| `unless` | `{{#unless cond}} ... {{else}} ... {{/unless}}` — built-in |

### Utility
| Helper | Syntax |
|---|---|
| `fallback` | `{{fallback value fallbackValue}}` |
| `format` | `{{format subject "fmtStr" [type] [culture]}}` — type: `date` or `numeric` |
| `formatCurrency` | `{{formatCurrency value [currency] [culture]}}` |
| `formatNumber` | `{{formatNumber value [fmtStr] [culture]}}` |
| `length` | `{{length subject}}` — char count (string) or element count (array) |
| `repeat` | `{{#repeat count}} ... {{/repeat}}` — provides `@index`, `@first`, `@last` |
| `set` | `{{#set key="val"}} ... {{/set}}` — scoped local variables |
| `sort` | `{{sort list "field" "asc\|desc" "type"}}` — type: `string` `number` `date` `boolean` |
| `with` | `{{#with object}} ... {{/with}}` — built-in, use `@root` to access root context |

### Math
| Helper | Syntax |
|---|---|
| `add` | `{{add value1 value2}}` — sum, rounded to 2 dp |
| `subtract` | `{{subtract value1 value2}}` — difference, rounded to 2 dp |
| `multiply` | `{{multiply value1 value2}}` — product, rounded to 2 dp |
| `divide` | `{{divide dividend divisor}}` — quotient, rounded to 2 dp; throws on ÷0 |
| `modulo` | `{{modulo value1 value2}}` — remainder, rounded to 2 dp; throws on ÷0 |
| `Random` | `{{Random first second}}` — random integer in [first, second] inclusive |

---

## Known deviations from MCN / Handlebars.Net

| Helper | Note |
|---|---|
| `now` | Uses browser clock shifted to CST offset (−06:00); MCN uses actual server clock |
| `format (date)` | .NET format strings mapped best-effort via `Intl`; some edge cases may differ |
| `format (numeric)` | Supports N, F, C, P, D, E, G specifiers; custom `#` patterns partially supported |
| `culture` params | Passed to `Intl` APIs; .NET CultureInfo may differ for Turkic/Asian locales |
| `compare` dates | Uses `Date.parse()`; .NET DateTime parser supports more formats |
| `substring` | **1-based** start index per MCN docs (not 0-based like JS) |
| `iif` | Both branches always evaluated per MCN docs |
| `Random` | Uses `Math.random()`; MCN uses server-side RNG — range behavior matches |
| `isEmpty` / `isNull` / `formatCurrency` / `formatNumber` / `indexOf` / `properCase` | Docs returned 404; implemented from category descriptions |
| Math rounding | JS floating-point may introduce sub-cent differences vs .NET `Decimal` |

---

## Deployment (hosted URL)

### Build

```bash
npm run build
# Outputs to dist/
```

> **Note:** The `data/` JSON files are bundled into the build at compile time.
> Team members can still paste any JSON directly into the Data textarea.
> To add new data files, rebuild after adding them to `data/`.

### Deploy options

**Netlify** (drag & drop — no account config needed):
1. Run `npm run build`
2. Go to [netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder onto the page
4. Share the generated URL with your team

**Vercel:**
```bash
npx vercel --prod
```

**GitHub Pages** (via Actions):
Add `.github/workflows/deploy.yml` — see [Vite GitHub Pages guide](https://vitejs.dev/guide/static-deploy.html#github-pages).

**Any static host / CDN:**
Upload the contents of `dist/` — it's plain HTML + JS + CSS, no server required.

---

## Project structure

```
mcn-handlebars-playground/
├── data/                  ← Add your JSON payload files here
│   ├── sample-basic.json
│   ├── sample-list.json
│   └── my-payload.json
├── src/
│   ├── main.js            ← App entry point + reference data
│   ├── mcn-helpers.js     ← All MCN helper implementations
│   ├── samples.js         ← Built-in sample templates
│   └── style.css
├── index.html
├── package.json
└── README.md
```
