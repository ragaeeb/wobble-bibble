import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createChatModel, DEFAULT_MODEL, getModelFromEnv, type ModelConfig, NOVA_MODEL } from './models.js';

describe('models', () => {
    describe('DEFAULT_MODEL', () => {
        it('should have gemini as the default provider', () => {
            expect(DEFAULT_MODEL.provider).toEqual('gemini');
        });

        it('should use gemini-3-flash-preview as the default model', () => {
            expect(DEFAULT_MODEL.model).toEqual('gemini-3-flash-preview');
        });
    });

    describe('NOVA_MODEL', () => {
        it('should have nova as the provider', () => {
            expect(NOVA_MODEL.provider).toEqual('nova');
        });

        it('should use nova-2-pro as the model', () => {
            expect(NOVA_MODEL.model).toEqual('nova-2-pro');
        });
    });

    describe('getModelFromEnv', () => {
        let originalEnv: string | undefined;

        beforeEach(() => {
            originalEnv = process.env.LLM_PROVIDER;
        });

        afterEach(() => {
            if (originalEnv === undefined) {
                delete process.env.LLM_PROVIDER;
            } else {
                process.env.LLM_PROVIDER = originalEnv;
            }
        });

        it('should return DEFAULT_MODEL when LLM_PROVIDER is not set', () => {
            delete process.env.LLM_PROVIDER;
            const config = getModelFromEnv();
            expect(config).toEqual(DEFAULT_MODEL);
        });

        it('should return DEFAULT_MODEL when LLM_PROVIDER is gemini', () => {
            process.env.LLM_PROVIDER = 'gemini';
            const config = getModelFromEnv();
            expect(config).toEqual(DEFAULT_MODEL);
        });

        it('should return NOVA_MODEL when LLM_PROVIDER is nova', () => {
            process.env.LLM_PROVIDER = 'nova';
            const config = getModelFromEnv();
            expect(config).toEqual(NOVA_MODEL);
        });

        it('should return DEFAULT_MODEL for unknown provider values', () => {
            process.env.LLM_PROVIDER = 'unknown';
            const config = getModelFromEnv();
            expect(config).toEqual(DEFAULT_MODEL);
        });
    });

    describe('createChatModel', () => {
        it('should create a Gemini model for gemini provider', () => {
            const originalKey = process.env.GOOGLE_API_KEY;
            process.env.GOOGLE_API_KEY = 'test-key';
            try {
                const model = createChatModel(DEFAULT_MODEL);
                expect(model).toBeDefined();
                expect(model.constructor.name).toEqual('ChatGoogleGenerativeAI');
            } finally {
                if (originalKey === undefined) {
                    delete process.env.GOOGLE_API_KEY;
                } else {
                    process.env.GOOGLE_API_KEY = originalKey;
                }
            }
        });

        it('should create a ChatOpenAI model for nova provider', () => {
            const originalKey = process.env.NOVA_API_KEY;
            process.env.NOVA_API_KEY = 'test-key';

            try {
                const model = createChatModel(NOVA_MODEL);
                expect(model).toBeDefined();
                expect(model.constructor.name).toEqual('ChatOpenAI');
            } finally {
                if (originalKey === undefined) {
                    delete process.env.NOVA_API_KEY;
                } else {
                    process.env.NOVA_API_KEY = originalKey;
                }
            }
        });
    });
});
