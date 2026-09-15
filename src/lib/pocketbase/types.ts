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
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `255`   |
     */
    stripeCustomerId: string
}

export interface Plans {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: 'pbc_4263585338'
    /**
     * |               |         |
     * | ------------- | ------- |
     * | type          | `text`  |
     * | min           | `1`     |
     * | min           | `255`   |
     * | current value | `plans` |
     */
    collectionName: 'plans' | (string & {})
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
     * | required | `true`  |
     * | max      | `120`   |
     */
    name: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `1000`  |
     */
    description: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `json`  |
     * | hidden   | `false` |
     * | maxSize  | `0`     |
     * | required | `false` |
     */
    features: any
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     * | min      | `0`      |
     */
    priceCents: number
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `8`     |
     */
    currency: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    interval: 'month' | 'year'
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `255`   |
     */
    stripePriceId: string
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    active: boolean
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    highlighted: boolean
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     */
    sortOrder: number
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
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `64`    |
     */
    slug: string
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `true`   |
     * | min      | `1`      |
     */
    limitPerSecond: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `true`   |
     * | min      | `1`      |
     */
    limitPerMinute: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `true`   |
     * | min      | `1`      |
     */
    limitPerHour: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `true`   |
     * | min      | `1`      |
     */
    limitPerDay: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `true`   |
     * | min      | `1`      |
     */
    limitPerMonth: number
}

export interface Subscriptions {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: 'pbc_3980638064'
    /**
     * |               |                 |
     * | ------------- | --------------- |
     * | type          | `text`          |
     * | min           | `1`             |
     * | min           | `255`           |
     * | current value | `subscriptions` |
     */
    collectionName: 'subscriptions' | (string & {})
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
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `_pb_users_auth_`  |
     * | collectionName | `users`            |
     * | cascadeDelete  | `true`             |
     */
    user: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_4263585338`   |
     * | collectionName | `plans`            |
     * | cascadeDelete  | `false`            |
     */
    plan: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `255`   |
     */
    stripeCustomerId: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     * | max      | `255`   |
     */
    stripeSubscriptionId: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid'
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    currentPeriodEnd: string
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

export interface ApiKeys {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: 'pbc_3577178630'
    /**
     * |               |            |
     * | ------------- | ---------- |
     * | type          | `text`     |
     * | min           | `1`        |
     * | min           | `255`      |
     * | current value | `api_keys` |
     */
    collectionName: 'api_keys' | (string & {})
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
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `_pb_users_auth_`  |
     * | collectionName | `users`            |
     * | cascadeDelete  | `true`             |
     */
    user: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `120`   |
     */
    name: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `16`    |
     */
    keyPrefix: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `128`   |
     */
    keyHash: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    expiresAt: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    revokedAt: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    lastUsedAt: string
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
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `false`          |
     */
    mediaType: 'movie' | 'tv'
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
     * | required  | `false`                                                                                  |
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

export interface Media {
    /**
     * |      |        |
     * | ---- | ------ |
     * | type | `text` |
     * | min  | `1`    |
     * | min  | `100`  |
     */
    collectionId: 'pbc_2708086759'
    /**
     * |               |         |
     * | ------------- | ------- |
     * | type          | `text`  |
     * | min           | `1`     |
     * | min           | `255`   |
     * | current value | `media` |
     */
    collectionName: 'media' | (string & {})
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
     * | required | `true`  |
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
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    mediaType: 'movie' | 'tv'
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
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_2708086759`   |
     * | collectionName | `media`            |
     * | cascadeDelete  | `false`            |
     */
    media: string
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
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    lastFetchedAt: string
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
        relations: {
            // subscriptions_via_user?: Subscriptions[]
            // api_keys_via_user?: ApiKeys[]
        }
    }
    plans: {
        type: Plans
        relations: {
            // subscriptions_via_plan?: Subscriptions[]
        }
    }
    subscriptions: {
        type: Subscriptions
        relations: {
            user: Users
            plan: Plans
        }
    }
    api_keys: {
        type: ApiKeys
        relations: {
            user: Users
        }
    }
    subtitles: {
        type: Subtitles
    }
    media: {
        type: Media
        relations: {
            // subtitle_searches_via_media?: SubtitleSearches[]
        }
    }
    subtitle_searches: {
        type: SubtitleSearches
        relations: {
            media?: Media
        }
    }
}

