#! /bin/bash

echo "" > all.js
for i in jquery-1.9.1.min.js jquery-migrate-1.2.1.js history.adapter.jquery.js history.js mustache.js encoder.js URI.js json2.js qrcodejs/qrcode.js 
do
	cat ../vendor/$i >> all.js
	echo ";" >> all.js
done
cat main.js >> all.js

CJSC="java -jar /home/johnk/bin/closure-compiler/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js "
$CJSC all.js > all.min.js
CJSC="java -jar /home/johnk/bin/closure-compiler/compiler.jar --compilation_level WHITESPACE_ONLY --js "
#$CJSC all.js > all.ws.js
CJSC="java -jar /home/johnk/bin/closure-compiler/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js "
# $CJSC all.js > a.js
