/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		for (const name of ['subtitles', 'subtitle_searches', 'media_ids']) {
			try {
				const collection = app.findCollectionByNameOrId(name);
				app.delete(collection);
			} catch {
				/* may not exist */
			}
		}

		const subtitles = new Collection({
			type: 'base',
			name: 'subtitles',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
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
					type: 'select',
					name: 'mediaType',
					required: false,
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
					type: 'text',
					name: 'provider',
					required: true,
					max: 64
				},
				{
					type: 'text',
					name: 'externalId',
					required: true,
					max: 256
				},
				{
					type: 'text',
					name: 'format',
					required: true,
					max: 16
				},
				{
					type: 'text',
					name: 'release',
					required: false,
					max: 500
				},
				{
					type: 'text',
					name: 'fileName',
					required: false,
					max: 500
				},
				{
					type: 'text',
					name: 'hash',
					required: false,
					max: 128
				},
				{
					type: 'text',
					name: 'rawUrl',
					required: false,
					max: 2000
				},
				{
					type: 'file',
					name: 'file',
					required: false,
					maxSelect: 1,
					maxSize: 5_242_880,
					mimeTypes: [
						'text/vtt',
						'text/plain',
						'text/srt',
						'application/x-subrip',
						'application/octet-stream'
					]
				},
				{
					type: 'date',
					name: 'fetchedAt',
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
				'CREATE INDEX idx_subtitles_imdb_lookup ON subtitles (imdbId, season, episode, language)',
				'CREATE INDEX idx_subtitles_tmdb_lookup ON subtitles (tmdbId, season, episode, language)',
				'CREATE UNIQUE INDEX idx_subtitles_provider_ext ON subtitles (provider, externalId, language, imdbId, season, episode)'
			]
		});
		app.save(subtitles);
	},
	(app) => {
		try {
			const collection = app.findCollectionByNameOrId('subtitles');
			app.delete(collection);
		} catch {
			/* may not exist */
		}
	}
);
