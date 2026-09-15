export interface Users {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: '_pb_users_auth_'
    /**
     * |               |         |
     * | ------------- | ------- |
     * | type          | `text`  |
     * | min           | `1`     |
     * | min           | `255`   |
     * | current value | `users` |
     */
    collectionName: 'users' | (string & {})
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `password` |
     * | hidden   | `true`     |
     * | required | `true`     |
     * | min      | `8`        |
     * | max      | `71`       |
     */
    password: string
    /**
     * |                     |                   |
     * | ------------------- | ----------------- |
     * | type                | `text`            |
     * | hidden              | `true`            |
     * | required            | `true`            |
     * | min                 | `30`              |
     * | max                 | `60`              |
     * | autogeneratePattern | `[a-zA-Z0-9]{50}` |
     */
    tokenKey: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `email` |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    email: string
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    emailVisibility: boolean
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    verified: boolean
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `255`   |
     */
    name: string
    /**
     * |           |                                                                       |
     * | --------- | --------------------------------------------------------------------- |
     * | type      | `file(single)`                                                        |
     * | hidden    | `false`                                                               |
     * | required  | `false`                                                               |
     * | protected | `false`                                                               |
     * | maxSize   | `0`                                                                   |
     * | mimeTypes | `image/jpeg`, `image/png`, `image/svg+xml`, `image/gif`, `image/webp` |
     */
    avatar: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface MediaIds {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: 'pbc_1604334589'
    /**
     * |               |             |
     * | ------------- | ----------- |
     * | type          | `text`      |
     * | min           | `1`         |
     * | min           | `255`       |
     * | current value | `media_ids` |
     */
    collectionName: 'media_ids' | (string & {})
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `true`   |
     * | min      | `1`      |
     */
    tmdbId: number
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `32`    |
     */
    imdbId: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    type: 'movie' | 'tv'
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `500`   |
     */
    title: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    releaseDate: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface SubtitleSearches {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: 'pbc_3031568985'
    /**
     * |               |                     |
     * | ------------- | ------------------- |
     * | type          | `text`              |
     * | min           | `1`                 |
     * | min           | `255`               |
     * | current value | `subtitle_searches` |
     */
    collectionName: 'subtitle_searches' | (string & {})
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `32`    |
     */
    imdbId: string
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     * | min      | `1`      |
     */
    tmdbId: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     * | min      | `0`      |
     */
    season: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     * | min      | `0`      |
     */
    episode: number
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | min      | `2`     |
     * | max      | `8`     |
     */
    language: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `json`  |
     * | hidden   | `false` |
     * | maxSize  | `0`     |
     * | required | `false` |
     */
    queriedSources: any
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    mediaReleaseDate: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    lastFetchedAt: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    expiresAt: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Subtitles {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: 'pbc_3272748830'
    /**
     * |               |             |
     * | ------------- | ----------- |
     * | type          | `text`      |
     * | min           | `1`         |
     * | min           | `255`       |
     * | current value | `subtitles` |
     */
    collectionName: 'subtitles' | (string & {})
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |                |                     |
     * | -------------- | ------------------- |
     * | type           | `relation(single)`  |
     * | hidden         | `false`             |
     * | required       | `true`              |
     * | collectionId   | `pbc_3031568985`    |
     * | collectionName | `subtitle_searches` |
     * | cascadeDelete  | `true`              |
     */
    search: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `64`    |
     */
    provider: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `256`   |
     */
    externalId: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | min      | `2`     |
     * | max      | `8`     |
     */
    language: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `16`    |
     */
    format: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `500`   |
     */
    release: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `500`   |
     */
    fileName: string
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    hearingImpaired: boolean
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     * | min      | `0`      |
     */
    downloadCount: number
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `128`   |
     */
    hash: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `2000`  |
     */
    rawUrl: string
    /**
     * |           |                                                                                          |
     * | --------- | ---------------------------------------------------------------------------------------- |
     * | type      | `file(single)`                                                                           |
     * | hidden    | `false`                                                                                  |
     * | required  | `true`                                                                                   |
     * | protected | `false`                                                                                  |
     * | maxSize   | `5242880`                                                                                |
     * | mimeTypes | `text/vtt`, `text/plain`, `text/srt`, `application/x-subrip`, `application/octet-stream` |
     */
    file: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    fetchedAt: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}


/**
 * Commented-out back-relations are what will be inferred by pocketbase-ts from the forward relations.
 *
 * The "UNIQUE index constraint" case is automatically handled by this hook,
 * but if you want to make a back-relation non-nullable, you can uncomment it and remove the "?".
 *
 * See [here](https://github.com/satohshi/pocketbase-ts#back-relations) for more information.
 */
export type Schema = {
    users: {
        type: Users
    }
    media_ids: {
        type: MediaIds
    }
    subtitle_searches: {
        type: SubtitleSearches
        relations: {
            // subtitles_via_search?: Subtitles[]
        }
    }
    subtitles: {
        type: Subtitles
        relations: {
            search: SubtitleSearches
        }
    }
}

