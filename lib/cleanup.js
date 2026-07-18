import { EventEmitter } from "events";
import fsPromises from "fs/promises";

export class Cleanup extends EventEmitter {
  async runCleanup(fileList, thresholdDays, confirmDelete = false) {
    const filesToDelete = [];

    let totalSize = 0;
    for (const file of fileList) {
      const fileAgeMs = Date.now() - file.mtime.getTime();
      const daysOld = Math.floor(fileAgeMs / (1000 * 60 * 60 * 24));

      if (daysOld > thresholdDays) {
        const fileData = {
          ...file,
          daysOld,
          formattedDate: file.mtime.toISOString().split("T")[0],
        };
        filesToDelete.push(fileData);
        totalSize += file.size;

        this.emit("file-found", { file: fileData });
      }
    }
    let deletedCount = 0;
    let freedSpace = 0;

    if (confirmDelete && filesToDelete.length > 0) {
      for (const file of filesToDelete) {
        try {
          await fsPromises.unlink(file.path);
          deletedCount++;
          freedSpace += file.size;
          this.emit("file-deleted", { file, currentCount: deletedCount });
        } catch (err) {
          console.error(`Error deleting file ${file.path}:`, err);
        }
      }
    }
 const result = {
      filesFound: filesToDelete, // Передаємо сам МАСИВ файлів, прибравши .length
      totalSize,
      deletedCount,
      freedSpace,
      confirmDelete,
      totalFiles: filesToDelete.length,
    };
    this.emit("cleanup-complete", result);
    return result;
  }
}
