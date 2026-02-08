const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(compression()); // Enable gzip/deflate compression
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simulate database
const subscriptions = new Map(); // url -> Set(emails)

// Helper for random delay
const randomDelay = () => {
  const ms = Math.floor(Math.random() * (2800 - 800 + 1) + 800);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Serving static files

// Widget assets with caching headers
app.use('/assets', express.static(path.join(__dirname, '../widget/dist'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Embed page
app.use('/embed', express.static(path.join(__dirname, '../embed')));

// Demo page with strict CSP headers
app.use('/demo', (req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none';"
  );
  next();
}, express.static(path.join(__dirname, '../demo')));


// API Endpoint
app.post('/subscribe-price-drop', async (req, res) => {
  const start = Date.now();

  try {
    await randomDelay();

    const { email, product } = req.body;

    // Basic validation
    if (!email || !email.includes('@')) {
      const latency = Date.now() - start;
      console.log(`[POST] /subscribe-price-drop 400 ${latency}ms - Invalid email`);
      return res.status(400).json({ ok: false, error: 'invalid_email' });
    }

    if (!product || !product.url) {
      const latency = Date.now() - start;
      console.log(`[POST] /subscribe-price-drop 400 ${latency}ms - Invalid product data`);
      return res.status(400).json({ ok: false, error: 'invalid_product_data' });
    }

    // Simulate 5xx error occasionally (e.g., 5% chance)
    if (Math.random() < 0.05) {
      const latency = Date.now() - start;
      console.log(`[POST] /subscribe-price-drop 500 ${latency}ms - Simulated server error`);
      return res.status(500).json({ ok: false, error: 'server_error' });
    }

    // Check if already subscribed
    const productUrl = product.url;
    if (!subscriptions.has(productUrl)) {
      subscriptions.set(productUrl, new Set());
    }

    const productSubs = subscriptions.get(productUrl);
    if (productSubs.has(email)) {
      const latency = Date.now() - start;
      console.log(`[POST] /subscribe-price-drop 409 ${latency}ms - Already subscribed`);
      return res.status(409).json({ ok: false, error: 'already_subscribed' });
    }

    // Success
    productSubs.add(email);
    const latency = Date.now() - start;
    console.log(`[POST] /subscribe-price-drop 200 ${latency}ms - Subscribed ${email} to ${product.name} with price ${product.price} `);

    return res.json({ ok: true });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
