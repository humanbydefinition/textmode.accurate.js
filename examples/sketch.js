import { textmode } from 'textmode.js';
import { createAccurateConversionPlugin } from 'textmode.accurate.js';

// Initialize Textmodifier
const accuratePlugin = createAccurateConversionPlugin();

const t = textmode.create({
	canvas: document.getElementById('textmode-canvas'),
	fontSize: 8,
	frameRate: 60,
	plugins: [accuratePlugin],
});

let video;

t.setup(async () => {
	video = await t.loadVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
	video.play();
	video.loop();

	video.conversionMode('accurate');
	video.invert(false);
	video.flipX(false);
	video.flipY(false);
	video.charRotation(0);
	video.charColorMode('sampled');
	video.cellColorMode('sampled');
	video.characters(t.font.characters.map(c => c.character).join(''));
});

t.draw(() => {
	t.background(0);
	t.image(video);
});

