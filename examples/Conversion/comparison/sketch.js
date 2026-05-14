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

let video;
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

function configureVideo(mode) {
	video.conversionMode(mode);
	video.characters(' .,:;irsXA253hMHGS#9B&@');
	video.charColorMode('sampled');
	video.cellColorMode('sampled');
}

t.setup(async () => {
	video = await t.loadVideo(VIDEO_URL);
	configureVideo('accurate');
	video.loop(true);

	try {
		await video.play();
	} catch {
		playFailed = true;
	}
});

t.draw(() => {
	t.background(0);
	if (!video) return;

	const gap = Math.max(4, Math.floor(t.grid.cols * 0.05));
	const panelWidth = Math.max(18, Math.floor((t.grid.cols - gap * 3) / 2));
	const panelHeight = Math.max(12, Math.min(t.grid.rows - 12, Math.floor(panelWidth * 0.56)));
	const leftX = -Math.floor(panelWidth * 0.5) - Math.floor(gap * 0.5);
	const rightX = Math.floor(panelWidth * 0.5) + Math.floor(gap * 0.5);
	const labelY = Math.floor(panelHeight * 0.5) + 3;

	t.push();
	t.translate(leftX, -1);
	video.conversionMode('brightness');
	t.image(video, panelWidth, panelHeight);
	t.pop();

	t.push();
	t.translate(rightX, -1);
	video.conversionMode('accurate');
	t.image(video, panelWidth, panelHeight);
	t.pop();

	drawLabel('brightness', leftX, labelY, [160, 160, 170]);
	drawLabel('accurate', rightX, labelY, [255, 225, 140]);

	if (playFailed || !video.isPlaying) {
		drawLabel('click to play video', 0, labelY + 3, [140, 200, 255]);
	}
});

t.mouseClicked(async () => {
	if (!video) return;

	playFailed = false;
	await video.play();
});

t.windowResized(() => {
	t.resizeCanvas(window.innerWidth, window.innerHeight);
});
