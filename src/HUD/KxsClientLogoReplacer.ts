import { full_logo } from "../UTILS/vars";

const targetLogo = '/img/survev_logo_full.png';
const replacementLogo = full_logo;

const replaceLogo = () => {
	const elements = document.querySelectorAll('[style*="' + targetLogo + '"]');
	elements.forEach(el => {
		const style = el.getAttribute('style');
		if (style && style.includes(targetLogo)) {
			el.setAttribute('style', style.replace(targetLogo, replacementLogo));
		}
	});
};

replaceLogo();

const observer = new MutationObserver(mutations => {
	for (const mutation of mutations) {
		if (mutation.type === 'childList' || mutation.type === 'attributes') {
			replaceLogo();
		}
	}
});

observer.observe(document.body, {
	childList: true,
	subtree: true,
	attributes: true,
	attributeFilter: ['style']
});
