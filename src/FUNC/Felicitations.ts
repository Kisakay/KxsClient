
export function felicitation(win_sound_url: string, text: string) {
	const goldText = document.createElement("div");
	goldText.textContent = text;
	goldText.style.position = "fixed";
	goldText.style.top = "50%";
	goldText.style.left = "50%";
	goldText.style.transform = "translate(-50%, -50%)";
	goldText.style.fontSize = "80px";
	goldText.style.color = "gold";
	goldText.style.textShadow = "2px 2px 4px rgba(0,0,0,0.3)";
	goldText.style.zIndex = "10000";
	document.body.appendChild(goldText);

	function createConfetti() {
		const colors = [
			"#ff0000",
			"#00ff00",
			"#0000ff",
			"#ffff00",
			"#ff00ff",
			"#00ffff",
			"gold",
		];
		const confetti = document.createElement("div");

		confetti.style.position = "fixed";
		confetti.style.width = Math.random() * 10 + 5 + "px";
		confetti.style.height = Math.random() * 10 + 5 + "px";
		confetti.style.backgroundColor =
			colors[Math.floor(Math.random() * colors.length)];
		confetti.style.borderRadius = "50%";
		confetti.style.zIndex = "9999";

		confetti.style.left = Math.random() * 100 + "vw";
		confetti.style.top = "-20px";

		document.body.appendChild(confetti);

		let posY = -20;
		let posX = parseFloat(confetti.style.left);
		let rotation = 0;
		let speedY = Math.random() * 2 + 1;
		let speedX = Math.random() * 2 - 1;

		function fall() {
			posY += speedY;
			posX += speedX;
			rotation += 5;

			confetti.style.top = posY + "px";
			confetti.style.left = posX + "vw";
			confetti.style.transform = `rotate(${rotation}deg)`;

			if (posY < window.innerHeight) {
				requestAnimationFrame(fall);
			} else {
				confetti.remove();
			}
		}

		fall();
	}

	const confettiInterval = setInterval(() => {
		for (let i = 0; i < 5; i++) {
			createConfetti();
		}
	}, 100);

	const audio = new Audio(
		win_sound_url,
	);
	audio.play().catch((err) => console.error("Erreur lecture:", err));

	setTimeout(() => {
		clearInterval(confettiInterval);
		goldText.style.transition = "opacity 1s";
		goldText.style.opacity = "0";
		setTimeout(() => goldText.remove(), 1000);
	}, 5000);
}