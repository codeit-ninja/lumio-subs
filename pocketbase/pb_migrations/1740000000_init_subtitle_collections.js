/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const mediaIds = new Collection({
			type: 'base',
			name: 'media_ids',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{
					type: 'number',
					name: 'tmdbId',
					required: true,
					onlyInt: true,
					min: 1
				},
				{
					type: 'text',
					name: 'imdbId',
					required: false,
					max: 32
				},
				{
					type: 'select',
					name: 'type',
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
				'CREATE UNIQUE INDEX idx_media_ids_tmdb ON media_ids (tmdbId, type)',
				'CREATE INDEX idx_media_ids_imdb ON media_ids (imdbId)'
			]
		});
		app.save(mediaIds);

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
					type: 'json',
					name: 'queriedSources',
					required: false
				},
				{
					type: 'date',
					name: 'mediaReleaseDate',
					required: false
				},
				{
					type: 'date',
					name: 'lastFetchedAt',
					required: true
				},
				{
					type: 'date',
					name: 'expiresAt',
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
				'CREATE INDEX idx_subtitle_searches_lookup ON subtitle_searches (imdbId, tmdbId, season, episode, language)',
				'CREATE INDEX idx_subtitle_searches_expiry ON subtitle_searches (expiresAt, lastFetchedAt)'
			]
		});
		app.save(searches);

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
					type: 'relation',
					name: 'search',
					required: true,
					collectionId: searches.id,
					cascadeDelete: true,
					maxSelect: 1
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
					name: 'language',
					required: true,
					min: 2,
					max: 8
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
					type: 'bool',
					name: 'hearingImpaired',
					required: false
				},
				{
					type: 'number',
					name: 'downloadCount',
					required: false,
					onlyInt: true,
					min: 0
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
				'CREATE UNIQUE INDEX idx_subtitles_provider_ext ON subtitles (search, provider, externalId)',
				'CREATE INDEX idx_subtitles_lang ON subtitles (language, provider)'
			]
		});
		app.save(subtitles);
	},
	(app) => {
		for (const name of ['subtitles', 'subtitle_searches', 'media_ids']) {
			try {
				const collection = app.findCollectionByNameOrId(name);
				app.delete(collection);
			} catch {
				/* may not exist */
			}
		}
	}
);
