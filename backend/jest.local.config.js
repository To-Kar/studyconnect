module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    verbose: true,
    testTimeout: 30000,
    // Explicitly remove globalSetup/Teardown to avoid Docker dependencies
    globalSetup: undefined,
    globalTeardown: undefined,
};
