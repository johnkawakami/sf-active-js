#! /bin/bash

grunt
rm js/*~
rm js.zip
zip -r js.zip js
