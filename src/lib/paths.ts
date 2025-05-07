import * as fs from 'fs';
import * as path from 'path';

function findProjectRoot(startDir: string): string {
    let dir = startDir;
    while (dir !== path.parse(dir).root) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    throw new Error('package.json not found in any parent directory.');
}

export const PROJECT_ROOT = findProjectRoot(process.cwd());
export const SETTINGS_DIR = path.resolve(PROJECT_ROOT, 'src/settings');
export const DOTENV_PATH = path.resolve(PROJECT_ROOT, '.env');
