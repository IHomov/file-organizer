import { EventEmitter } from 'events';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';

const STREAM_THRESHOLD = 10 * 1024 * 1024; // 10 MB

export class Organizer extends EventEmitter {
  // Переносимо константу безпосередньо в статичне поле класу
  static CATEGORIES = {
    Documents: ['.pdf', '.docx', '.doc', '.txt', '.md', '.xlsx', '.pptx'],
    Images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'],
    Archives: ['.zip', '.rar', '.tar', '.gz', '.7z'],
    Code: ['.js', '.py', '.java', '.cpp', '.html', '.css', '.json'],
    Videos: ['.mp4', '.avi', '.mkv', '.mov', '.webm'],
    Other: []
  };

  getCategory(ext) {
    for (const [category, extensions] of Object.entries(Organizer.CATEGORIES)) {
      if (extensions.includes(ext.toLowerCase())) {
        return category;
      }
    }
    return 'Other';
  }

  async getUniqueTargetPath(targetDir, category, fileName) {
    const destDir = path.join(targetDir, category);
    let targetPath = path.join(destDir, fileName);
    
    try {
      await fsPromises.access(targetPath);
      
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      let counter = 1;

      while (true) {
        const newName = `${baseName}(${counter})${ext}`;
        targetPath = path.join(destDir, newName);
        try {
          await fsPromises.access(targetPath);
          counter++;
        } catch {
          break;
        }
      }
    } catch {
      // Файл не існує, шлях унікальний
    }

    return targetPath;
  }

  async copySingleFile(sourcePath, targetPath, size) {
    if (size >= STREAM_THRESHOLD) {
      await pipeline(
        fs.createReadStream(sourcePath),
        fs.createWriteStream(targetPath)
      );
    } else {
      await fsPromises.copyFile(sourcePath, targetPath);
    }
  }

  async organize(fileList, targetDir) {
    // Створюємо папки, звертаючись через Organizer.CATEGORIES
    for (const category of Object.keys(Organizer.CATEGORIES)) {
      await fsPromises.mkdir(path.join(targetDir, category), { recursive: true });
    }

    const stats = {};
    for (const category of Object.keys(Organizer.CATEGORIES)) {
      stats[category] = { count: 0, path: `${category}/` };
    }

    let processedCount = 0;
    let totalCopiedSize = 0;

    for (const file of fileList) {
      const category = this.getCategory(file.ext);
      const targetPath = await this.getUniqueTargetPath(targetDir, category, file.name);

      this.emit('copy-start', { file });

      try {
        await this.copySingleFile(file.path, targetPath, file.size);
        stats[category].count++;
        totalCopiedSize += file.size;
        this.emit('copy-complete', { file, currentCount: ++processedCount });
      } catch (err) {
        this.emit('copy-error', { file, error: err.message });
      }
    }

    return {
      stats,
      totalFiles: processedCount,
      totalSize: totalCopiedSize
    };
  }
}