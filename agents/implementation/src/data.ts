/**
 * Data Access for Implementation Agent
 * Abstracts FS and Git operations
 */
import fs from 'fs/promises';
import path from 'path';

export interface FileSystem {
    writeFile(path: string, content: string): Promise<void>;
    readFile(path: string): Promise<string>;
}

export interface GitProvider {
    createBranch(branchName: string): Promise<void>;
    checkout(branchName: string): Promise<void>;
    commit(message: string): Promise<void>;
    push(branchName: string): Promise<void>;
    createPullRequest(title: string, body: string, branch: string): Promise<{ url: string }>;
}

/**
 * P0: Validate that a file path is within the current working directory.
 * Prevents path traversal attacks from LLM-generated file paths.
 */
function validatePathWithinCwd(filePath: string): string {
    const cwd = process.cwd();
    const resolved = path.resolve(cwd, filePath);
    const relative = path.relative(cwd, resolved);
    
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Path traversal detected: ${filePath} resolves outside working directory`);
    }
    
    return resolved;
}

// Default FS implementation with path traversal protection
export const realFileSystem: FileSystem = {
    writeFile: async (filePath, content) => {
        const fullPath = validatePathWithinCwd(filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
    },
    readFile: async (filePath) => {
        const fullPath = validatePathWithinCwd(filePath);
        return fs.readFile(fullPath, 'utf-8');
    }
};

// Mock Git implementation (placeholder for now)
export const mockGitProvider: GitProvider = {
    createBranch: async () => {},
    checkout: async () => {},
    commit: async () => console.log('Git commit mock'),
    push: async () => console.log('Git push mock'),
    createPullRequest: async (title, body, branch) => ({
        url: `https://github.com/org/repo/pull/${Math.floor(Math.random() * 1000)}`
    })
};

