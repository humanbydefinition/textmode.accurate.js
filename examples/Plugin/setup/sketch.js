/**
 * @title AccurateConversionPlugin.setup
 * @author humanbydefinition
 */

const t = textmode.create({
	width: window.innerWidth,
	height: window.innerHeight,
	fontSize: 16,
	plugins: [AccurateConversionPlugin],
});

const labelLayer = t.layers.add();

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

function drawText(text, x, y, r = 220, g = 230, b = 255) {
	t.push();
	t.printAlign('left', 'top');
	t.charColor(r, g, b);
	t.print(text, x, y);
	t.pop();
}

t.setup(() => {
	source = t.createTexture(createSourceCanvas());
	source.conversionMode('accurate');
	source.characters(t.font.characters.map((entry) => entry.character).join(''));
	source.charColorMode('sampled');
	source.cellColorMode('sampled');
});

labelLayer.draw(() => {
	t.clear();
	const left = -Math.floor(t.grid.cols / 2);
	const top = -Math.floor(t.grid.rows / 2);
	let y = top + 3;
	const x = left + 3;

	drawText('ACCURATECONVERSIONPLUGIN.SETUP', x, y++, 255, 225, 140);
	drawText('------------------------------------', x, y++, 80, 100, 150);
	drawText('CONCEPT: PLUGIN INSTALLATION', x, y++, 100, 220, 255);
	drawText('Registers the accurate strategy.', x, y++, 140, 160, 190);
	drawText('------------------------------------', x, y++, 80, 100, 150);
	const registered = t.conversions.has('accurate');
	drawText(`accurate = ${registered}`, x, y++, 140, 200, 255);
});

t.draw(() => {
	t.background(5, 8, 18);
	if (!source) return;
	t.image(source, t.grid.cols - 10, t.grid.rows - 10);
});

t.windowResized(() => {
	t.resizeCanvas(window.innerWidth, window.innerHeight);
});
