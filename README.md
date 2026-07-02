# Poshmark Sold Listings Analyzer

**Extract actual sold prices, original prices, sizes, and brands from Poshmark search results at high speeds to optimize your resale pricing strategy.**

Knowing the exact price an item *actually* sold for on Poshmark is the holy grail for vintage flippers, thrift store arbitrageurs, and clothing resellers. Relying on "listed prices" is dangerous because items are heavily negotiated.

This actor uses a high-speed static scraper built on `Cheerio` and `got-scraping` (for browser TLS fingerprinting to bypass Poshmark's strict PerimeterX bot protections). It sweeps through search pages and extracts the finalized sold data.

## What can this Actor do?

- ✅ **Actual Sold Prices** - Extracts the final, negotiated sale price of the item.
- ✅ **Listing Details** - Grabs the title, brand, and size of the item.
- ✅ **Retail Comparisons** - Extracts the original/retail price (the crossed-out price on the listing).
- ✅ **Lightning Fast** - Pulls data directly from the search/category feeds without doing slow deep-crawls into individual item pages.

## Why use this Actor?

- 🎯 **Price Optimization** - If you are selling a "Nike Vintage Windbreaker", scrape the sold listings to see exactly what people are actually paying for it.
- 🤝 **Thrift Arbitrage** - While in a thrift store, quickly check the sold velocity and actual value of an item before buying it.
- 📊 **Market Trends** - Analyze which brands and sizes are selling the most frequently.

## How to use it

1. Go to Poshmark and search for your niche (e.g., "Vintage Levis 501").
2. **IMPORTANT**: On the Poshmark sidebar, change the "Availability" filter to **"Sold Items"**.
3. Copy the URL from your browser and paste it into the **Poshmark Search URLs** field.
4. Set the **Max Listings to Extract** limit (default is 1000).
5. Click Start!

## How much does it cost?

This actor uses a **Pay-Per-Event (PPE)** pricing model. You only pay for the exact number of sold listings extracted!
- **$1.00 per 1,000 listings extracted.**

## Output Example

When a listing is extracted, the actor pushes this data to your dataset:

```json
{
  "title": "Nike Vintage Windbreaker 90s Colorblock",
  "brand": "Nike",
  "size": "L",
  "soldPrice": "$45",
  "originalPrice": "$80",
  "url": "https://poshmark.com/listing/Nike-Vintage-Windbreaker...",
  "scrapedAt": "2023-10-25T15:00:00.000Z"
}
```
