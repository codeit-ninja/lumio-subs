/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const media = new Collection({
			type: 'base',
			name: 'media',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{
					type: 'text',
					name: 'imdbId',
					required: true,
					max: 32
				},
				{
					type: 'number',
					name: 'tmdbId',
					required: false,
					onlyInt: true,
					min: 1
				},
				{
					type: 'select',
					name: 'mediaType',
					required: true,
					maxSelect: 1,
					values: ['movie', 'tv']
				},
				{
					type: 'text',
					name: 'title',
					required: false,
					max: 500
				},
				{
					type: 'date',
					name: 'releaseDate',
					required: false
				},
				{
					type: 'autodate',
					name: 'created',
					onCreate: true,
					onUpdate: false
				},
				{
					type: 'autodate',
					name: 'updated',
					onCreate: true,
					onUpdate: true
				}
			],
			indexes: [
				'CREATE UNIQUE INDEX idx_media_imdb ON media (imdbId)',
				'CREATE INDEX idx_media_tmdb ON media (tmdbId, mediaType)',
				'CREATE INDEX idx_media_release ON media (releaseDate)'
			]
		});
		app.save(media);

		const searches = new Collection({
			type: 'base',
			name: 'subtitle_searches',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{
					type: 'relation',
					name: 'media',
					required: false,
					collectionId: media.id,
					cascadeDelete: false,
					maxSelect: 1
				},
				{
					type: 'text',
					name: 'imdbId',
					required: false,
					max: 32
				},
				{
					type: 'number',
					name: 'tmdbId',
					required: false,
					onlyInt: true,
					min: 1
				},
				{
					type: 'number',
					name: 'season',
					required: false,
					onlyInt: true,
					min: 0
				},
				{
					type: 'number',
					name: 'episode',
					required: false,
					onlyInt: true,
					min: 0
				},
				{
					type: 'text',
					name: 'language',
					required: true,
					min: 2,
					max: 8
				},
				{
					type: 'date',
					name: 'lastFetchedAt',
					required: true
				},
				{
					type: 'autodate',
					name: 'created',
					onCreate: true,
					onUpdate: false
				},
				{
					type: 'autodate',
					name: 'updated',
					onCreate: true,
					onUpdate: true
				}
			],
			indexes: [
				'CREATE UNIQUE INDEX idx_subtitle_searches_lookup ON subtitle_searches (imdbId, tmdbId, season, episode, language)',
				'CREATE INDEX idx_subtitle_searches_fetched ON subtitle_searches (lastFetchedAt)'
			]
		});
		app.save(searches);
	},
	(app) => {
		for (const name of ['subtitle_searches', 'media']) {
			try {
				const collection = app.findCollectionByNameOrId(name);
				app.delete(collection);
			} catch {
				/* may not exist */
			}
		}
	}
);
