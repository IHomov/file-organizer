import {EventEmitter} from 'events';
import fs from 'fs';
import crypto from 'crypto';

export class DuplicateFinder extends EventEmitter {
    calculateHash(filePath) {
        return new Promise(resolve, reject => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', (chunk) => hash.update(chunk));
            stream.on('end',() => resolve(hash.digest('hex')));
            stream.on('error', reject);
            });

    
}    
    async findDuplicates(fileList) {
        const hashMap = new Map();
        let processCount = 0;

        for (const file of fileList) {
            try {
                const hash = await this.calculateHash(file.path);
                if (!hashMap.has(hash)) {
                    hashMap.set(hash, []);
                }
                hashMap.get(hash).push(file);
            } catch (err) {
                console.error(`Error calculating hash for ${file.path}: ${err.message}`);
            }

            processCount++;
            this.emit('file-processed', { currentCount: processCount });
        }

        const duplicateGroups = [];
          let totalWastedSpace = 0;
          for (const [hash, files] of hashMap.entries()) {
            if (files.length > 1) {
                const copiesCount = files.length;
                const singleFileSize = files[0].size;
                const wastedSpace = singleFileSize * (copiesCount - 1);
                totalWastedSpace += wastedSpace;
                duplicateGroups.push({ 
                    hash,
                    copiesCount,
                    singleFileSize,
                    wastedSpace,
                files: files.map(f => f.path) 
            });
           
        }

        }




this.emit('duplicates-found', { duplicateGroups, totalWastedSpace });
}
}
