/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('subtitles');
		const field = collection.fields.getByName('fileName');
		if (field) {
			collection.fields.removeById(field.id);
		}
		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('subtitles');
		if (!collection.fields.getByName('fileName')) {
			collection.fields.add(
				new Field({
					type: 'text',
					name: 'fileName',
					required: false,
					max: 500
				})
			);
		}
		app.save(collection);
	}
);
