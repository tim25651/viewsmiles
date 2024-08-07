#!/bin/bash

grep -Rnw node_modules/jsdom -e "xhr-sync-worker.js" > /tmp/grep-xhr-sync-worker.txt

if [ "$1" == "-v" ]; then
    verbose=1
else
    verbose=0
fi

function edit() {
    pattern=$1
    lineno=$2
    file=$3
    sed -i '' "${lineno}s/^${pattern}//" "$file"
    sed -i '' "${lineno}s/^/${pattern}/" "$file"
    if [ $verbose -eq 1 ]; then
        echo "edited line $lineno in file $file"
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
import_str="const SvgWrapper = require('\.\/src\/SvgWrapper');"
edit "$import_str" 9 node_modules/smiles-drawer/app.js
add_str="SmilesDrawer\.SvgWrapper = SvgWrapper;"
edit "$add_str" 27 node_modules/smiles-drawer/app.js