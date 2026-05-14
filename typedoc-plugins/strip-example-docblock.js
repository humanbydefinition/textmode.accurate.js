export function load(app) {
	app.renderer.on('beginPage', (page) => {
		if (!page.contents) {
			return;
		}

		page.contents = page.contents.replaceAll(/\/\*\*[\s\S]*?\*\//g, '').replaceAll(/\n{3,}/g, '\n\n');
	});
}
