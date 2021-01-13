#! /bin/bash
if [[ `hostname` == 'zanon' ]] ; then
    cp -r build/* /home/johnk/la-imc-php7/public/js/
else
    scp -r build/* killradio.org:/home/johnk/la-imc-php7/public/js/
fi
