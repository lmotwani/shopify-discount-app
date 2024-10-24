# How to Run the Cleanup Script

1. First, make the script executable:
```bash
chmod +x scripts/cleanup.sh
```

2. Then run the script from the project root directory:
```bash
./scripts/cleanup.sh
```

If you're using Windows:
1. Using Git Bash:
```bash
sh scripts/cleanup.sh
```

2. Using PowerShell:
```powershell
bash scripts/cleanup.sh
```

After running the script:
1. It will remove all unnecessary files
2. Create the required directory structure
3. List any missing files that need to be created
4. Show a verification message with all kept files

Note: Make sure you have backed up any important files before running the cleanup script, as it will permanently delete files.
