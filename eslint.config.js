import path from 'node:path';

import js from '@eslint/js';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		ignores: [
			'.cursor/**',
			'pocketbase/pb_data/**',
			'pocketbase/pb_hooks/**',
			'pocketbase/pb_migrations/**',
			'src/lib/pocketbase/types.ts',
			'src/lib/pocketbase/zod.ts'
		]
	},
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					fixStyle: 'separate-type-imports',
					disallowTypeAnnotations: false
				}
			],
			'@typescript-eslint/no-import-type-side-effects': 'error',
			'no-restricted-syntax': [
				'error',
				{
					selector: 'ImportDeclaration[importKind=value] > ImportSpecifier[importKind=type]',
					message: 'Use a separate `import type { … }` instead of inline `type` in a value import.'
				}
			],
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	}
);
