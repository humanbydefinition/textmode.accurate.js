/**
 * @title Conversion.comparison
 * @author humanbydefinition
 */

const VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const t = textmode.create({
	width: window.innerWidth,
	height: window.innerHeight,
	fontSize: 8,
	plugins: [AccurateConversionPlugin],
});

const labelLayer = t.layers.add();

let brightnessVideo;
let accurateVideo;
let playFailed = false;

function allFontCharacters() {
	return t.font.characters.map((entry) => entry.character).join('');
}

function drawText(text, x, y, r = 220, g = 230, b = 255) {
	t.push();
	t.printAlign('left', 'top');
	t.charColor(r, g, b);
	t.print(text, x, y);
	t.pop();
}

t.setup(async () => {
	brightnessVideo = await t.loadVideo(VIDEO_URL);
	accurateVideo = await t.loadVideo(VIDEO_URL);

	brightnessVideo.conversionMode('brightness');
	brightnessVideo.characters(allFontCharacters());
	brightnessVideo.charColorMode('sampled');
	brightnessVideo.cellColorMode('fixed');
	brightnessVideo.loop(true);

	accurateVideo.conversionMode('accurate');
	accurateVideo.characters(allFontCharacters());
	accurateVideo.charColorMode('sampled');
	accurateVideo.cellColorMode('sampled');
	accurateVideo.loop(true);

	try {
		await Promise.all([brightnessVideo.play(), accurateVideo.play()]);
	} catch {
		playFailed = true;
	}
});

labelLayer.draw(() => {
	t.clear();
	const left = -Math.floor(t.grid.cols / 2);
	const top = -Math.floor(t.grid.rows / 2);
	let y = top + 3;
	const x = left + 3;

	drawText('CONVERSION.COMPARISON', x, y++, 255, 225, 140);
	drawText('------------------------------------', x, y++, 80, 100, 150);
	drawText('CONCEPT: BRIGHTNESS VS ACCURATE', x, y++, 100, 220, 255);
	drawText('Left: luminance. Right: shape match.', x, y++, 140, 160, 190);
});

t.draw(() => {
	t.background(0);
	if (!brightnessVideo || !accurateVideo) return;

	const gap = Math.max(4, Math.floor(t.grid.cols * 0.05));
	const panelWidth = Math.max(18, Math.floor((t.grid.cols - gap * 3) / 2));
	const panelHeight = Math.max(12, Math.min(t.grid.rows - 12, Math.floor(panelWidth * 0.56)));
	const leftX = -Math.floor(panelWidth * 0.5) - Math.floor(gap * 0.5);
	const rightX = Math.floor(panelWidth * 0.5) + Math.floor(gap * 0.5);

	t.push();
	t.translate(leftX, -1);
	t.image(brightnessVideo, panelWidth, panelHeight);
	t.pop();

	t.push();
	t.translate(rightX, -1);
	t.image(accurateVideo, panelWidth, panelHeight);
	t.pop();
});

t.mouseClicked(async () => {
	if (!brightnessVideo || !accurateVideo) return;
	playFailed = false;
	await Promise.all([brightnessVideo.play(), accurateVideo.play()]);
});

t.windowResized(() => {
	t.resizeCanvas(window.innerWidth, window.innerHeight);
});
