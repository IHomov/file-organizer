# File Organizer CLI Tool

A modular Node.js CLI tool for analyzing, cleaning up, and structuring files within directories. Built using ES Modules (ESM) architecture, native Node.js `EventEmitter` for real-time progress tracking, and Streams (`fs.createReadStream`) for optimized memory usage.

## 📁 Project Structure

```text
file-organizer/
├── lib/
│   ├── scanner.js        # Recursive scanning and metric gathering
│   ├── duplicates.js     # Duplicate finder via SHA-256 (Streams)
│   ├── organizer.js      # Category-based sorting with conflict resolution
│   └── cleanup.js        # Analysis and removal of outdated files
├── file-organizer.js     # Main entry point (CLI Interface)
├── package.json          # Project configuration (ESM enabled)
└── README.md             # Project documentation

Installation & Setup
Ensure you have Node.js installed (version 18 or newer).

Download or extract the project files into your working directory.

Navigate to the project folder in your terminal:
cd file-organizer

Commands, Arguments, and Usage Examples
1. scan Command
Recursively scans the specified directory, tracks real-time progress, and outputs a comprehensive file system report.

Syntax: npm run scan -- <directory_path> or node file-organizer.js scan <directory_path>

Example:
npm run scan -- ./my-folder

Output details:
Total file count and total size; distribution grouped by type (Documents, Media, etc.); age distribution (last 7 days, last 30 days, 90+ days old); a list of the largest files, and specific details about the oldest file found.

2. duplicates Command
Identifies identical files by generating SHA-256 hashes using fs.createReadStream(). This prevents large files from overloading the system memory.

Syntax: npm run duplicates -- <directory_path>

Example:
npm run duplicates -- ./my-folder
Output details:
Groups duplicate files by their unique cryptographic hashes, prints the absolute paths of all matched copies, and calculates the total amount of wasted disk space.

3. organize Command
Copies files from a source directory into a target directory, automatically classifying them into folders (Documents, Images, Archives, Code, Videos, Other). Streams are leveraged for large files (≥10 MB). If a filename conflict occurs, it automatically resolves it by appending an index (e.g., file(1).pdf).

Syntax: npm run organize -- <source_dir> --output <target_dir>

Example:
npm run organize -- ./downloads --output ./organized_files

Output details:
Displays directory creation status, an active real-time counter of copied files, and a final summary detailing how many files were copied into each target category.

4. cleanup Command
Analyzes files that have not been modified for a specified number of days. By default, it operates in a safe Dry Run mode. Files are only deleted when a confirmation flag is explicitly provided.

Syntax: npm run cleanup -- <directory_path> --older-than <days> [--confirm]

Examples:

Preview files eligible for deletion (Dry Run):
npm run cleanup -- ./temporary-folder --older-than 90

Execute actual file deletion:

npm run cleanup -- ./temporary-folder --older-than 90 --confirm

Output details:
A list of matching stale files along with their sizes and exact age. In --confirm mode, it performs the deletion and shows a final summary of deleted files and total freed disk space.

🛡️ Error Handling & Architecture
Robust File System Protection: All I/O operations are wrapped in try...catch blocks. Raw Node.js system errors are intercepted and transformed into clear, user-friendly terminal alerts. For example, a missing path triggers ❌ Error: Directory not found: <path> (handling ENOENT), and restricted system folders trigger distinct permission warnings (EACCES).

Event-Driven Progress: By extending the native EventEmitter class, the core logic modules emit granular lifestyle events (scan-start, file-found, copy-complete, etc.). The CLI entry point listens to these events to seamlessly update the terminal UI via process.stdout.write without cluttering your command history.

