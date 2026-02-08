import { PriceDropWidget, WidgetConfig } from './widget';

// Identify global object
declare global {
    interface Window {
        PriceDropWidget: {
            init: (config: WidgetConfig) => void;
        };
    }
}

// Helper to manually inject if not using Web Component directly in HTML
function init(config: WidgetConfig) {
    let widget = document.querySelector('price-drop-widget') as PriceDropWidget;

    if (!widget) {
        // If containerId is provided, try to find it
        if (config.containerId) {
            const container = document.getElementById(config.containerId);
            if (container) {
                widget = document.createElement('price-drop-widget') as PriceDropWidget;
                container.innerHTML = ''; // Clear existing content (skeleton loader)
                container.appendChild(widget);
            }
        }
    }

    // If still no widget and we are just calling init to spawn it somewhere default? 
    // For userscript, we probably insert the element then call init on it, or call init and let it find/create.
    // Let's assume the user/script inserts <price-drop-widget> into DOM, then calls init data.
    // OR this init function creates it.

    if (widget) {
        // Prevent layout shift: Ensure container matches widget height if possible
        if (config.containerId) {
            const container = document.getElementById(config.containerId);
            if (container) {
                container.style.minHeight = '150px';
                container.style.display = 'block';
                container.style.transition = 'height 0.3s ease';
            }
        }

        widget.init(config);
    }
}

// Export for UMD
export { PriceDropWidget, init };
