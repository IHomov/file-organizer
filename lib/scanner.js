import {EventEmitter} from 'events';
import fs from 'fs/promises';
import path from 'path';

export class Scanner extends EventEmitter {
    
    async scan(directoryPath) {
        this.emit('scan-start', {directory: directoryPath});

        const alltimes = await fs.readdir(directoryPath, {recursive: true});

        for(const item of alltimes) {
            const fullPAth = path.join(directoryPAth, item);
            const stats = await fs.stat(fullPAth);
            
            if (stats.isFile()) {

                const FileData ={
                    path: fullPAth,
                    name: path.basename(fullPAth),
                    ext: path.extname(fullPAth).toLowerCase(),
                    size: stats.size,
                    mtime: stats.mtime
                };
                this.emit('file-found', {file: FileData});
                }
        }
        this.emit('scan-complete', {directory: directoryPath});
    }
}