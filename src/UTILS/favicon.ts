export function setFavicon(url: string): void {
	// Remove existing favicons
	const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
	existingFavicons.forEach(favicon => favicon.remove());

	const link = document.createElement('link');
	link.rel = 'icon';
	link.href = url;
	// Modern browsers generally pick the best icon format,
	// so explicitly setting type might not be necessary unless specific formats are used.
	// link.type = 'image/png'; // Or 'image/x-icon' for .ico files

	document.head.appendChild(link);
}
