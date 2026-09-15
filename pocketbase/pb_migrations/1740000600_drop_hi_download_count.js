/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('subtitles');
		for (const name of ['hearingImpaired', 'downloadCount']) {
			const field = collection.fields.getByName(name);
			if (field) {
				collection.fields.removeById(field.id);
			}
		}
		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('subtitles');
		if (!collection.fields.getByName('hearingImpaired')) {
			collection.fields.add(
				new Field({
					type: 'bool',
					name: 'hearingImpaired',
					required: false
				})
			);
		}
		if (!collection.fields.getByName('downloadCount')) {
			collection.fields.add(
				new Field({
					type: 'number',
					name: 'downloadCount',
					required: false,
					onlyInt: true,
					min: 0
				})
			);
		}
		app.save(collection);
	}
);
