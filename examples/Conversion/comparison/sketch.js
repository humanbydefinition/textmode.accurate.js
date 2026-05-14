/**
 * @title brightness vs accurate
 * @author humanbydefinition
 */
const VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const t = textmode.create({
	width: window.innerWidth,
	height: window.innerHeight,
	fontSize: 8,
	plugins: [AccurateConversionPlugin],
});

let brightnessVideo;
let accurateVideo;
let playFailed = false;

function drawLabel(text, x, y, color = [255, 255, 255]) {
	t.push();
	t.translate(x - Math.floor(text.length / 2), y);
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

function allFontCharacters() {
	return t.font.characters.map((entry) => entry.character).join('');
}

function configureBrightnessVideo() {
	brightnessVideo.conversionMode('brightness');
	brightnessVideo.characters(allFontCharacters());
	brightnessVideo.charColorMode('sampled');
	brightnessVideo.cellColorMode('fixed');
	brightnessVideo.loop(true);
}

function configureAccurateVideo() {
	accurateVideo.conversionMode('accurate');
	accurateVideo.characters(allFontCharacters());
	accurateVideo.charColorMode('sampled');
	accurateVideo.cellColorMode('sampled');
	accurateVideo.loop(true);
}

t.setup(async () => {
	brightnessVideo = await t.loadVideo(VIDEO_URL);
	accurateVideo = await t.loadVideo(VIDEO_URL);
	configureBrightnessVideo();
	configureAccurateVideo();

	try {
		await Promise.all([brightnessVideo.play(), accurateVideo.play()]);
	} catch {
		playFailed = true;
	}
});

t.draw(() => {
	t.background(0);
	if (!brightnessVideo || !accurateVideo) return;

	const gap = Math.max(4, Math.floor(t.grid.cols * 0.05));
	const panelWidth = Math.max(18, Math.floor((t.grid.cols - gap * 3) / 2));
	const panelHeight = Math.max(12, Math.min(t.grid.rows - 12, Math.floor(panelWidth * 0.56)));
	const leftX = -Math.floor(panelWidth * 0.5) - Math.floor(gap * 0.5);
	const rightX = Math.floor(panelWidth * 0.5) + Math.floor(gap * 0.5);
	const labelY = Math.floor(panelHeight * 0.5) + 3;

	t.push();
	t.translate(leftX, -1);
	t.image(brightnessVideo, panelWidth, panelHeight);
	t.pop();

	t.push();
	t.translate(rightX, -1);
	t.image(accurateVideo, panelWidth, panelHeight);
	t.pop();

	drawLabel('brightness', leftX, labelY, [160, 160, 170]);
	drawLabel('accurate', rightX, labelY, [255, 225, 140]);

	if (playFailed || !brightnessVideo.isPlaying || !accurateVideo.isPlaying) {
		drawLabel('click to play video', 0, labelY + 3, [140, 200, 255]);
	}
});

t.mouseClicked(async () => {
	if (!brightnessVideo || !accurateVideo) return;

	playFailed = false;
	await Promise.all([brightnessVideo.play(), accurateVideo.play()]);
});

t.windowResized(() => {
	t.resizeCanvas(window.innerWidth, window.innerHeight);
});
