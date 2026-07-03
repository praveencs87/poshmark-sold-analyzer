import { armKillSwitch, disarmKillSwitch } from './utils/timeoutManager.js';
import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';

await Actor.init();

try {
    const input = await Actor.getInput();
    if (!input || !input.searchUrls || input.searchUrls.length === 0) {
        throw new Error('searchUrls input is required!');
    }

    const { searchUrls, maxListings = 1000 } = input;

    let totalListingsExtracted = 0;

    const crawler = new CheerioCrawler({
        maxConcurrency: 5,
        maxRequestRetries: 3,
        
        async requestHandler({ request, $, log }) {
            const url = request.url;
            log.info(`Scraping Poshmark URL: ${url}`);
            
            // Check for bot block
            if ($('title').text().toLowerCase().includes('human') || $('title').text().toLowerCase().includes('captcha')) {
                throw new Error('Blocked by PerimeterX/Human security check. Retrying...');
            }

            // Poshmark stores listing tiles in standard div structures
            const tiles = $('.tile, .card, div[data-et-name="listing"]').toArray();
            let listingsOnPage = 0;

            for (const tile of tiles) {
                if (totalListingsExtracted >= maxListings) break;

                const el = $(tile);
                
                // Title & URL
                let title = el.find('a.title, .title__text, a[data-et-name="listing"]').text().trim() || null;
                let link = el.find('a.title, a[data-et-name="listing"], a').first().attr('href') || null;
                
                let listingUrl = null;
                if (link) {
                    listingUrl = link.startsWith('http') ? link : `https://poshmark.com${link.startsWith('/') ? link : '/' + link}`;
                }

                // Prices
                let soldPrice = el.find('.price, .fw--bold.p--t--1').first().text().trim() || null;
                let originalPrice = el.find('.original-price, .p--t--1.tc--lg, .text--line-through').text().trim() || null;
                
                // Brand & Size
                let brand = el.find('.brand, .p--t--1.tc--lg').not('.text--line-through').text().trim() || null;
                let size = el.find('.size, .tile__details__pipe').text().trim() || null;
                
                // Sometimes Brand and Size are bundled in the same container separated by a pipe
                if (size && size.includes('|')) {
                    const parts = size.split('|').map(s => s.trim());
                    size = parts[0];
                    brand = parts.length > 1 ? parts[1] : brand;
                }

                if (!title) {
                    // Try parsing JSON if available in script tags (Poshmark sometimes embeds __NEXT_DATA__)
                    const jsonLd = el.find('script[type="application/ld+json"]').html();
                    if (jsonLd) {
                        try {
                            const data = JSON.parse(jsonLd);
                            if (data && data.name) title = data.name;
                            if (data && data.brand) brand = data.brand.name || data.brand;
                        } catch (e) {
                            // Ignored
                        }
                    }
                }

                if (!title && !soldPrice) continue; // Skip empty elements

                const output = {
                    title,
                    brand,
                    size,
                    soldPrice,
                    originalPrice,
                    url: listingUrl,
                    scrapedAt: new Date().toISOString()
                };

                await Actor.pushData(output);
                
                totalListingsExtracted++;
                listingsOnPage++;
                
                // PPE Monetization
                await Actor.charge({ eventName: 'listing-extracted', count: 1 });
            }

            log.info(`✅ Extracted ${listingsOnPage} listings from this page. Total so far: ${totalListingsExtracted}`);
            
            // Pagination handling for infinite scroll or "Next" button
            if (totalListingsExtracted < maxListings) {
                // Poshmark pagination is often handled via query parameters like ?max_id=123
                // This is a simplified next button extraction
                const nextBtn = $('a.next, a.btn--pagination, a[rel="next"]').attr('href');
                if (nextBtn) {
                    let nextUrl = nextBtn.startsWith('http') ? nextBtn : new URL(nextBtn, 'https://poshmark.com').href;
                    log.info(`Enqueueing next page: ${nextUrl}`);
                    await crawler.addRequests([nextUrl]);
                }
            }
        },
        
        async failedRequestHandler({ request, log }) {
            log.error(`Failed to scrape ${request.url} after multiple retries.`);
        },
    });

    log.info(`Starting Poshmark crawler for ${searchUrls.length} start URLs...`);
    
    await crawler.addRequests(searchUrls);
    armKillSwitch(crawler);
    await crawler.run();
    disarmKillSwitch();

    log.info(`🎉 Finished! Extracted ${totalListingsExtracted} listings.`);
} catch (error) {
    log.error('Actor failed:', error);
    throw error;
}

await Actor.exit();
