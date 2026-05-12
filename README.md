# Amazon EU VAT Converter

A Tampermonkey userscript that shows you the **estimated price with your local VAT** alongside every price on Amazon EU storefronts.

Useful if you're shopping on a foreign Amazon (e.g. amazon.de) from a country with a different VAT rate — the displayed price already includes the source country's VAT, so the amount you actually get charged can differ.

> **Install on [Greasy Fork](https://greasyfork.org/ru/scripts/577753-amazon-eu-vat-converter)** · [Report an issue](../../issues)

---

## Features

- Works on amazon.de, .fr, .it, .es, .co.uk, .nl, .pl, .se
- Covers all 27 EU member states + Norway, Iceland, Switzerland and the UK
- Auto-detects your country from your browser's language setting
- Persistent country selection (saved in `localStorage`)
- Searchable country picker — click the pill in the bottom-right corner
- Handles dynamically loaded prices (infinite scroll, carousels, product pages)
- Hover any badge to see the net (ex-VAT) price breakdown

---

## How it works

Amazon EU storefronts display prices inclusive of their own country's VAT. When you order from a different EU country, the seller must charge your local VAT rate instead. This script estimates that adjusted price using the formula:

```
local_price = store_price ÷ (1 + source_VAT) × (1 + your_VAT)
```

For example, for a €29.99 item on amazon.de (19% German VAT) delivered to Finland (25.5%):

```
29.99 ÷ 1.19 × 1.255 = €31.63
```

This matches the amount shown on the actual Amazon invoice.

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) for Chrome, Firefox, Edge or Safari.
2. Click **[Install from Greasy Fork](https://greasyfork.org/ru/scripts/577753-amazon-eu-vat-converter)** — or install manually:
   - Open Tampermonkey → *Create a new script*
   - Delete the placeholder, paste in the contents of [`amazon-eu-vat-converter.user.js`](amazon-eu-vat-converter.user.js)
   - Press **Ctrl+S** to save
3. Browse to any supported Amazon storefront. A small pill appears in the bottom-right corner showing your active country and VAT rate.
4. Click the pill to search for and select a different country.

---

## Supported storefronts

| Storefront | Source VAT |
|---|---|
| amazon.de | 19% (Germany) |
| amazon.fr | 20% (France) |
| amazon.it | 22% (Italy) |
| amazon.es | 21% (Spain) |
| amazon.co.uk | 20% (United Kingdom) |
| amazon.nl | 21% (Netherlands) |
| amazon.pl | 23% (Poland) |
| amazon.se | 25% (Sweden) |

---

## Supported destination countries

| Country | Code | Standard VAT |
|---|---|---|
| Austria | AT | 20% |
| Belgium | BE | 21% |
| Bulgaria | BG | 20% |
| Switzerland | CH | 8.1% |
| Cyprus | CY | 19% |
| Czechia | CZ | 21% |
| Denmark | DK | 25% |
| Estonia | EE | 22% |
| Greece | GR | 24% |
| Spain | ES | 21% |
| Finland | FI | 25.5% |
| France | FR | 20% |
| United Kingdom | GB | 20% |
| Croatia | HR | 25% |
| Hungary | HU | 27% |
| Ireland | IE | 23% |
| Iceland | IS | 24% |
| Italy | IT | 22% |
| Lithuania | LT | 21% |
| Luxembourg | LU | 17% |
| Latvia | LV | 21% |
| Malta | MT | 18% |
| Netherlands | NL | 21% |
| Norway | NO | 25% |
| Poland | PL | 23% |
| Portugal | PT | 23% |
| Romania | RO | 19% |
| Sweden | SE | 25% |
| Slovenia | SI | 22% |
| Slovakia | SK | 20% |

---

## Caveats

**Standard rate only.** This script applies the standard VAT rate for your country to all items. In practice, some product categories (food, books, medicine, etc.) qualify for reduced rates — for example 10% in Finland for books, or 14% for food. The script will slightly overestimate prices for those items. For the vast majority of products on Amazon (electronics, household goods, clothing) the standard rate is correct.

**Estimates only.** Actual invoice amounts can differ by a few cents due to per-item rounding. Treat the displayed prices as a close guide, not a precise quote.

**Marketplace sellers.** Prices from third-party sellers on Amazon may use different VAT handling depending on the seller's registration. The conversion assumes Amazon is collecting VAT on the transaction (which is the case for most EU cross-border sales under the EU OSS rules).

**VAT rates change.** Rates are accurate as of May 2025 but governments do change them. If you notice an out-of-date rate, please open an issue or a pull request.

---

## Contributing

Pull requests are welcome. If you want to:

- **Update a VAT rate** — edit the `COUNTRIES` array in the script and update the table in this README
- **Add a new storefront** — add a `@match` line and an entry in the `SOURCE_VATS` map
- **Add reduced rate support** — this is the most valuable open problem; a mapping of Amazon product categories to VAT categories per country would be needed

Please open an issue first for larger changes so we can discuss the approach.

---

## License

MIT
