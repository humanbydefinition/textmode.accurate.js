export function load(app) {
	app.renderer.on('beginPage', (page) => {
		if (!page.contents || page.contents.startsWith('---')) {
			return;
		}

		page.contents = `---\nlayout: doc\neditLink: true\n---\n\n${page.contents}`;
	});
}
