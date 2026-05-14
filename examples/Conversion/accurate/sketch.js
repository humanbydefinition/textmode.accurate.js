/**
 * @title AccurateConversionPlugin
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

t.setup(async () => {
	video = await t.loadVideo(VIDEO_URL);
	video.characters(' .,:;irsXA253hMHGS#9B&@');
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

t.draw(() => {
	t.background(0);
	if (!video) return;

	t.image(video);
	drawLabel("conversionMode('accurate')", Math.floor(t.grid.rows / 2) - 3, [255, 225, 140]);

	if (playFailed || !video.isPlaying) {
		drawLabel('click to play video', Math.floor(t.grid.rows / 2), [140, 200, 255]);
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
