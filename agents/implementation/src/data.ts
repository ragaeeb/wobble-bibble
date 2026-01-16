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

// Default FS implementation
export const realFileSystem: FileSystem = {
    writeFile: async (filePath, content) => {
        const fullPath = path.resolve(process.cwd(), filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
    },
    readFile: async (filePath) => {
        const fullPath = path.resolve(process.cwd(), filePath);
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
