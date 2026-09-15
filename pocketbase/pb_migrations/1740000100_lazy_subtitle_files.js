/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('subtitles');
		const file = collection.fields.getByName('file');
		if (file) {
			file.required = false;
			app.save(collection);
		}
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('subtitles');
		const file = collection.fields.getByName('file');
		if (file) {
			file.required = true;
			app.save(collection);
		}
	}
);
