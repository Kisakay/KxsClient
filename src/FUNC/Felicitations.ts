import JSConfetti from 'js-confetti';

export function felicitation(enable: boolean, win_sound_url: string, text: string) {
	const jsConfetti = new JSConfetti();

	const goldText = document.createElement("div");
	goldText.textContent = text;
	Object.assign(goldText.style, {
		position: "fixed",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		fontSize: "80px",
		color: "gold",
		textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
		zIndex: "10000",
		pointerEvents: "none",
		fontWeight: "bold"
	});
	document.body.appendChild(goldText);

	const duration = 2000;
	const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#FFD700'];

	jsConfetti.addConfetti({
		confettiColors: colors,
		confettiRadius: 6,
		confettiNumber: 300,
		emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'],
	});

	if (enable && win_sound_url) {
		const audio = new Audio(win_sound_url);
		audio.play().catch((err) => console.error("Erreur lecture:", err));
	}

	setTimeout(() => {
		goldText.style.transition = "opacity 1s";
		goldText.style.opacity = "0";

		setTimeout(() => {
			goldText.remove();
			jsConfetti.clearCanvas();
		}, 1000);
	}, duration);
}