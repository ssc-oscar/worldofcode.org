import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
    {
        ignores: ['dist/*']
    },
    {
        files: ['vite.config.ts'],  // only target vite.config.ts
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            },
            globals: {
                ...globals.node,
            }
        }
    },
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            '@typescript-eslint': tseslint,
            'react-refresh': reactRefresh,
            'react-hooks': reactHooks
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            },
            globals: {
                ...globals.browser,  // This adds browser globals like console, navigator, etc.
                ...globals.es2021,    // This adds ES2021 globals
                React: true,  // Add React to globals
                JSX: true    // Add JSX to globals if needed
            }
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...tseslint.configs.recommended.rules,
            ...prettier.rules,
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react/jsx-no-target-blank': 'off',
            'react/prop-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true }
            ]
        }
    }
];