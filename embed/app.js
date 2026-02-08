// Parse query params and initialize widget
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name') || 'Unknown Product';
    const price = params.get('price') || 'Unknown Price';
    const url = params.get('url') || document.referrer;

    // Initialize widget
    if (window.PriceDropWidget && window.PriceDropWidget.init) {
        window.PriceDropWidget.init({
            containerId: 'widget-root',
            product: { name, price, url },
            apiEndpoint: window.location.origin // Same origin for iframe
        });
    }
});
