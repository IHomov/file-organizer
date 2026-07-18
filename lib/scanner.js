import {EventEmitter} from 'events';
import fs from 'fs/promises';
import path from 'path';

export class Scanner extends EventEmitter {
    
    async scan(directoryPath) {
        this.emit('scan-start', {directory: directoryPath});
        let totalFiles = 0;
        let totalSize = 0;
        const alltimes = await fs.readdir(directoryPath, {recursive: true});

        for(const item of alltimes) {
            const fullPath = path.join(directoryPath, item);
            const stats = await fs.stat(fullPath);
            
            if (stats.isFile()) {
                   const fileData = {
                    path: fullPath,
                    name: path.basename(fullPath),
                    ext: path.extname(fullPath).toLowerCase(),
                    size: stats.size,
                    mtime: stats.mtime
                };
                totalFiles++;
                totalSize += stats.size;

                this.emit('file-found', {file: fileData});
                }
        }
        this.emit('scan-complete', {
            totalFiles: totalFiles,
            totalSize: totalSize
        });
    }
}