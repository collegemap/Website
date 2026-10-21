const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { scrapeNTAUpdates } = require('./scraper'); 
const { parseNTARSS } = require('./rssParser');
const { registerBranchIntelRoutes } = require('./branchIntel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Telegram notification config
async function sendTelegramNotification(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Bot token or chat ID not configured, skipping notification');
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Telegram] Failed to send notification:', err);
    }
  } catch (err) {
    console.error('[Telegram] Error sending notification:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: [
    'https://collegemapseminarpage.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://www.collegemap.in',
    'https://collegemap.in'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Profile']
}));

app.use(express.json({ limit: '10mb' }));

registerBranchIntelRoutes(app);

// Razorpay Payment Routes
app.post("/order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.amount || 50000, // Make sure amount is sufficient
      currency: req.body.currency || "INR",
      receipt: req.body.receipt || "receipt_order_74394",
    };
    
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ error: "Order creation failed" });
    }

    res.json(order);
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

app.post("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});

// Branch Comparison: validate payment AND save access with server-side expiry
app.post("/order/validate-bc", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
    return res.status(400).json({ msg: "Missing required fields." });
  }

  // Verify Razorpay signature
  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  // Save payment with server-computed expiry
  if (!supabase) {
    console.error("[BC] Supabase not configured");
    return res.status(500).json({ msg: "Database not configured." });
  }

  try {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6); // 6 months access

    const { error } = await supabase
      .from("branch_compare_payments")
      .insert({
        email: email.toLowerCase(),
        razorpay_payment_id,
        razorpay_order_id,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error("[BC] Supabase insert error:", error);
      return res.status(500).json({ msg: "Failed to save payment record." });
    }

    console.log(`[BC] ✅ Payment saved: ${email} — expires ${expiresAt.toISOString()}`);
    res.json({
      msg: "success",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[BC] Validate-bc error:", err);
    res.status(500).json({ msg: "Internal server error." });
  }
});

// ─── Talk to IITian — Form Submission Routes ───────────────────────────────────

// Submit the form after successful payment
app.post("/api/tti/submit-form", async (req, res) => {
  try {
    const { name, phone, college, branch, queries, razorpay_payment_id, razorpay_order_id } = req.body;

    // Validate required fields
    if (!name || !phone || !college || !branch || !razorpay_payment_id || !razorpay_order_id) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    if (!supabase) {
      console.error("[TTI] Supabase not configured");
      return res.status(500).json({ success: false, error: "Database not configured." });
    }

    // Check for duplicate payment ID
    const { data: existing } = await supabase
      .from("tti_form_submissions")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, error: "Form already submitted for this payment." });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("tti_form_submissions")
      .insert([{
        name,
        phone,
        college_of_interest: college,
        branch_of_interest: branch,
        specific_queries: queries || null,
        razorpay_payment_id,
        razorpay_order_id,
      }])
      .select();

    if (error) {
      console.error("[TTI] Supabase insert error:", error);
      return res.status(500).json({ success: false, error: "Failed to save form data." });
    }

    console.log(`[TTI] ✅ Form submitted: ${name} — ${college} / ${branch} (payment: ${razorpay_payment_id})`);

    // Send Telegram notification (fire-and-forget — don't block the response)
    const tgMessage = `🎓 <b>New Talk to IITian Booking!</b>

👤 <b>Name:</b> ${name}
📞 <b>Phone:</b> ${phone}
🏫 <b>College:</b> ${college}
📚 <b>Branch:</b> ${branch}
${queries ? `❓ <b>Queries:</b> ${queries}` : ''}

💳 <b>Payment ID:</b> <code>${razorpay_payment_id}</code>
📋 <b>Order ID:</b> <code>${razorpay_order_id}</code>
⏰ <b>Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
    await sendTelegramNotification(tgMessage);

    res.json({ success: true, id: data?.[0]?.id });
  } catch (err) {
    console.error("[TTI] Submit form error:", err);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// Check if a payment ID already has a form submission (recovery flow)
app.get("/api/tti/check-payment/:paymentId", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, error: "Database not configured." });
    }

    const { data } = await supabase
      .from("tti_form_submissions")
      .select("id")
      .eq("razorpay_payment_id", req.params.paymentId)
      .maybeSingle();

    res.json({ success: true, formSubmitted: !!data });
  } catch (err) {
    console.error("[TTI] Check payment error:", err);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// NTA Updates Cache
let cachedNTAUpdates = [];
let lastNTAFetch = null;
const NTA_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Categorize NTA updates
const categorizeUpdate = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('result') || titleLower.includes('score')) return 'Result Updates';
    if (titleLower.includes('admit') || titleLower.includes('hall ticket')) return 'Admit Card';
    if (titleLower.includes('exam') || titleLower.includes('test')) return 'Exam Notifications';
    if (titleLower.includes('date') || titleLower.includes('schedule')) return 'Important Dates';
    return 'General';
};

// Add async function to fetch NTA updates with fallback
async function fetchNTAUpdatesWithFallback() {
    try {
        // Try RSS first
        console.log('📡 Trying RSS feeds first...');
        const rssUpdates = await parseNTARSS();
        
        if (rssUpdates.length > 0) {
            console.log(`✅ Got ${rssUpdates.length} updates from RSS`);
            return rssUpdates;
        }
        
        // Fallback to web scraping
        console.log('🔍 RSS failed, trying web scraping...');
        const scrapedUpdates = await scrapeNTAUpdates();
        return scrapedUpdates;
        
    } catch (error) {
        console.error('❌ All methods failed:', error.message);
        // Return mock data as last resort
        return scrapeNTAUpdates(); // This will return mock data internally
    }
}

// NTA Updates API Endpoint
app.get('/api/nta-updates', async (req, res) => {
    try {
        const now = Date.now();
        
        if (cachedNTAUpdates.length && lastNTAFetch && (now - lastNTAFetch) < NTA_CACHE_DURATION) {
            return res.json({ 
                success: true, 
                updates: cachedNTAUpdates,
                cached: true,
                lastUpdated: new Date(lastNTAFetch).toISOString()
            });
        }
        
        console.log('📰 Fetching fresh NTA updates...');
        const rawUpdates = await fetchNTAUpdatesWithFallback();
        
        const processedUpdates = rawUpdates.map((update) => ({
            ...update,
            category: categorizeUpdate(update.title),
            isNew: (Date.now() - new Date(update.scrapedAt).getTime()) < 24 * 60 * 60 * 1000
        }));
        
        cachedNTAUpdates = processedUpdates;
        lastNTAFetch = now;
        
        res.json({ 
            success: true, 
            updates: processedUpdates,
            cached: false,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error fetching NTA updates:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch updates',
            updates: cachedNTAUpdates
        });
    }
});

// Schedule automatic NTA updates every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] 🔄 Running scheduled NTA update fetch...');
    try {
        const rawUpdates = await scrapeNTAUpdates();
        const processedUpdates = rawUpdates.map((update) => ({
            ...update,
            category: categorizeUpdate(update.title),
            isNew: (Date.now() - new Date(update.scrapedAt).getTime()) < 24 * 60 * 60 * 1000
        }));
        
        cachedNTAUpdates = processedUpdates;
        lastNTAFetch = Date.now();
        console.log(`[CRON] ✅ Successfully fetched ${processedUpdates.length} NTA updates`);
    } catch (error) {
        console.error('[CRON] ❌ Error during scheduled NTA fetch:', error);
    }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'CollegeMap Backend API',
    version: '4.0.0',
    status: 'running',
    endpoints: [
      'GET /api/health',
      'GET /api/nta-updates',
      'GET /api/branch-intel/health',
      'GET /api/branch-intel/catalog',
      'GET /api/branch-intel/colleges',
      'GET /api/branch-intel/branches',
      'POST /api/branch-intel/compare'
    ]
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  res.status(200).json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler - MUST BE LAST
app.use((req, res) => {
  console.log('404 - Endpoint not found:', req.method, req.path);
  res.status(404).json({
    message: 'Endpoint not found',
    requestedPath: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health', 
      'GET /api/nta-updates',
      'GET /api/branch-intel/health',
      'GET /api/branch-intel/catalog',
      'GET /api/branch-intel/colleges',
      'GET /api/branch-intel/branches',
      'POST /api/branch-intel/compare'
    ]
  });
});

// Export for Vercel
module.exports = app;

if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Initialize on startup
(async function() {
    try {
        // Fetch initial NTA updates
        console.log('📰 Fetching initial NTA updates...');
        const rawUpdates = await fetchNTAUpdatesWithFallback();
        cachedNTAUpdates = rawUpdates.map(update => ({
            ...update,
            category: categorizeUpdate(update.title),
            isNew: true
        }));
        lastNTAFetch = Date.now();
        console.log(`✅ Loaded ${cachedNTAUpdates.length} NTA updates`);
    } catch (error) {
        console.error('Initialization error:', error);
    }
})();
