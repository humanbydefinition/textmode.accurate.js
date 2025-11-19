# textmode.accurate.js

Accurate glyph matching conversion plug-in for [`textmode.js`](https://code.textmode.art/).

This add-on reinstates the multi-sample "accurate" image/video conversion strategy that used to ship with the core library.

## Installation

```bash
npm install textmode.accurate.js
```

Make sure `textmode.js` is also installed in your project. The add-on declares it as a peer dependency.

## Usage

```ts
import { textmode } from 'textmode.js';
import { createAccurateConversionPlugin } from 'textmode.accurate.js';

const accuratePlugin = createAccurateConversionPlugin();

const t = textmode.create({
  width: 800,
  height: 600,
  plugins: [accuratePlugin],
});

t.setup(async () => {
  const image = await t.loadImage('https://example.com/photo.jpg');
  image.conversionMode('accurate', { sampleRate: 10 });
});
```

The plugin registers the `accurate` conversion strategy at installation time. Once installed, any `TextmodeSource` can switch to the mode by calling `conversionMode('accurate')`.

## Build

The add-on ships as TypeScript. Run the following from the package root to generate distributable JavaScript and declaration files:

```bash
npm run build
```
