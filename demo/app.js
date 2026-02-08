// Initialize the widget
// Since this is a strict CSP page, this script is loaded via src='app.js'
document.addEventListener('DOMContentLoaded', () => {
    if (window.PriceDropWidget) {
        window.PriceDropWidget.init({
            containerId: 'price-drop-container',
            product: {
                name: 'Super Cool Gadget 3000',
                price: '$129.99',
                url: window.location.href
            },
            apiEndpoint: window.location.origin
        });
    }
});
