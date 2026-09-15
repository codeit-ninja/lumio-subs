/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');

		users.fields.add(
			new TextField({
				name: 'stripeCustomerId',
				required: false,
				max: 255
			}),
			new TextField({
				name: 'apiKey',
				required: false,
				min: 32,
				max: 64
			})
		);
		app.save(users);

		const userRecords = app.findAllRecords(users);
		for (const record of userRecords) {
			if (!record || record.getString('apiKey')) continue;
			record.set('apiKey', $security.randomString(40));
			app.save(record);
		}

		users.indexes.push('CREATE UNIQUE INDEX idx_users_api_key ON users (apiKey)');
		app.save(users);

		const plans = new Collection({
			type: 'base',
			name: 'plans',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [
				{
					type: 'text',
					name: 'name',
					required: true,
					max: 120
				},
				{
					type: 'text',
					name: 'description',
					required: false,
					max: 1000
				},
				{
					type: 'json',
					name: 'features',
					required: false
				},
				{
					type: 'number',
					name: 'priceCents',
					required: true,
					onlyInt: true,
					min: 0
				},
				{
					type: 'text',
					name: 'currency',
					required: true,
					max: 8
				},
				{
					type: 'select',
					name: 'interval',
					required: true,
					maxSelect: 1,
					values: ['month', 'year']
				},
				{
					type: 'text',
					name: 'stripePriceId',
					required: true,
					max: 255
				},
				{
					type: 'bool',
					name: 'active',
					required: false
				},
				{
					type: 'bool',
					name: 'highlighted',
					required: false
				},
				{
					type: 'number',
					name: 'sortOrder',
					required: false,
					onlyInt: true
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
				'CREATE UNIQUE INDEX idx_plans_stripe_price ON plans (stripePriceId)',
				'CREATE INDEX idx_plans_active_sort ON plans (active, sortOrder)'
			]
		});
		app.save(plans);

		const subscriptions = new Collection({
			type: 'base',
			name: 'subscriptions',
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
					type: 'relation',
					name: 'plan',
					required: true,
					collectionId: plans.id,
					cascadeDelete: false,
					maxSelect: 1
				},
				{
					type: 'text',
					name: 'stripeCustomerId',
					required: true,
					max: 255
				},
				{
					type: 'text',
					name: 'stripeSubscriptionId',
					required: true,
					max: 255
				},
				{
					type: 'select',
					name: 'status',
					required: true,
					maxSelect: 1,
					values: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid']
				},
				{
					type: 'date',
					name: 'currentPeriodEnd',
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
				'CREATE UNIQUE INDEX idx_subscriptions_stripe_sub ON subscriptions (stripeSubscriptionId)',
				'CREATE INDEX idx_subscriptions_user_status ON subscriptions (user, status)',
				'CREATE INDEX idx_subscriptions_customer ON subscriptions (stripeCustomerId)'
			]
		});
		app.save(subscriptions);
	},
	(app) => {
		try {
			app.deleteCollection(app.findCollectionByNameOrId('subscriptions'));
		} catch {
			/* ignore */
		}
		try {
			app.deleteCollection(app.findCollectionByNameOrId('plans'));
		} catch {
			/* ignore */
		}

		const users = app.findCollectionByNameOrId('users');
		const stripeCustomerId = users.fields.getByName('stripeCustomerId');
		if (stripeCustomerId) users.fields.removeById(stripeCustomerId.id);
		const apiKey = users.fields.getByName('apiKey');
		if (apiKey) users.fields.removeById(apiKey.id);
		users.indexes = users.indexes.filter((idx) => !idx.includes('idx_users_api_key'));
		app.save(users);
	}
);
