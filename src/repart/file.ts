import { readFileSync} from 'fs';
import { join} from 'path';

export function resolve(filePath: string, folder?: string){
    return join(folder ?? process.cwd(), filePath);
}
export function readFile(filePath: string, folder?: string){
    return readFileSync(resolve(filePath, folder), 'utf-8');
}