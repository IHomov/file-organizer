import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";

export class Scanner extends EventEmitter {
  async scan(directoryPath) {
    this.emit("scan-start", { directory: directoryPath });
    let totalFiles = 0;
    let totalSize = 0;
    const fileList = [];
    const typesMap = new Map();
    const allItems = await fs.readdir(directoryPath, { recursive: true });

    for (const item of allItems) {
      const fullPath = path.join(directoryPath, item);
      let stats;

      try {
        stats = await fs.stat(fullPath);
      } catch (err) {
        console.error(`Error accessing ${fullPath}: ${err.message}`);
        continue;
      }

      if (stats.isFile()) {
        const ext = path.extname(fullPath).toLowerCase() || "no_extension";
        const fileData = {
          path: fullPath,
          name: path.basename(fullPath),
          ext: ext,
          size: stats.size,
          mtime: stats.mtime,
        };
        totalFiles++;
        totalSize += stats.size;
        fileList.push(fileData);

        if (!typesMap.has(ext)) {
          typesMap.set(ext, { count: 0, totalSize: 0 });
        }
        const typeData = typesMap.get(ext);
        typeData.count++;
        typeData.totalSize += stats.size;

        this.emit("file-found", { file: fileData, currentCount: totalFiles });
      }
    }

    const now = new Date();
    let last7Days = 0;
    let last30Days = 0;
    let olderThan90 = 0;
    let oldestFile = null;

    // Fixed: using for...of to iterate over array items instead of indices
    for (const file of fileList) {
      const ageInDays = (now - file.mtime) / (1000 * 60 * 60 * 24);
      
      // Categorizing file age based on specifications
      if (ageInDays <= 7) {
        last7Days++;
      } else if (ageInDays <= 30) {
        last30Days++;
      } else if (ageInDays > 90) {
        olderThan90++;
      }

      if (!oldestFile || file.mtime < oldestFile.mtime) {
        oldestFile = file;
      }
    }

    const largestFiles = [...fileList]
      .sort((a, b) => b.size - a.size)
      .slice(0, 3);

    const statistics = {
      totalFiles,
      totalSize,
      types: Object.fromEntries(typesMap),
      age: { last7Days, last30Days, olderThan90 },
      largestFiles,
      oldestFile: oldestFile
        ? {
            name: oldestFile.name,
            daysAgo: Math.floor(
              (now - oldestFile.mtime) / (1000 * 60 * 60 * 24),
            ),
          }
        : null,
    };

    this.emit("scan-complete", statistics);
  }
}