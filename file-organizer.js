import path from 'path';
import { Scanner } from './lib/scanner.js';

const args = process.argv.slice(2);
const command = args[0]; 
const targetDir = args[1]; 

// Helper function to format sizes into human-readable units
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

if (command === 'scan') {
  if (!targetDir) {
    console.log('Error: Please provide a directory path.');
    process.exit(1);
  }

  const fileScanner = new Scanner();

  fileScanner.on('scan-start', (data) => {
    console.log(`Scanning: ${data.directory}`);
    process.stdout.write('Processing... ');
  });

  // Dynamic counter display in console
  fileScanner.on('file-found', ({ currentCount }) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Processing... Files found: ${currentCount}`);
  });

  fileScanner.on('scan-complete', (stats) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);

    console.log('\nScan Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total files: ${stats.totalFiles}`);
    console.log(`Total size:  ${formatBytes(stats.totalSize)}`);
    
    console.log('\nBy File Type:');
    for (const [ext, data] of Object.entries(stats.types)) {
      console.log(`  ${ext.padEnd(7)} ${data.count.toString().padEnd(4)} files   ${formatBytes(data.totalSize)}`);
    }

    console.log('\nFile Age:');
    console.log(`  Last 7 days:    ${stats.age.last7Days} files`);
    console.log(`  Last 30 days:   ${stats.age.last30Days} files`);
    console.log(`  Older than 90:  ${stats.age.olderThan90} files`);

    console.log('\nLargest files:');
    stats.largestFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name.padEnd(20)} ${formatBytes(file.size)}`);
    });

    if (stats.oldestFile) {
      console.log(`\nOldest file: ${stats.oldestFile.name} (modified ${stats.oldestFile.daysAgo} days ago)`);
    } else {
      console.log('\nOldest file: No files found.');
    }
  });

  fileScanner.scan(path.resolve(targetDir));

} else {
  console.log('Error: Unknown command. Available commands: scan');
}