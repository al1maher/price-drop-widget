import { styles } from "./styles";

export interface WidgetConfig {
  email?: string;
  product?: {
    name: string;
    price: string;
    url: string;
  };
  apiEndpoint?: string;
  containerId?: string;
  accentColor?: string;
  textColor?: string;
}

export class PriceDropWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private config: WidgetConfig = {};
  private form?: HTMLFormElement;
  private input?: HTMLInputElement;
  private btn?: HTMLButtonElement;
  private msg?: HTMLDivElement;
  private _submitting: boolean = false;
  private _rendered: boolean = false; // Add this flag

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  // Allow initialization via JS logic too
  public init(config: WidgetConfig) {
    this.config = { ...this.config, ...config };
    this.render(); // Re-render with new data
  }

  private render() {
    // Preserve existing product data - don't re-extract if we already have it
    if (!this.config.product) {
      this.config.product = this.extractPageData();
    }
    // If we have product data but price is Unknown, try one more extraction
    else if (this.config.product.price === "Unknown" && !this._rendered) {
      console.log("Price was Unknown, re-extracting...");
      this.config.product = this.extractPageData();
    }

    // Default API endpoint if not set
    const apiBase = this.config.apiEndpoint || "http://localhost:3000";

    // Dynamic styles for accent color
    let customStyle = '';
    if (this.config.accentColor) {
      customStyle += `:host { --pd-accent: ${this.config.accentColor}; }`;
    }
    if (this.config.textColor) {
      customStyle += `:host { --pd-btn-text: ${this.config.textColor}; }`;
    }

    this.shadow.innerHTML = `
    <style>${styles} ${customStyle}</style>
    <div class="pd-container">
      <h3 class="pd-title">🔔 Email me if this product gets cheaper</h3>
      <form class="pd-form">
        <input type="email" class="pd-input" placeholder="Enter your email" required value="${this.config.email || ""}">
        <button type="submit" class="pd-btn">Track Price</button>
      </form>
      <div class="pd-message"></div>
    </div>
  `;

    this.form = this.shadow.querySelector("form")!;
    this.input = this.shadow.querySelector("input")!;
    this.btn = this.shadow.querySelector("button")!;
    this.msg = this.shadow.querySelector(".pd-message")!;

    this.form.addEventListener("submit", (e) => this.handleSubmit(e, apiBase));

    this._rendered = true; // Mark as rendered

    // Debug log to verify product data persists
    console.log("Current config.product after render:", this.config.product);
  }

  private extractPageData() {
    const url = window.location.href;
    let price = "Unknown";
    let name = "";

    // Amazon price extraction
    if (url.includes("amazon.")) {
      // Try multiple Amazon price selectors
      const priceSelectors = [
        '.a-price[data-a-color="price"] .a-offscreen',
        '.a-price[data-a-color="base"] .a-offscreen',
        "#corePrice_feature_div .a-offscreen",
        ".apexPriceToPay .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        ".a-price-whole",
      ];

      for (const selector of priceSelectors) {
        const priceEl = document.querySelector(selector);
        if (priceEl?.textContent?.trim()) {
          let extractedPrice = priceEl.textContent.trim();

          // Clean up the price - remove extra whitespace and newlines
          extractedPrice = extractedPrice.replace(/\s+/g, "");

          // Validate it looks like a price (has currency symbol or number)
          if (
            /[\$£€¥]?\d+[.,]\d{2}/.test(extractedPrice) ||
            /\d+/.test(extractedPrice)
          ) {
            price = extractedPrice;
            console.log(`Found price with selector: ${selector}`, price);
            break;
          }
        }
      }

      // If still getting partial prices like "681.", try combining whole + fraction
      if (price === "Unknown" || /^\d+\.$/.test(price)) {
        const wholeEl = document.querySelector(".a-price-whole");
        const fractionEl = document.querySelector(".a-price-fraction");
        const symbolEl = document.querySelector(".a-price-symbol");

        if (wholeEl && fractionEl) {
          const symbol = symbolEl?.textContent?.trim() || "$";
          const whole = wholeEl.textContent?.replace(".", "") || "";
          const fraction = fractionEl.textContent || "00";
          price = `${symbol}${whole}.${fraction}`;
          console.log("Constructed price from parts:", price);
        }
      }

      // Amazon product name
      name =
        document.querySelector("#productTitle")?.textContent?.trim() ||
        document.title;
    }
    // eBay price extraction
    else if (url.includes("ebay.")) {
      const priceSelectors = [
        ".x-price-primary .ux-textspans",
        ".x-bin-price__content .ux-textspans",
        // Fallback to container text if spans missing
        ".x-price-primary",
        ".x-bin-price__content",
        '[itemprop="price"]',
        ".display-price",
      ];

      for (const selector of priceSelectors) {
        const priceEl = document.querySelector(selector);
        if (priceEl?.textContent?.trim()) {
          price = priceEl.textContent.trim();
          break;
        }
      }

      name =
        document
          .querySelector(".x-item-title__mainTitle")
          ?.textContent?.trim() || document.title;
    }

    const extracted = {
      name: name || document.title,
      price: price,
      url: window.location.href,
    };

    console.log("Price Drop Widget - Extracted:", extracted);

    return extracted;
  }

  private async handleSubmit(e: Event, apiBase: string) {
    e.preventDefault();
    if (this._submitting) return;

    const email = this.input!.value;
    if (!email) return;

    // Add defensive check
    if (!this.config.product) {
      console.error("No product data available!");
      this.setMessage("error", "Could not extract product information.");
      return;
    }

    this.setLoading(true);

    try {
      const productData = this.config.product;

      const payload = {
        email,
        product: {
          title: productData.name,
          name: productData.name,
          price: productData.price,
          url: productData.url,
        },
      };

      console.log("Sending payload:", payload);
      console.log("Product data from config:", productData);

      // Create abort controller with 10s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(`${apiBase}/subscribe-price-drop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await res.json();
        console.log("Server response:", data);

        if (res.ok) {
          this.setMessage("success", "You are now subscribed!");
          this.form!.classList.add("pd-hidden");
          localStorage.setItem(`pd_sub_${productData.url}`, "true");
        } else {
          if (data.error === "already_subscribed") {
            this.setMessage("error", "You are already tracking this item.");
          } else {
            this.setMessage("error", "Error: " + (data.error || "Unknown error"));
          }
        }
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
          this.setMessage("error", "Request timed out. Please try again.");
        } else {
          throw fetchErr;
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      this.setMessage("error", "Network error. Please try again.");
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean) {
    this._submitting = loading;
    if (loading) {
      this.btn!.disabled = true;
      this.btn!.innerHTML = '<span class="pd-spinner"></span> Saving...';
      this.msg!.className = "pd-message"; // clear
      this.input!.disabled = true;
    } else {
      this.btn!.disabled = false;
      this.btn!.textContent = "Track Price";
      this.input!.disabled = false;
    }
  }

  private setMessage(type: "success" | "error", text: string) {
    this.msg!.textContent = text;
    this.msg!.className = `pd-message ${type}`;

    // Trigger shake animation on error
    if (type === "error" && this.form) {
      this.form.classList.remove("pd-shake");
      // Force reflow to restart animation
      void this.form.offsetWidth;
      this.form.classList.add("pd-shake");
    }
  }
}

// Check if class is already defined to avoid errors on reload
if (!customElements.get("price-drop-widget")) {
  customElements.define("price-drop-widget", PriceDropWidget);
}
