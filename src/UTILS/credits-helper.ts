// @ts-ignore
import creditsWindowHtml from "../creditpage.html?raw";

// Function to create and show the "Click on me" animation above the version link
function showClickMeAnimation() {
	// Get the position of the version link to position the animation above it
	const startBottomMiddle = document.getElementById("start-bottom-middle");
	if (!startBottomMiddle) return;
	const versionLink = startBottomMiddle.getElementsByTagName("a")[0];
	if (!versionLink) return;

	// Get the position of the version link
	const linkRect = versionLink.getBoundingClientRect();

	// Create the animation container
	const animationContainer = document.createElement('div');
	animationContainer.id = 'click-me-animation';
	animationContainer.style.cssText = `
        position: fixed;
        bottom: ${window.innerHeight - linkRect.top}px;
        left: ${linkRect.left + (linkRect.width / 2)}px;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: fadeInBounce 1s ease-out;
        transform: translateX(-50%);
    `;

	// Create the text element
	const textElement = document.createElement('div');
	textElement.textContent = 'Click on me';
	textElement.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 8px 16px;
        border-radius: 20px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: pulse 2s infinite;
        white-space: nowrap;
    `;

	// Create the arrow element pointing down to the version link
	const arrowElement = document.createElement('div');
	arrowElement.innerHTML = '▼';
	arrowElement.style.cssText = `
        color: #fff;
        font-size: 20px;
        animation: bounce 1.5s infinite;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        margin-top: -5px;
    `;

	// Add CSS animations to the document
	const styleElement = document.createElement('style');
	styleElement.textContent = `
        @keyframes fadeInBounce {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            60% {
                opacity: 1;
                transform: translateX(-50%) translateY(5px);
            }
            100% {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
       
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-8px);
            }
            60% {
                transform: translateY(-4px);
            }
        }
       
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }
       
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
	document.head.appendChild(styleElement);

	// Assemble the animation
	animationContainer.appendChild(textElement);
	animationContainer.appendChild(arrowElement);
	document.body.appendChild(animationContainer);

	// Auto-hide after 8 seconds
	setTimeout(() => {
		animationContainer.style.animation = 'fadeOut 0.5s ease-in forwards';
		setTimeout(() => {
			if (animationContainer.parentNode) {
				animationContainer.parentNode.removeChild(animationContainer);
			}
			if (styleElement.parentNode) {
				styleElement.parentNode.removeChild(styleElement);
			}
		}, 500);
	}, 4000);

	return animationContainer;
}

// Function to create and open the credits window
function openCreditsWindow(focusTab: string = "credits") {
	// Use the imported HTML content
	const htmlContent = creditsWindowHtml.replace('%%FOCUS_TAB%%', focusTab);

	// Create a blob URL from the HTML content
	const blob = new Blob([htmlContent], { type: 'text/html' });
	const blobUrl = URL.createObjectURL(blob);

	// Open the window with the blob URL
	const creditsWindow = window.open(blobUrl, 'KxsCredits', 'width=800,height=600,scrollbars=yes,resizable=yes');

	if (!creditsWindow) {
		alert('Please allow popups for this site to view credits.');
		URL.revokeObjectURL(blobUrl); // Clean up if window couldn't open
		return;
	}

	// Clean up the blob URL after the window loads
	creditsWindow.addEventListener('load', () => {
		URL.revokeObjectURL(blobUrl);
	});
}

export { openCreditsWindow, creditsWindowHtml, showClickMeAnimation }