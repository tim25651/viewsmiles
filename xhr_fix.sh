#!/bin/bash
grep -Rnw node_modules/jsdom -e "xhr-sync-worker.js" > /tmp/grep-xhr-sync-worker.txt

while IFS= read -r line; do
    file=$(echo $line | cut -d ":" -f 1)
    lineno=$(echo $line | cut -d ":" -f 2)
    
    # remove if already exists
    sed -i '' "${lineno}s/^\/\/\ //" "$file"
    # insert 
    sed -i '' "${lineno}s/^/\/\/\ /" "$file"
    echo "file: $file, lineno: $lineno"
done < /tmp/grep-xhr-sync-worker.txt