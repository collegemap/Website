const Parser = require('rss-parser');
const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
});

/**
 * Try to parse RSS feeds from NTA
 */
async function parseNTARSS() {
    const rssSources = [
        'https://nta.ac.in/rss',
        'https://nta.ac.in/feed',
        'https://jeemain.nta.ac.in/rss',
        'https://neet.nta.ac.in/rss'
    ];
    
    const updates = [];
    
    for (const rssUrl of rssSources) {
        try {
            console.log(`📡 Trying RSS feed: ${rssUrl}`);
            const feed = await parser.parseURL(rssUrl);
            
            feed.items.forEach((item, index) => {
                updates.push({
                    id: `rss-${Date.now()}-${index}`,
                    title: item.title,
                    link: item.link,
                    date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
                    description: item.contentSnippet || item.content || item.title,
                    source: 'NTA RSS',
                    scrapedAt: new Date().toISOString()
                });
            });
            
            console.log(`✅ Found ${feed.items.length} items from ${rssUrl}`);
        } catch (error) {
            console.log(`❌ RSS feed ${rssUrl} failed: ${error.message}`);
        }
    }
    
    return updates.slice(0, 20);
}

module.exports = { parseNTARSS };