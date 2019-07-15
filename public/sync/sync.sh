#!/bin/sh

NEXT_DEV_DIR=~/Documents/js/next/main

# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
SCRIPTPATH=$(dirname "$SCRIPT")

# move next files
mkdir -p $SCRIPTPATH/../lib/next
rm -rf $SCRIPTPATH/../lib/next/*
mkdir -p $SCRIPTPATH/../lib/next/dist
cp -R $NEXT_DEV_DIR/next-* $SCRIPTPATH/../lib/next/
cp $NEXT_DEV_DIR/work/dist/next-*.js $SCRIPTPATH/../lib/next/dist

echo "Synchronized next framework."

# update all pages
NEXT_SCRIPTS=`cat $NEXT_DEV_DIR/work/test/next-web.html | sed -n '1h;1!H;${x;s/.*<!-- Test Code Start -->\r\?\n\s*\(.*\)\r\?\n\s*<!-- Test Code End -->.*/\1/g;p}' | sed -n '1h;1!H;${x;s/\\.\\.\\/\\.\\.\\/next-/lib\\/next\\/next-/g;p}' | sed -n '1h;1!H;${x;s/\\r/\\\\r/g;p}' | sed -n '1h;1!H;${x;s/\\n/\\\\n/g;p}' | sed -n '1h;1!H;${x;s/\\//\\\\\\//g;p}'`
PAGE=`cat $SCRIPTPATH/pattern.html | sed -e "s!\\$NEXT!$NEXT_SCRIPTS!g"`

for f in $(ls $SCRIPTPATH/pages); do
    CONTENT=`cat $SCRIPTPATH/pages/$f | sed -n '1h;1!H;${x;s/\\n/\\\\n/g;p}' | sed -n '1h;1!H;${x;s/\\//\\\\\\//g;p}'`
    CONTENT=`printf '%s\n' "$PAGE" | sed -e "s!\\$PAGE!$CONTENT!g"`
    printf '%s\n' "$CONTENT" > $SCRIPTPATH/../$f
    html-beautify $SCRIPTPATH/../$f -r > /dev/null
    echo "Updated $f."
done
