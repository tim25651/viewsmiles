#!/bin/bash

grep -Rnw node_modules/jsdom -e "xhr-sync-worker.js" > /tmp/grep-xhr-sync-worker.txt

if [ "$1" == "-v" ]; then
    verbose=1
else
    verbose=0
fi

function edit() {
    local pattern=$1
    local lineno=$2
    local file=$3
    local verbose=${verbose:-0}  # Default to 0 if not set

    # Check if file exists
    if [ ! -f "$file" ]; then
        echo "Error: File $file not found."
        return 1
    fi

    # Check if line number is valid
    if ! [[ "$lineno" =~ ^[0-9]+$ ]] || [ "$lineno" -le 0 ]; then
        echo "Error: Invalid line number $lineno."
        return 1
    fi

    # check if linux
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Remove and then add the pattern
        sed -i "${lineno}s/^${pattern}//" "$file"
        sed -i "${lineno}s/^/${pattern}/" "$file"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Remove and then add the pattern
        sed -i '' "${lineno}s/^${pattern}//" "$file"
        sed -i '' "${lineno}s/^/${pattern}/" "$file"
    else
        echo "Error: Unsupported OS $OSTYPE."
        return 1
    fi

    # Verbose output
    if [ "$verbose" -eq 1 ]; then
        echo "Edited line $file:$lineno"
    fi
}

function comment() {
    lineno=$1
    file=$2
    pattern="\/\/\ "
    edit "$pattern" $lineno $file
}

while IFS= read -r line; do
    file=$(echo $line | cut -d ":" -f 1)
    lineno=$(echo $line | cut -d ":" -f 2)
    
    comment $lineno $file
    
done < /tmp/grep-xhr-sync-worker.txt

# comment out 641 to 700 in node_modules/smiles-drawer/src/SvgWrapper.js
# for i in {641..700}; do
#     comment $i node_modules/smiles-drawer/src/SvgWrapper.js
# done

# for i in {716..722}; do
#     comment $i node_modules/smiles-drawer/src/SvgWrapper.js
# done

# add if (bbox) { on lines 643 and 715
edit "if (bbox) {" 643 node_modules/smiles-drawer/src/SvgWrapper.js
edit "if (bbox) {" 715 node_modules/smiles-drawer/src/SvgWrapper.js
# add } on line 701 and 723
edit "}" 701 node_modules/smiles-drawer/src/SvgWrapper.js
edit "}" 723 node_modules/smiles-drawer/src/SvgWrapper.js

# edit app.js
import_str="const SvgWrapper = require('.\/src\/SvgWrapper');"
add_str="SmilesDrawer.SvgWrapper = SvgWrapper;"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # escape the dots
    import_str="const SvgWrapper = require('.\/src\/SvgWrapper');"
    add_str="SmilesDrawer.SvgWrapper = SvgWrapper;"
fi

edit "$import_str" 9 node_modules/smiles-drawer/app.js
edit "$add_str" 27 node_modules/smiles-drawer/app.js