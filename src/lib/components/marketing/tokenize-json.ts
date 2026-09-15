export type JsonTokenKind = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct' | 'text';

export type JsonToken = {
	kind: JsonTokenKind;
	value: string;
};

export function tokenizeJson(source: string): JsonToken[] {
	const tokens: JsonToken[] = [];
	const pattern =
		/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}]|\[|\]|,/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(source)) !== null) {
		if (match.index > lastIndex) {
			tokens.push({ kind: 'text', value: source.slice(lastIndex, match.index) });
		}

		const [full, stringLiteral, colon, literal] = match;

		if (stringLiteral !== undefined) {
			tokens.push({ kind: colon !== undefined ? 'key' : 'string', value: stringLiteral });
			if (colon !== undefined) {
				tokens.push({ kind: 'punct', value: colon });
			}
		} else if (literal === 'true' || literal === 'false') {
			tokens.push({ kind: 'boolean', value: literal });
		} else if (literal === 'null') {
			tokens.push({ kind: 'null', value: literal });
		} else if (full === '{' || full === '}' || full === '[' || full === ']' || full === ',') {
			tokens.push({ kind: 'punct', value: full });
		} else {
			tokens.push({ kind: 'number', value: full });
		}

		lastIndex = match.index + full.length;
	}

	if (lastIndex < source.length) {
		tokens.push({ kind: 'text', value: source.slice(lastIndex) });
	}

	return tokens;
}

export const jsonTokenClass: Record<Exclude<JsonTokenKind, 'text'>, string> = {
	key: 'json-key',
	string: 'json-string',
	number: 'json-number',
	boolean: 'json-boolean',
	null: 'json-null',
	punct: 'json-punct'
};
