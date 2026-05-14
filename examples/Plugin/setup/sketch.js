/**
 * @title Plugin setup
 * @author humanbydefinition
 */
const t = textmode.create({
	width: window.innerWidth,
	height: window.innerHeight,
	fontSize: 12,
	plugins: [AccurateConversionPlugin],
});

let source;

function createSourceCanvas() {
	const canvas = document.createElement('canvas');
	canvas.width = 180;
	canvas.height = 120;

	const ctx = canvas.getContext('2d');
	if (!ctx) return canvas;

	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, '#020617');
	gradient.addColorStop(0.45, '#38bdf8');
	gradient.addColorStop(1, '#facc15');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = '#f8fafc';
	ctx.fillRect(24, 24, 44, 72);
	ctx.beginPath();
	ctx.arc(114, 60, 34, 0, Math.PI * 2);
	ctx.fill();

	return canvas;
}

function drawLabel(text, y, color = [255, 255, 255]) {
	t.push();
	t.translate(-Math.floor(text.length / 2), y);
	t.charColor(color[0], color[1], color[2]);

	for (let i = 0; i < text.length; i++) {
		t.push();
		t.translate(i, 0);
		t.char(text[i]);
		t.point();
		t.pop();
	}

	t.pop();
}

t.setup(() => {
	source = t.createTexture(createSourceCanvas());
	source.conversionMode('accurate');
	source.characters(' .:-=+*#%@');
});

t.draw(() => {
	t.background(5, 8, 18);
	if (!source) return;

	t.image(source, t.grid.cols - 10, t.grid.rows - 10);
	drawLabel('plugins: [AccurateConversionPlugin]', Math.floor(t.grid.rows / 2) - 4, [255, 225, 140]);
	drawLabel(
		`conversions.has('accurate') = ${t.conversions.has('accurate')}`,
		Math.floor(t.grid.rows / 2),
		[140, 200, 255]
	);
});

t.windowResized(() => {
	t.resizeCanvas(window.innerWidth, window.innerHeight);
});
