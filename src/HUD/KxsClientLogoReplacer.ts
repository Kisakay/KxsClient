import { full_logo } from "../UTILS/vars";

const targetLogo = '/img/survev_logo_full.png';
const replacementLogo = full_logo;

// Cache to track already processed elements
const processedElements = new WeakSet();

const replaceLogo = () => {
	const elements = document.querySelectorAll(`[style*="${targetLogo}"]`);

	elements.forEach(el => {
		// Skip if already processed
		if (processedElements.has(el)) return;

		const style = el.getAttribute('style');
		if (style && style.includes(targetLogo)) {
			el.setAttribute('style', style.replace(new RegExp(targetLogo, 'g'), replacementLogo));
			processedElements.add(el); // Mark as processed
		}
	});
};

// Initial replacement
replaceLogo();

// Throttled function to prevent excessive calls
let isThrottled = false;
const throttledReplaceLogo = () => {
	if (isThrottled) return;

	isThrottled = true;
	requestAnimationFrame(() => {
		replaceLogo();
		isThrottled = false;
	});
};

// More targeted observer
const observer = new MutationObserver(mutations => {
	let shouldReplace = false;

	for (const mutation of mutations) {
		if (mutation.type === 'childList') {
			// Check if added nodes contain potential logo elements
			for (const node of mutation.addedNodes) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const element = node as Element;
					const htmlElement = element as HTMLElement;

					const hasTargetLogo = htmlElement.style &&
						htmlElement.style.backgroundImage &&
						htmlElement.style.backgroundImage.includes(targetLogo);
					const hasChildWithLogo = element.querySelector(`[style*="${targetLogo}"]`);

					if (hasTargetLogo || hasChildWithLogo) {
						shouldReplace = true;
						break;
					}
				}
			}
		} else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
			// Only check if the style attribute contains our target
			const target = mutation.target as Element;
			const style = target.getAttribute('style');
			if (style && style.includes(targetLogo) && !processedElements.has(target)) {
				shouldReplace = true;
			}
		}

		if (shouldReplace) break;
	}

	if (shouldReplace) {
		throttledReplaceLogo();
	}
});

// Observe with more specific configuration
observer.observe(document.body, {
	childList: true,
	subtree: true,
	attributes: true,
	attributeFilter: ['style'] // Only observe style changes
});