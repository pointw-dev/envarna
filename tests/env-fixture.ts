// @ts-ignore  // not sure why this is necessary ?!?
import dotenv from 'dotenv';
import { tmpdir } from 'os';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

export class EnvFixture {
    private originalEnv: NodeJS.ProcessEnv;
    private tempDir: string | null = null;
    private envFilePath: string | null = null;

    constructor() {
        this.originalEnv = { ...process.env };
    }

    setEnvVariable(key: string, value: string) {
        process.env[key] = value;
    }

    createDotenvFile(content: string) {
        this.tempDir = mkdtempSync(join(tmpdir(), 'envtest-'));
        this.envFilePath = join(this.tempDir, '.env');
        writeFileSync(this.envFilePath, content);
    }

    loadDotenv() {
        if (!this.envFilePath) throw new Error("No .env file created");
        dotenv.config({ path: this.envFilePath });
    }

    cleanup() {
        process.env = { ...this.originalEnv };
        if (this.tempDir) rmSync(this.tempDir, { recursive: true, force: true });
    }
}
