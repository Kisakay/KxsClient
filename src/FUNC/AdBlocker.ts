// This code was taked from by Lirus

export class AdBlockerBaby {
	private whitelist = [
		'admin',
		'adapter',
		'advice',
		'adopt',
		'addition',
		'address'
	];
	private baseSelectors = [
		'[id="ad"]',
		'[id^="ad-"]',
		'[class^="ad-"]',
		'[class$="-ad"]',
		'[class~="ad"]',
		'[class*=" ad-"]',
		'[class*="-ad "]',
		'[class*="_ad_"]',
		'[class*="banner"]',
		'[class*="sponsor"]',
		'[class*="promo"]',
		'[class*="advert"]',
		'[data-testid*="ad"]',
		'iframe[src*="ads"]',
		'iframe[src*="googlesyndication"]',
		'iframe[src*="doubleclick"]',

		'[class*="publift-widget"]',
		'[id*="publift-widget"]',
		'[class*="sticky_footer"]',
		'[class*="sticky-footer"]',
		'[id*="sticky_footer"]',
		'[id*="sticky-footer"]',
		'[id*="ui-stats-ad"]',
		'[class*="ui-stats-ad"]'
	];

	private isFalsePositive(el: Element) {
		const id = el.id?.toLowerCase() || '';
		const cls = el.className?.toString().toLowerCase() || '';
		return this.whitelist.some(w => id.includes(w) || cls.includes(w));
	}

	private isProbablyAd(el: Element) {
		const text = el.textContent?.trim() || '';
		const imgs = el.querySelectorAll('img, iframe').length;
		return imgs > 0 && text.length < 150;
	}

	private removeAds() {
		const selectors = [...this.baseSelectors];

		document.querySelectorAll(selectors.join(',')).forEach(el => {
			if (!this.isFalsePositive(el)) {
				const id = el.id?.toLowerCase() || '';
				const cls = el.className?.toString().toLowerCase() || '';

				if (
					id.includes('publift-widget') ||
					cls.includes('publift-widget') ||
					id.includes('ui-stats-ad') ||
					cls.includes('ui-stats-ad') ||
					cls.includes('sticky_footer') ||
					cls.includes('sticky-footer')
				) {
					el.remove();
					console.debug('[AntiPub]', 'Supprimé pub forcée:', el);
					return;
				}

				if (this.isProbablyAd(el)) {
					el.remove();
					console.debug('[AntiPub]', 'Supprimé probable pub:', el);
				}
			}
		});
	}


	public run() {
		this.removeAds();

		const observer = new MutationObserver(() => this.removeAds());
		observer.observe(document.body, { childList: true, subtree: true });
	}
}