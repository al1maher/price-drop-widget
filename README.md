## Structure
- **server/**: Express API (`POST /subscribe-price-drop`) and static file server.
- **widget/**: TypeScript-based embeddable widget (builds to ESM + UMD).
- **userscript/**: Tampermonkey script for Amazon and eBay.
- **demo/**: Strict CSP demo page.
- **embed/**: Iframe fallback.

## Setup
1.  **Install dependencies**:
    ```bash
    cd server && npm install
    cd ../widget && npm install
    ```

2.  **Build the widget**:
    ```bash
    cd widget && npm run build
    ```

3.  **Start the server**:
    ```bash
    cd server && npm run serve
    ```
    Server runs on `http://localhost:3000`.


### Embeddable Widget
Include the script and initialize:
```html
<div id="container"></div>
<script src="http://localhost:3000/assets/price-drop-widget.min.js"></script>
<script>
  window.PriceDropWidget.init({
    containerId: 'container',
    product: { name: 'Item', price: '$10', url: window.location.href }
  });
</script>
```

### Userscript
1. Open Tampermonkey dashboard.
2. Create new script.
3. Paste content from `userscript/price-drop-injector.user.js`.
4. Refresh Amazon/eBay product page.


### Server Configuration
The server uses the `cors` middleware with default settings, which allows requests from any origin:
```javascript
app.use(cors());
```

**For production**, we should restrict this to specific origins:
```javascript
app.use(cors({
  origin: ['https://www.amazon.com', 'https://www.ebay.com'],
  methods: ['POST']
}));
```

### Iframe Fallback
If CSP blocks the widget script on the host page, we fall back to an iframe served from our origin. Since the iframe is same-origin with our API, it bypasses CORS entirely.

### Credentials
Currently, we don't send cookies/credentials. If needed in the future:
```javascript
app.use(cors({ credentials: true, origin: 'https://specific-origin.com' }));
```

## Bundle Size
price-drop-widget.min.js  7.4 KB , gzipped: ~3 KB

## API Reference

### POST /subscribe-price-drop

**Request Body (JSON)**:
```json
{
  "email": "user@example.com",
  "product": {
    "name": "Product Title",
    "price": "$129.99",
    "url": "https://www.example.com/product"
  }
}
```

**Responses**:
- `200 { ok: true }` - Successfully subscribed
- `400 { ok: false, error: "invalid_email" }` - Invalid email format
- `409 { ok: false, error: "already_subscribed" }` - Already tracking this product
- `500 { ok: false, error: "server_error" }` - Server error (simulated 5% of requests)

**Latency**: All responses include a simulated delay of 0.8-2.8 seconds to mimic real-world conditions.
