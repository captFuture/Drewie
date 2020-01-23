#!/bin/bash
cd /home/pi/Drewie
git pull
sleep 2
ls

npm install
sleep 2

sudo npm start
sleep 10
