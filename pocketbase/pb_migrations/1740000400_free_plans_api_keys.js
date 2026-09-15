/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		const plans = app.findCollectionByNameOrId('plans');
		const subscriptions = app.findCollectionByNameOrId('subscriptions');

		// --- plans: slug + limits; stripePriceId optional ---
		plans.fields.add(
			new TextField({
				name: 'slug',
				required: true,
				max: 64
			}),
			new NumberField({
				name: 'limitPerSecond',
				required: true,
				onlyInt: true,
				min: 1
			}),
			new NumberField({
				name: 'limitPerMinute',
				required: true,
				onlyInt: true,
				min: 1
			}),
			new NumberField({
				name: 'limitPerHour',
				required: true,
				onlyInt: true,
				min: 1
			}),
			new NumberField({
				name: 'limitPerDay',
				required: true,
				onlyInt: true,
				min: 1
			}),
			new NumberField({
				name: 'limitPerMonth',
				required: true,
				onlyInt: true,
				min: 1
			})
		);

		const stripePriceId = plans.fields.getByName('stripePriceId');
		if (stripePriceId) {
			stripePriceId.required = false;
		}

		const priceCentsField = plans.fields.getByName('priceCents');
		if (priceCentsField) {
			priceCentsField.required = false;
		}

		plans.indexes = plans.indexes.filter((idx) => !idx.includes('idx_plans_stripe_price'));
		plans.indexes.push('CREATE UNIQUE INDEX idx_plans_slug ON plans (slug)');
		app.save(plans);

		const seedPlans = [
			{
				slug: 'free',
				name: 'Free',
				description: 'Get started with limited daily API access.',
				features: [
					'50 API requests per day',
					'1 request per second',
					'Search + subtitle downloads',
					'Community support'
				],
				priceCents: 0,
				currency: 'eur',
				interval: 'month',
				stripePriceId: '',
				active: true,
				highlighted: false,
				sortOrder: 0,
				limitPerSecond: 1,
				limitPerMinute: 10,
				limitPerHour: 30,
				limitPerDay: 50,
				limitPerMonth: 500
			},
			{
				slug: 'start',
				name: 'Start',
				description: 'For small apps and side projects.',
				features: [
					'5,000 API requests per day',
					'5 requests per second',
					'Search + subtitle downloads',
					'Email support'
				],
				priceCents: 900,
				currency: 'eur',
				interval: 'month',
				stripePriceId: '',
				active: true,
				highlighted: false,
				sortOrder: 10,
				limitPerSecond: 5,
				limitPerMinute: 60,
				limitPerHour: 500,
				limitPerDay: 5000,
				limitPerMonth: 50000
			},
			{
				slug: 'pro',
				name: 'Pro',
				description: 'Production workloads with headroom.',
				features: [
					'25,000 API requests per day',
					'15 requests per second',
					'Search + subtitle downloads',
					'Priority support'
				],
				priceCents: 2900,
				currency: 'eur',
				interval: 'month',
				stripePriceId: '',
				active: true,
				highlighted: true,
				sortOrder: 20,
				limitPerSecond: 15,
				limitPerMinute: 200,
				limitPerHour: 2000,
				limitPerDay: 25000,
				limitPerMonth: 250000
			},
			{
				slug: 'pro_plus',
				name: 'Pro+',
				description: 'High-volume API access.',
				features: [
					'100,000 API requests per day',
					'50 requests per second',
					'Search + subtitle downloads',
					'Priority support'
				],
				priceCents: 7900,
				currency: 'eur',
				interval: 'month',
				stripePriceId: '',
				active: true,
				highlighted: false,
				sortOrder: 30,
				limitPerSecond: 50,
				limitPerMinute: 600,
				limitPerHour: 10000,
				limitPerDay: 100000,
				limitPerMonth: 1000000
			}
		];

		for (const plan of seedPlans) {
			const record = new Record(plans);
			record.set('slug', plan.slug);
			record.set('name', plan.name);
			record.set('description', plan.description);
			record.set('features', plan.features);
			record.set('priceCents', plan.priceCents);
			record.set('currency', plan.currency);
			record.set('interval', plan.interval);
			record.set('stripePriceId', plan.stripePriceId);
			record.set('active', plan.active);
			record.set('highlighted', plan.highlighted);
			record.set('sortOrder', plan.sortOrder);
			record.set('limitPerSecond', plan.limitPerSecond);
			record.set('limitPerMinute', plan.limitPerMinute);
			record.set('limitPerHour', plan.limitPerHour);
			record.set('limitPerDay', plan.limitPerDay);
			record.set('limitPerMonth', plan.limitPerMonth);
			app.save(record);
		}

		// --- subscriptions: Stripe ids optional ---
		const subCustomer = subscriptions.fields.getByName('stripeCustomerId');
		if (subCustomer) subCustomer.required = false;
		const subStripeId = subscriptions.fields.getByName('stripeSubscriptionId');
		if (subStripeId) subStripeId.required = false;

		subscriptions.indexes = subscriptions.indexes.filter(
			(idx) =>
				!idx.includes('idx_subscriptions_stripe_sub') && !idx.includes('idx_subscriptions_customer')
		);
		subscriptions.indexes.push(
			'CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions (stripeSubscriptionId)'
		);
		subscriptions.indexes.push(
			'CREATE INDEX idx_subscriptions_customer ON subscriptions (stripeCustomerId)'
		);
		app.save(subscriptions);

		// --- api_keys collection ---
		const apiKeys = new Collection({
			type: 'base',
			name: 'api_keys',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{
					type: 'relation',
					name: 'user',
					required: true,
					collectionId: users.id,
					cascadeDelete: true,
					maxSelect: 1
				},
				{
					type: 'text',
					name: 'name',
					required: true,
					max: 120
				},
				{
					type: 'text',
					name: 'keyPrefix',
					required: true,
					max: 16
				},
				{
					type: 'text',
					name: 'keyHash',
					required: true,
					max: 128
				},
				{
					type: 'date',
					name: 'expiresAt',
					required: false
				},
				{
					type: 'date',
					name: 'revokedAt',
					required: false
				},
				{
					type: 'date',
					name: 'lastUsedAt',
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
				'CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys (keyHash)',
				'CREATE INDEX idx_api_keys_user ON api_keys (user, revokedAt)'
			]
		});
		app.save(apiKeys);

		// Migrate existing users.apiKey → api_keys, then drop field
		const freePlan = app.findFirstRecordByFilter('plans', 'slug = "free"');
		const userRecords = app.findAllRecords(users);
		for (const user of userRecords) {
			if (!user) continue;

			const existingKey = user.getString('apiKey');
			if (existingKey) {
				const keyRecord = new Record(apiKeys);
				keyRecord.set('user', user.id);
				keyRecord.set('name', 'Migrated key');
				keyRecord.set('keyPrefix', existingKey.slice(0, 8));
				keyRecord.set('keyHash', $security.sha256(existingKey));
				app.save(keyRecord);
			}

			if (freePlan) {
				const existingFree = app.findRecordsByFilter(
					'subscriptions',
					`user = "${user.id}"`,
					'-created',
					1,
					0
				);
				if (!existingFree || existingFree.length === 0) {
					const sub = new Record(subscriptions);
					sub.set('user', user.id);
					sub.set('plan', freePlan.id);
					sub.set('status', 'active');
					sub.set('stripeCustomerId', '');
					sub.set('stripeSubscriptionId', '');
					app.save(sub);
				}
			}
		}

		const apiKeyField = users.fields.getByName('apiKey');
		if (apiKeyField) users.fields.removeById(apiKeyField.id);
		users.indexes = users.indexes.filter((idx) => !idx.includes('idx_users_api_key'));
		app.save(users);
	},
	(app) => {
		try {
			app.deleteCollection(app.findCollectionByNameOrId('api_keys'));
		} catch {
			/* ignore */
		}

		const users = app.findCollectionByNameOrId('users');
		if (!users.fields.getByName('apiKey')) {
			users.fields.add(
				new TextField({
					name: 'apiKey',
					required: false,
					min: 32,
					max: 64
				})
			);
			users.indexes.push('CREATE UNIQUE INDEX idx_users_api_key ON users (apiKey)');
			app.save(users);
		}

		const plans = app.findCollectionByNameOrId('plans');
		for (const name of [
			'slug',
			'limitPerSecond',
			'limitPerMinute',
			'limitPerHour',
			'limitPerDay',
			'limitPerMonth'
		]) {
			const field = plans.fields.getByName(name);
			if (field) plans.fields.removeById(field.id);
		}
		const stripePriceId = plans.fields.getByName('stripePriceId');
		if (stripePriceId) stripePriceId.required = true;
		plans.indexes = plans.indexes.filter((idx) => !idx.includes('idx_plans_slug'));
		plans.indexes.push('CREATE UNIQUE INDEX idx_plans_stripe_price ON plans (stripePriceId)');
		app.save(plans);

		const seedSlugs = ['free', 'start', 'pro', 'pro_plus'];
		for (const slug of seedSlugs) {
			try {
				const record = app.findFirstRecordByFilter('plans', `slug = "${slug}"`);
				if (record) app.delete(record);
			} catch {
				/* ignore */
			}
		}

		const subscriptions = app.findCollectionByNameOrId('subscriptions');
		const subCustomer = subscriptions.fields.getByName('stripeCustomerId');
		if (subCustomer) subCustomer.required = true;
		const subStripeId = subscriptions.fields.getByName('stripeSubscriptionId');
		if (subStripeId) subStripeId.required = true;
		app.save(subscriptions);
	}
);
