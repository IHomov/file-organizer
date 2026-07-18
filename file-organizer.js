import path from 'path';
import { Scanner } from './lib/scanner.js';

const args = process.argv.slice(2);
const command = args[0]; 
const targetDir = args[1]; 

if (command === 'scan') {
  if (!targetDir) {
    console.log(' Please specify the path to the directory after the scan command.');
    process.exit(1);
  }

  const fileScanner = new Scanner();

  // 1. Starting scan event
  fileScanner.on('scan-start', (data) => {
    console.log(` Starting scan of directory: ${data.directory}`);
  });

  // 2. Each found file (now a clean fileData without wrappers)
  fileScanner.on('file-found', ({file}) => {
    console.log(`   File found: ${file.name} (Size: ${file.size} bytes)`);
  });

  // 3. Final report
  fileScanner.on('scan-complete', (stats) => {
    console.log(`\n Scan is complete!`);
    console.log(` All files found: ${stats.totalFiles}`);
    console.log(` Total size: ${stats.totalSize} bytes`);
  });

  fileScanner.scan(path.resolve(targetDir));

} else {
  console.log('Not a valid command. Please use: scan <directory>');
}