const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes latest updates from NTA JEE Main website
 * @returns {Promise<Array>} Array of update objects
 */
async function scrapeNTAUpdates() {
    try {
        // Target the JEE Main public notices page specifically
        const url = 'https://jeemain.nta.nic.in/public-notices/';
        
        console.log(`🔍 Fetching ${url}...`);
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            }
        });
        
        const $ = cheerio.load(response.data);
        console.log(`📄 Parsing content from ${url}...`);
        
        const allUpdates = [];
        const seenTitles = new Set(); // Track titles to avoid duplicates immediately
        
        // ONLY Pattern 1: JEE Main specific - ul > li with download links
        // This is the main public notices list
        $('ul li').each((index, element) => {
            const $li = $(element);
            const $link = $li.find('a[download]').first();
            
            if ($link.length > 0) {
                const title = $li.text().trim();
                const href = $link.attr('href');
                
                // Create a normalized title for comparison
                const normalizedTitle = cleanTitle(title).toLowerCase().substring(0, 80);
                
                // Only add if:
                // 1. Title is valid length
                // 2. Not already seen
                // 3. Is relevant to NTA exams
                if (title && 
                    title.length > 20 && 
                    title.length < 500 && 
                    !seenTitles.has(normalizedTitle) &&
                    isRelevantUpdate(title)) {
                    
                    seenTitles.add(normalizedTitle);
                    
                    allUpdates.push({
                        id: `jee-${Date.now()}-${index}`,
                        title: cleanTitle(title),
                        date: extractDateFromText(title) || 'Recent',
                        link: normalizeLink(href, url),
                        description: cleanTitle(title),
                        source: 'JEE Main',
                        scrapedAt: new Date().toISOString(),
                        order: index
                    });
                }
            }
        });
        
        console.log(`📊 Total unique updates found: ${allUpdates.length}`);
        
        // Sort by order (0 = newest, higher number = older)
        const sortedUpdates = allUpdates
            .sort((a, b) => a.order - b.order)
            .slice(0, 20) // Limit to top 20
            .map(update => {
                // Remove the order field before returning
                const { order, ...rest } = update;
                return rest;
            });
        
        // If no updates found, return mock data
        if (sortedUpdates.length === 0) {
            console.log('⚠️  No relevant updates found, using mock data');
            return getMockUpdates();
        }
        
        console.log(`✅ Returning ${sortedUpdates.length} final updates (newest first)`);
        return sortedUpdates;
        
    } catch (error) {
        console.error('❌ Scraping error:', error.message);
        console.log('📋 Returning mock data due to error');
        return getMockUpdates();
    }
}

/**
 * Helper function to get domain name
 */
function getDomainName(url) {
    if (url.includes('jeemain')) return 'JEE Main';
    if (url.includes('neet')) return 'NEET';
    if (url.includes('cuet')) return 'CUET';
    return 'NTA';
}

/**
 * Helper function to clean titles - more aggressive cleaning
 */
function cleanTitle(title) {
    return title
        .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
        .replace(/[\r\n\t]/g, ' ')      // Remove newlines and tabs
        .replace(/NEW/gi, '')            // Remove "NEW" text
        .replace(/LATEST/gi, '')         // Remove "LATEST" text
        .replace(/\*/g, '')              // Remove asterisks
        .replace(/\s+/g, ' ')           // Clean up spaces again
        .replace(/^\s*-\s*/, '')        // Remove leading dash
        .replace(/\s*-\s*$/, '')        // Remove trailing dash
        .trim()
        .substring(0, 250);
}

/**
 * Helper function to normalize links
 */
function normalizeLink(link, baseUrl) {
    if (!link) return baseUrl;
    if (link.startsWith('http')) return link;
    if (link.startsWith('//')) return 'https:' + link;
    
    // Get base domain
    const urlObj = new URL(baseUrl);
    const baseDomain = `${urlObj.protocol}//${urlObj.hostname}`;
    
    if (link.startsWith('/')) return baseDomain + link;
    return baseDomain + '/' + link;
}

/**
 * Helper function to check if update is relevant - stricter filtering
 */
function isRelevantUpdate(text) {
    const keywords = [
        'jee', 'joint entrance',
        'exam', 'examination', 'test',
        'result', 'score',
        'admit', 'hall ticket',
        'registration', 'application', 'apply',
        'notification', 'notice',
        'answer key',
        'counselling', 'admission',
        'session', '2024', '2025', '2026',
        'important',
        'schedule', 'date',
        'extended', 'postponed',
        'bulletin', 'information',
        'clarification', 'advisory',
        'calculator', 'virtual',
        'aadhaar', 'udid',
        'category certificate',
        'aspirants', 'candidates'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Must contain at least one keyword
    const hasKeyword = keywords.some(keyword => lowerText.includes(keyword));
    
    // Filter out common non-relevant patterns
    const isNotRelevant = 
        lowerText.includes('click here') ||
        lowerText.includes('read more') ||
        lowerText.includes('view all') ||
        lowerText.includes('copyright') ||
        lowerText.includes('privacy policy') ||
        lowerText.includes('terms and conditions') ||
        lowerText.includes('contact us') ||
        lowerText.length < 25;
    
    return hasKeyword && !isNotRelevant;
}

/**
 * Improved date extraction - returns valid date string or "Recent"
 */
function extractDateFromText(text) {
    // Try various date formats
    const patterns = [
        // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        {
            regex: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
            format: (match) => {
                const [, day, month, year] = match;
                return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
        },
        // DD Month YYYY (e.g., "16 November 2024")
        {
            regex: /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i,
            format: (match) => {
                const [, day, month, year] = match;
                const monthMap = {
                    'jan': '01', 'january': '01',
                    'feb': '02', 'february': '02',
                    'mar': '03', 'march': '03',
                    'apr': '04', 'april': '04',
                    'may': '05',
                    'jun': '06', 'june': '06',
                    'jul': '07', 'july': '07',
                    'aug': '08', 'august': '08',
                    'sep': '09', 'september': '09',
                    'oct': '10', 'october': '10',
                    'nov': '11', 'november': '11',
                    'dec': '12', 'december': '12'
                };
                const monthNum = monthMap[month.toLowerCase()];
                return `${day.padStart(2, '0')}/${monthNum}/${year}`;
            }
        },
        // YYYY/MM/DD or YYYY-MM-DD
        {
            regex: /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
            format: (match) => {
                const [, year, month, day] = match;
                return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
        },
        // Month DD, YYYY (e.g., "November 16, 2024")
        {
            regex: /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i,
            format: (match) => {
                const [, month, day, year] = match;
                const monthMap = {
                    'jan': '01', 'january': '01',
                    'feb': '02', 'february': '02',
                    'mar': '03', 'march': '03',
                    'apr': '04', 'april': '04',
                    'may': '05',
                    'jun': '06', 'june': '06',
                    'jul': '07', 'july': '07',
                    'aug': '08', 'august': '08',
                    'sep': '09', 'september': '09',
                    'oct': '10', 'october': '10',
                    'nov': '11', 'november': '11',
                    'dec': '12', 'december': '12'
                };
                const monthNum = monthMap[month.toLowerCase()];
                return `${day.padStart(2, '0')}/${monthNum}/${year}`;
            }
        }
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (match) {
            try {
                return pattern.format(match);
            } catch (error) {
                console.error('Date formatting error:', error);
            }
        }
    }
    
    return 'Recent'; // Return "Recent" instead of null
}

/**
 * Returns mock updates for testing/development
 */
function getMockUpdates() {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
    
    return [
        {
            id: 'mock-1',
            title: 'Clarification on Use of Virtual Calculator in JEE (Main) 2026- Reg.',
            date: today.toLocaleDateString('en-IN'),
            link: 'https://jeemain.nta.nic.in/public-notices/',
            description: 'Clarification on Use of Virtual Calculator in JEE (Main) 2026- Reg.',
            source: 'JEE Main',
            scrapedAt: today.toISOString()
        },
        {
            id: 'mock-2',
            title: 'Inviting Online Application Form for Joint Entrance Examination (Main) – 2026 Session 1- Reg.',
            date: today.toLocaleDateString('en-IN'),
            link: 'https://jeemain.nta.nic.in/public-notices/',
            description: 'Inviting Online Application Form for Joint Entrance Examination (Main) – 2026 Session 1- Reg.',
            source: 'JEE Main',
            scrapedAt: today.toISOString()
        },
        {
            id: 'mock-3',
            title: 'Advisory for JEE(Main) – 2026 Aspirants',
            date: yesterday.toLocaleDateString('en-IN'),
            link: 'https://jeemain.nta.nic.in/public-notices/',
            description: 'Advisory for JEE(Main) – 2026 Aspirants',
            source: 'JEE Main',
            scrapedAt: yesterday.toISOString()
        },
        {
            id: 'mock-4',
            title: 'Advisory and Instructions on Updation of Aadhaar Card/ UDID Card/ Category Certificate (EWS/SC/ST/OBC-NCL)',
            date: twoDaysAgo.toLocaleDateString('en-IN'),
            link: 'https://jeemain.nta.nic.in/public-notices/',
            description: 'Advisory and Instructions on Updation of Aadhaar Card/ UDID Card/ Category Certificate before Filling of Online Application Form',
            source: 'JEE Main',
            scrapedAt: twoDaysAgo.toISOString()
        }
    ];
}

module.exports = { scrapeNTAUpdates };