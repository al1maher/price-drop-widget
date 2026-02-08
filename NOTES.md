# Developer Notes

## Amazon & eBay Integration

### Selectors
- **Amazon**: DOM structure varies significantly by category (books vs electronics). 
  - Title: `#productTitle` is fairly stable.
  - Price: `.a-price .a-offscreen` is the modern standard, but older layouts use `#priceblock_ourprice`.
  - Container Injection: `#ppd` (Product Page Details) is a good high-level container.

- **eBay**:
  - Title: `.x-item-title__mainTitle` (new UI) vs `#itemTitle` (legacy).
  - Price: `.x-price-primary` vs `#prcIsum`.
  - Container Injection: `.x-buyway` (Buy It Now area) is the best target.

### Content Security Policy (CSP)
- **Problem**: Modern e-commerce sites often block external scripts (`script-src`) and XHR (`connect-src`).
- **Solution**: The Userscript attempts to inject a `<script src="...">`.
  - If it fails (onerror) or timeouts, it injects an `<iframe>`.
  - The `iframe` is served from our origin (`localhost:3000`) so it can freely talk to our API.

## Widget Design
- **Shadow DOM**: Used to isolate styles (simulated via scoped CSS selectors in this minimal implementation to safe bytes, but standard Web Components `attachShadow` is used in the code).
- **Bundle Size**: `esbuild` minification keeps it very small. No heavy frameworks.

## Backend
- **Simulated Delays**: Added logic to sleep 0.8-2.8s.
- **Simulated Errors**: 5% chance of 500 error.

## CSS Collision Example

### Problem: Amazon's Reset Styles
Amazon applies aggressive reset styles that affected our widget during initial development:

```css
/* Amazon's global style (simplified) */
button { 
    background: none; 
    border: 0; 
    margin: 0; 
    padding: 0; 
    font-size: inherit;
}

input {
    border: 0;
    outline: none;
}
```

When we first tested without Shadow DOM, this stripped all styling from our submit button and input field, making them invisible or unstyled.

### Solution: Shadow DOM Encapsulation
We use Shadow DOM (`attachShadow({ mode: 'open' })`) which creates an isolated style scope:

```javascript
// widget.ts
constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
}
```

**Benefits:****Responses**:
- `200 { ok: true }` - Successfully subscribed
- `400 { ok: false, error: "invalid_email" }` - Invalid email format
- `409 { ok: false, error: "already_subscribed" }` - Already tracking this product
- `500 { ok: false, error: "server_error" }` - Server error (simulated 5% of requests)

**Latency**: All responses include a simulated delay of 0.8-2.8 seconds to mimic real-world conditions.
1. Styles from the host page (Amazon/eBay) cannot leak into our widget
2. Our widget styles cannot accidentally affect the host page
3. The `:host` selector allows us to style the component wrapper itself
4. No need for aggressive `!important` declarations or deeply nested selectors

### Additional Collision: eBay's Flex Layout
eBay's price display uses nested flex containers (`.x-bin-price__content { display: flex }`). Initially, injecting our widget *inside* this container caused it to become a flex child, squishing it horizontally. 

**Fix:** We detect `x-bin-price` and inject our widget *after* it, ensuring it appears as a new block element below the price row rather than inside the flex layout.
