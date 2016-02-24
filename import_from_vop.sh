#!/bin/bash

if [ $1x = "x" ]
then
	echo "Please specify path to a vop file"
	exit 1
fi

PROJECT=/tmp/vop_${RANDOM}
mkdir $PROJECT

tar xf $1 -C $PROJECT &> /dev/null
if [ $? -ne 0 ]
then
	echo "Error: Cannot extract $1"
	echo "Please make sure you are specifying valid vop file"
	exit 1
fi

rm -fr assets vostan.db
cp -r $PROJECT/tmp_vostan/assets $PROJECT/tmp_vostan/db/vostan.db .
if [ $? -ne 0 ]
then
	echo "Error: Cannot copy files"
	echo "Please make sure you have write permissions into this folder"
	exit 1
fi

chmod -R  777 assets
if [ $? -ne 0 ]
then
	echo "Error: Cannot set permissions"
	exit 1
fi
chmod 666 vostan.db
rm -fr $PROJECT

echo "Done!"

