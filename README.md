# textmode.accurate.js

<div align="center">

<table>
	<tr>
		<td align="center">
			<a href="https://www.typescriptlang.org/"><img alt="TypeScript badge" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" /></a>&nbsp;<a href="https://vitejs.dev/"><img alt="Vite badge" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" /></a>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API"><img alt="WebGL badge" src="https://img.shields.io/badge/WebGL2-990000?logo=webgl&logoColor=white" /></a>
		</td>
		<td align="center">
			<a href="https://code.textmode.art/"><img alt="docs badge" src="https://img.shields.io/badge/docs-vitepress-646cff?logo=vitepress&logoColor=white" /></a>&nbsp;<a href="https://discord.gg/sjrw8QXNks"><img alt="Discord badge" src="https://img.shields.io/discord/1357070706181017691?color=5865F2&label=Discord&logo=discord&logoColor=white" /></a>
		</td>
		<td align="center">
			<a href="https://ko-fi.com/V7V8JG2FY"><img alt="Ko-fi badge" src="https://shields.io/badge/ko--fi-donate-ff5f5f?logo=ko-fi" /></a>&nbsp;<a href="https://github.com/sponsors/humanbydefinition"><img alt="GitHub Sponsors badge" src="https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=%23EA4AAA" /></a>
		</td>
	</tr>
</table>

</div>

`textmode.accurate.js` is an add-on library for `textmode.js` that restores an accurate, multi-sample glyph matching conversion mode. It registers a new `accurate` conversion strategy next to the built-in `brightness` mode, making image, video, and texture sources choose glyphs from sampled cell shape instead of average brightness alone.

> [!WARNING]  
> The `accurate` conversion mode is more computationally expensive than the default `brightness` mode. It may not be suitable for all use cases, especially on lower-end devices.

## Features

- Add an `accurate` conversion mode through the standard `textmode.js` plugin system
- Match glyph silhouettes against a sampled source-cell mask for higher fidelity conversion
- Preserve sampled foreground and background color behavior from the core conversion pipeline
- Support ESM and UMD consumers with the same `AccurateConversionPlugin` export
- Integrate with existing `TextmodeSource.conversionMode()` calls

## Installation

### Prerequisites

To get started with `textmode.accurate.js`, you'll need:

- `textmode.js` `0.10.0` or newer
- A modern browser with WebGL2 support
- Node.js `20.8.1+` and `npm` for ESM installation

### UMD

To use `textmode.accurate.js` in a browser without a bundler, load the UMD builds for both `textmode.js` and this add-on. `textmode.js` must be loaded first so the accurate conversion add-on can attach to the expected global runtime.

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>textmode.accurate.js sketch</title>

		<script src="https://cdn.jsdelivr.net/npm/textmode.js@latest/dist/textmode.umd.js"></script>
		<script src="https://cdn.jsdelivr.net/npm/textmode.accurate.js@latest/dist/textmode.accurate.umd.js"></script>
	</head>
	<body>
		<script src="./sketch.js"></script>
	</body>
</html>
```

```js
const t = textmode.create({
	width: window.innerWidth,
	height: window.innerHeight,
	fontSize: 8,
	plugins: [AccurateConversionPlugin],
});

t.setup(async () => {
	const image = await t.loadImage('photo.jpg');
	image.conversionMode('accurate');
});
```

The UMD bundle exposes `AccurateConversionPlugin` globally.

### ESM

Install the core library and the accurate conversion add-on together:

```bash
npm install textmode.js textmode.accurate.js
```

Then import both packages in your sketch or application code:

```ts
import { textmode } from 'textmode.js';
import { AccurateConversionPlugin } from 'textmode.accurate.js';
```

## Plugin setup

```ts
import { textmode } from 'textmode.js';
import { AccurateConversionPlugin } from 'textmode.accurate.js';

const t = textmode.create({
	width: 800,
	height: 600,
	fontSize: 8,
	plugins: [AccurateConversionPlugin],
});
```

The plugin registers the `accurate` conversion strategy during setup and unregisters it again if the plugin is uninstalled.

## Accurate conversion mode

Use `conversionMode('accurate')` on any compatible source after the plugin is installed:

```ts
t.setup(async () => {
	const video = await t.loadVideo('clip.mp4');

	video.play();
	video.loop();
	video.conversionMode('accurate');
	video.charColorMode('sampled');
	video.cellColorMode('sampled');
});

t.draw(() => {
	t.background(0);
	t.image(video);
});
```

The built-in `brightness` mode chooses glyphs from average luminance. The `accurate` mode samples each cell in a grid, compares candidate glyph masks against the source-cell shape, and keeps the closest glyph match.

## Documentation

- [textmode.js documentation](https://code.textmode.art/) for ecosystem guides and API reference
- [Local API reference](./api/textmode.accurate.js/index.md) after running `npm run build:docs`
- [Examples](./examples/) for ESM and UMD setup

## License

`textmode.accurate.js` is licensed under the MIT License.
