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
    return dir
}

export const PROJECT_ROOT = findProjectRoot(process.cwd());
export const DOTENV_PATH = path.resolve(PROJECT_ROOT, '.env');
