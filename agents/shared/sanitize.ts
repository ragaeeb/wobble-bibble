/**
 * Input sanitization for prompt injection defense
 */
import type { SanitizedInput } from './types.js';

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /system:\s*/gi,
    /assistant:\s*/gi,
    /\bforget\s+(everything|all|previous)/gi,
    /you\s+are\s+now\s+(a|an)/gi,
    /new\s+instructions:/gi,
    /override\s+(system|instructions)/gi,
    /disregard\s+(above|previous|all)/gi,
];

const MAX_CONTENT_LENGTH = 50000; // 50k characters max
const MAX_LINE_LENGTH = 10000; // 10k characters per line

/**
 * Detect potential prompt injection patterns
 * Returns a risk score from 0-1
 */
export function detectInjectionPatterns(content: string): number {
    let matchCount = 0;
    for (const pattern of INJECTION_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
            matchCount += matches.length;
        }
    }
    // Normalize to 0-1 range, cap at 1
    return Math.min(matchCount / 5, 1);
}

/**
 * Sanitize raw input content for safe LLM consumption
 */
export function sanitize(raw: string, source = 'unknown'): SanitizedInput {
    const originalLength = raw.length;
    const flags: string[] = [];

    // Truncate if too long
    let content = raw;
    if (content.length > MAX_CONTENT_LENGTH) {
        content = content.slice(0, MAX_CONTENT_LENGTH);
        flags.push('TRUNCATED');
    }

    // Truncate individual lines
    content = content
        .split('\n')
        .map((line) => {
            if (line.length > MAX_LINE_LENGTH) {
                flags.push('LINE_TRUNCATED');
                return `${line.slice(0, MAX_LINE_LENGTH)}...[truncated]`;
            }
            return line;
        })
        .join('\n');

    // Filter injection patterns (replace with [FILTERED])
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(content)) {
            flags.push('INJECTION_FILTERED');
            content = content.replace(pattern, '[FILTERED]');
        }
    }

    // Strip potential code execution markers
    content = content
        .replace(/```[\s\S]*?```/g, '[CODE_BLOCK_REMOVED]')
        .replace(/<script[\s\S]*?<\/script>/gi, '[SCRIPT_REMOVED]')
        .replace(/<!--[\s\S]*?-->/g, '[COMMENT_REMOVED]');

    const riskScore = detectInjectionPatterns(raw); // Score on original

    if (riskScore > 0.5) {
        flags.push('HIGH_RISK');
    }

    return {
        content,
        metadata: {
            flags,
            originalLength,
            riskScore,
            source,
        },
    };
}

/**
 * Validate JSON against expected fields only
 * Strips any unexpected keys
 */
export function sanitizeJson<T extends object>(obj: unknown, allowedKeys: (keyof T)[]): Partial<T> {
    if (typeof obj !== 'object' || obj === null) {
        return {};
    }

    const result: Partial<T> = {};
    for (const key of allowedKeys) {
        if (key in obj) {
            result[key] = (obj as T)[key];
        }
    }
    return result;
}
