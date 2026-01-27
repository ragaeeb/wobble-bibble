import { describe, expect, it } from 'bun:test';
import { parseLLMJson } from '.';

describe('Gemini Flat Format', () => {
    it('should correctly parse a flat dump', () => {
        const flatContent = {
            model: 'gemini-1.5-pro',
            prompt: 'The user prompt.',
            reasoning: 'Extracted thoughts/reasoning.',
            response: 'The extracted response.',
        };

        const result = parseLLMJson(flatContent);
        expect(result.response).toBe('The extracted response.');
        expect(result.prompt).toBe('The user prompt.');
        expect(result.thoughts).toBe('Extracted thoughts/reasoning.');
        expect(result.model).toBe('gemini-1.5-pro');
    });

    it('should handle optional reasoning and model', () => {
        const flatContent = {
            prompt: 'Prompt text.',
            response: 'Response text.',
        };

        const result = parseLLMJson(flatContent);
        expect(result.response).toBe('Response text.');
        expect(result.prompt).toBe('Prompt text.');
        expect(result.thoughts).toBeUndefined();
        expect(result.model).toBeUndefined();
    });
});

describe('Mapping Format (ChatGPT / Gemini Nested)', () => {
    it('should extract the latest assistant message and thoughts', () => {
        const mappingContent = {
            mapping: {
                'node-assistant': {
                    children: [],
                    id: 'node-assistant',
                    message: {
                        author: { role: 'assistant' },
                        content: {
                            content_type: 'text',
                            parts: ['The explanation.'],
                            thoughts: [{ content: 'Thinking process...', summary: 'Step 1' }],
                        },
                        create_time: 2000,
                        id: 'msg-assistant',
                        status: 'finished_successfully',
                    },
                    parent: 'node-user',
                },
                'node-root': {
                    children: ['node-user'],
                    id: 'node-root',
                },
                'node-user': {
                    children: ['node-assistant'],
                    id: 'node-user',
                    message: {
                        author: { role: 'user' },
                        content: { content_type: 'text', parts: ['Explain something.'] },
                        create_time: 1000,
                        id: 'msg-user',
                        status: 'finished_successfully',
                    },
                    parent: 'node-root',
                },
            },
        };

        const result = parseLLMJson(mappingContent);
        expect(result.response).toBe('The explanation.');
        expect(result.prompt).toBe('Explain something.');
        expect(result.thoughts).toBe('Thinking process...');
    });

    it('should pick the latest assistant message based on create_time', () => {
        const mappingContent = {
            mapping: {
                node1: {
                    children: [],
                    id: 'node1',
                    message: {
                        author: { role: 'assistant' },
                        content: { content_type: 'text', parts: ['Old response'] },
                        create_time: 1000,
                        id: 'msg1',
                        status: 'finished_successfully',
                    },
                },
                node2: {
                    children: [],
                    id: 'node2',
                    message: {
                        author: { role: 'assistant' },
                        content: { content_type: 'text', parts: ['New response'] },
                        create_time: 2000,
                        id: 'msg2',
                        status: 'finished_successfully',
                    },
                },
            },
        };

        const result = parseLLMJson(mappingContent);
        expect(result.response).toBe('New response');
    });

    it('should handle multiple message parts', () => {
        const mappingContent = {
            mapping: {
                node: {
                    children: [],
                    id: 'node',
                    message: {
                        author: { role: 'assistant' },
                        content: { content_type: 'text', parts: ['Part 1', 'Part 2'] },
                        create_time: 1000,
                        id: 'msg',
                        status: 'finished_successfully',
                    },
                },
            },
        };

        const result = parseLLMJson(mappingContent);
        expect(result.response).toBe('Part 1\nPart 2');
    });
});

describe('Chain Building Logic', () => {
    it('should use current_node if explicitly provided', () => {
        const dump = {
            current_node: 'target_node',
            mapping: {
                later_node: {
                    children: [],
                    id: 'later_node',
                    message: {
                        author: { role: 'assistant' },
                        content: { content_type: 'text', parts: ['Later (ignored)'] },
                        create_time: 999999,
                        id: 'msg_later',
                        status: 'finished_successfully',
                    },
                },
                target_node: {
                    children: [],
                    id: 'target_node',
                    message: {
                        author: { role: 'assistant' },
                        content: { content_type: 'text', parts: ['Explicit target'] },
                        id: 'msg_target',
                        status: 'finished_successfully',
                    },
                },
            },
        };
        const result = parseLLMJson(dump);
        expect(result.response).toBe('Explicit target');
    });

    it('should walk up parents to build the chain', () => {
        const dump = {
            current_node: 'leaf',
            mapping: {
                leaf: {
                    children: [],
                    id: 'leaf',
                    message: {
                        author: { role: 'user' },
                        content: { content_type: 'text', parts: ['P2'] },
                        id: 'm3',
                        status: 'finished_successfully',
                    },
                    parent: 'mid',
                },
                mid: {
                    children: ['leaf'],
                    id: 'mid',
                    message: {
                        author: { role: 'assistant' },
                        content: { content_type: 'text', parts: ['R1'] },
                        id: 'm2',
                        status: 'finished_successfully',
                    },
                    parent: 'root',
                },
                root: {
                    children: ['mid'],
                    id: 'root',
                    message: {
                        author: { role: 'user' },
                        content: { content_type: 'text', parts: ['P1'] },
                        id: 'm1',
                        status: 'finished_successfully',
                    },
                },
            },
        };
        const result = parseLLMJson(dump);
        expect(result.prompt).toBe('P2');
        expect(result.response).toBe('R1');
    });

    it('should skip nodes without messages', () => {
        const dump = {
            current_node: 'leaf',
            mapping: {
                empty: { children: ['leaf'], id: 'empty', parent: 'root' },
                leaf: {
                    children: [],
                    id: 'leaf',
                    message: {
                        author: { role: 'assistant' },
                        content: { content_type: 'text', parts: ['R1'] },
                        id: 'm3',
                        status: 'finished_successfully',
                    },
                    parent: 'empty',
                },
                root: {
                    children: ['empty'],
                    id: 'root',
                    message: {
                        author: { role: 'user' },
                        content: { content_type: 'text', parts: ['P1'] },
                        id: 'm1',
                        status: 'finished_successfully',
                    },
                },
            },
        };
        const result = parseLLMJson(dump);
        expect(result.response).toBe('R1');
        expect(result.prompt).toBe('P1');
    });
});

describe('Error Handling', () => {
    it('should throw for non-object input', () => {
        expect(() => parseLLMJson('not a json')).toThrow(/expected an object/);
    });

    it('should throw for null input', () => {
        expect(() => parseLLMJson(null)).toThrow(/expected an object/);
    });

    it('should throw for unrecognized formats', () => {
        expect(() => parseLLMJson({ foo: 'bar' })).toThrow(/Unrecognized LLM JSON format/);
    });
});
