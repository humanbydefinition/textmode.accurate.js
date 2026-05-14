export function load(app) {
	app.converter.on('resolveEnd', (context) => {
		for (const reflection of context.project.getReflectionsByKind(0x8000)) {
			if (!reflection.getSignature || !reflection.setSignature) {
				continue;
			}

			reflection.getSignature.sortStrategy = 'source-order';
			reflection.setSignature.sortStrategy = 'source-order';
		}
	});
}
