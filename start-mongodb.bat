@echo off
title Librio MongoDB Server
echo Starting MongoDB Database on port 27017...
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%~dp0data\db"
pause
