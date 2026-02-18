/** @type {import('jest').Config} */
export default {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	roots: ["<rootDir>/test"],
	moduleNameMapper: {
		"^obsidian$": "<rootDir>/test/__mocks__/obsidian.ts",
	},
	transform: {
		"^.+\\.ts$": ["ts-jest", {
			useESM: true,
			tsconfig: {
				baseUrl: "src",
				module: "ESNext",
				moduleResolution: "node",
				target: "ES6",
				strict: true,
				allowSyntheticDefaultImports: true,
				isolatedModules: true,
				noUncheckedIndexedAccess: true,
				lib: ["DOM", "ES5", "ES6", "ES7"],
			},
		}],
	},
	extensionsToTreatAsEsm: [".ts"],
};
