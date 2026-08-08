/**
 * @title Conversion.accurate
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

let video;
let playFailed = false;

function drawText(text, x, y, r = 220, g = 230, b = 255) {
	t.push();
	t.printAlign('left', 'top');
	t.charColor(r, g, b);
	t.print(text, x, y);
	t.pop();
}

t.setup(async () => {
	video = await t.loadVideo(VIDEO_URL);
	video.characters(t.font.characters.map((entry) => entry.character).join(''));
	video.conversionMode('accurate');
	video.charColorMode('sampled');
	video.cellColorMode('sampled');
	video.loop(true);

	try {
		await video.play();
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

	drawText('CONVERSION.ACCURATE', x, y++, 255, 225, 140);
	drawText('------------------------------------', x, y++, 80, 100, 150);
	drawText('CONCEPT: GLYPH-SHAPE MATCHING', x, y++, 100, 220, 255);
	drawText('Samples cells, picks closest glyph.', x, y++, 140, 160, 190);
	drawText('------------------------------------', x, y++, 80, 100, 150);
	if (playFailed || (video && !video.isPlaying)) {
		drawText('click to play video', x, y++, 140, 200, 255);
	}
});

t.draw(() => {
	t.background(0);
	if (!video) return;
	t.image(video);
});

t.mouseClicked(async () => {
	if (!video) return;
	playFailed = false;
	await video.play();
});

t.windowResized(() => {
	t.resizeCanvas(window.innerWidth, window.innerHeight);
});
