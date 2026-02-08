// ==UserScript==
// @name         Price Drop Notifier
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Injects a price drop alert widget on Amazon and eBay (Product Pages Only)
// @match        *://www.amazon.com/*
// @match        *://www.amazon.co.uk/*
// @match        *://www.amazon.eg/*
// @match        *://www.ebay.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        serverBase: 'http://localhost:3000',
        widgetScript: '/assets/price-drop-widget.min.js',
        iframePath: '/embed/price-drop.html'
    };

    const COLORS = {
        amazon: { accent: '#ffd814', text: '#111111' },
        ebay: { accent: '#0968f6', text: '#ffffff' }
    };

    // Site Definitions
    const SITES = {
        amazon: {
            check: () => location.hostname.includes('amazon'),
            // Strict check: Must have product title AND a valid container area
            isProductPage: () => !!document.querySelector('#productTitle') && !!(document.querySelector('#ppd') || document.querySelector('#centerCol')),
            getPlacement: () => {
                const el = document.querySelector('#ppd') || document.querySelector('#centerCol');
                return el ? { target: el, method: 'prepend' } : null;
            },
            getData: () => ({
                title: document.querySelector('#productTitle')?.innerText.trim(),
                price: document.querySelector('.a-price .a-offscreen')?.innerText.trim()
                    || document.querySelector('#priceblock_ourprice')?.innerText.trim()
                    || document.querySelector('#priceblock_dealprice')?.innerText.trim()
            })
        },
        ebay: {
            check: () => location.hostname.includes('ebay'),
            // Strict check: Title must exist
            isProductPage: () => !!document.querySelector('.x-item-title__mainTitle') || !!document.querySelector('#itemTitle'),
            getPlacement: () => {
                // 1. Try specific high-level buy box container
                const buyWay = document.querySelector('.x-buyway');
                if (buyWay) return { target: buyWay, method: 'prepend' };

                // 2. Try inserting AFTER the binary price container (safer than inside)
                // This wraps the price and prevents injecting INSIDE a flex row
                const binPrice = document.querySelector('.x-bin-price');
                if (binPrice) return { target: binPrice, method: 'after' };

                // 3. Try inserting AFTER the price element itself (fallback)
                const priceEl = document.querySelector('.x-price-primary')
                    || document.querySelector('.x-bin-price__content')
                    || document.querySelector('[itemprop="price"]');

                if (priceEl) return { target: priceEl, method: 'after' };

                // 4. Fallback
                const fallback = document.querySelector('#leftOverlayPanel') || document.querySelector('#mainContent');
                return fallback ? { target: fallback, method: 'prepend' } : null;
            },
            getData: () => {
                // Try getting text from specific price structure first
                let price = document.querySelector('.x-price-primary .ux-textspans')?.innerText.trim()
                    || document.querySelector('.x-bin-price__content .ux-textspans')?.innerText.trim();

                // Fallback to simpler selectors if nested structure not found
                if (!price) {
                    price = document.querySelector('.x-price-primary')?.innerText.trim()
                        || document.querySelector('.x-bin-price__content')?.innerText.trim()
                        || document.querySelector('[itemprop="price"]')?.innerText.trim()
                        || document.querySelector('#prcIsum')?.innerText.trim();
                }

                return {
                    title: document.querySelector('.x-item-title__mainTitle')?.innerText.trim() || document.querySelector('#itemTitle')?.innerText.replace(/Details about/i, '').trim(),
                    price: price
                };
            }
        }
    };

    function getSite() {
        if (SITES.amazon.check()) return { ...SITES.amazon, name: 'amazon' };
        if (SITES.ebay.check()) return { ...SITES.ebay, name: 'ebay' };
        return null;
    }

    function inject() {
        // 1. Check if widget container already exists
        if (document.getElementById('pd-widget-container')) return;

        const site = getSite();
        if (!site) return;

        // STRICT CHECK: Only proceed if this IS a product page
        if (!site.isProductPage()) {
            return;
        }

        // Check if already subscribed for this product
        const productUrl = location.href;
        if (localStorage.getItem(`pd_sub_${productUrl}`)) {
            // Show "already tracking" message instead of form
            const trackingMsg = document.createElement('div');
            trackingMsg.id = 'pd-widget-container';
            trackingMsg.style.cssText = 'padding:12px 16px; background:#f0fff0; border:1px solid #28a745; border-radius:4px; margin:15px 0; font-family:inherit; font-size:14px; color:#155724;';
            trackingMsg.innerHTML = '✅ You\'re already tracking this product for price drops!';

            const placement = site.getPlacement();
            if (placement && placement.target) {
                if (placement.method === 'prepend') {
                    placement.target.insertBefore(trackingMsg, placement.target.firstChild);
                } else if (placement.method === 'after') {
                    placement.target.parentNode.insertBefore(trackingMsg, placement.target.nextSibling);
                } else {
                    placement.target.appendChild(trackingMsg);
                }
            }
            return;
        }

        const placement = site.getPlacement();
        if (!placement || !placement.target) return;

        const { target, method } = placement;

        // 2. Inject Container with Skeleton
        const container = document.createElement('div');
        container.id = 'pd-widget-container';
        container.style.marginTop = '15px';
        container.style.marginBottom = '20px';
        container.style.display = 'block';
        container.style.clear = 'both';
        container.style.minHeight = '160px';
        container.style.width = '100%';
        container.style.maxWidth = '100%';
        container.style.boxSizing = 'border-box';
        // Ensure it sits above if there are stacking context issues (rare but possible w/ overlays)
        container.style.position = 'relative';
        container.style.zIndex = '100';

        const skeletonStyle = `
            @keyframes pd-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            .pd-skeleton-box {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: pd-shimmer 1.5s infinite;
                border-radius: 4px;
            }
            .pd-skeleton-container {
                border: 1px solid #e0e0e0; padding: 16px; border-radius: 4px;
                display: flex; flex-direction: column; gap: 12px; background: white;
            }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = skeletonStyle;
        container.appendChild(styleEl);
        container.innerHTML += `
            <div class="pd-skeleton-container">
                <div class="pd-skeleton-box" style="width: 70%; height: 20px;"></div>
                <div style="display: flex; gap: 8px;">
                    <div class="pd-skeleton-box" style="flex: 1; height: 36px;"></div>
                    <div class="pd-skeleton-box" style="width: 100px; height: 36px;"></div>
                </div>
            </div>
        `;

        if (method === 'prepend') {
            if (target.firstChild) target.insertBefore(container, target.firstChild);
            else target.appendChild(container);
        } else if (method === 'after') {
            target.parentNode.insertBefore(container, target.nextSibling);
        } else {
            // Default append
            target.appendChild(container);
        }

        // 3. Initialize Widget (Load script if needed, or just init if ready)
        if (window.PriceDropWidget && window.PriceDropWidget.init) {
            // Script already loaded, just re-init
            // Small timeout to ensure DOM is settled
            setTimeout(() => {
                const data = site.getData();
                const theme = COLORS[site.name];
                window.PriceDropWidget.init({
                    containerId: 'pd-widget-container',
                    email: '',
                    apiEndpoint: CONFIG.serverBase,
                    accentColor: theme.accent,
                    textColor: theme.text,
                    product: {
                        name: data.title || document.title,
                        price: data.price || 'Unknown',
                        url: location.href
                    }
                });
            }, 50);
        } else {
            // Script not loaded yet -- prevent double loading
            if (!document.getElementById('pd-widget-script')) {
                const script = document.createElement('script');
                script.id = 'pd-widget-script';
                script.src = `${CONFIG.serverBase}${CONFIG.widgetScript}`;

                // Fallback function for iframe mode
                const fallbackToIframe = () => {
                    console.log('PriceDrop: Falling back to iframe mode.');
                    const data = site.getData();
                    const iframeSrc = `${CONFIG.serverBase}${CONFIG.iframePath}?` +
                        `name=${encodeURIComponent(data.title || document.title)}` +
                        `&price=${encodeURIComponent(data.price || 'Unknown')}` +
                        `&url=${encodeURIComponent(location.href)}`;

                    container.innerHTML = '';
                    const iframe = document.createElement('iframe');
                    iframe.src = iframeSrc;
                    iframe.style.width = '100%';
                    iframe.style.height = '180px';
                    iframe.style.border = 'none';
                    iframe.style.borderRadius = '4px';
                    iframe.allow = 'forms';
                    container.appendChild(iframe);
                };

                // Timeout to fallback if script loads but init hangs
                let initSucceeded = false;
                const fallbackTimeout = setTimeout(() => {
                    if (!initSucceeded && container.querySelector('.pd-skeleton-container')) {
                        console.log('PriceDrop: Widget init timed out, falling back to iframe.');
                        fallbackToIframe();
                    }
                }, 5000);

                script.onload = () => {
                    console.log('PriceDrop: Script loaded, checking for PriceDropWidget...');
                    try {
                        if (window.PriceDropWidget && window.PriceDropWidget.init) {
                            const data = site.getData();
                            const theme = COLORS[site.name];
                            console.log('PriceDrop: Initializing widget with data:', data);
                            window.PriceDropWidget.init({
                                containerId: 'pd-widget-container',
                                email: '',
                                apiEndpoint: CONFIG.serverBase,
                                accentColor: theme.accent,
                                textColor: theme.text,
                                product: {
                                    name: data.title || document.title,
                                    price: data.price || 'Unknown',
                                    url: location.href
                                }
                            });
                            initSucceeded = true;
                            clearTimeout(fallbackTimeout);
                            console.log('PriceDrop: Widget initialized successfully.');
                        } else {
                            console.error('PriceDrop: PriceDropWidget not found on window after script load.');
                            clearTimeout(fallbackTimeout);
                            fallbackToIframe();
                        }
                    } catch (err) {
                        console.error('PriceDrop: Error during init:', err);
                        clearTimeout(fallbackTimeout);
                        fallbackToIframe();
                    }
                };
                script.onerror = (e) => {
                    console.log('PriceDrop: Script blocked by CSP or failed to load.', e);
                    clearTimeout(fallbackTimeout);
                    fallbackToIframe();
                };
                document.head.appendChild(script);
            }
        }
    }

    // Watch for DOM changes. If site hydration removes our widget, we put it back.
    const observer = new MutationObserver(() => inject());
    observer.observe(document, { childList: true, subtree: true });

    // Initial check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => inject());
    } else {
        inject();
    }

})();
