#!/bin/sh
set -e
echo "Set base path to '$BASE_PATH'"
find /usr/share/nginx/html -type f -exec sed -i "s|/__BASE_PATH__/|$BASE_PATH|g" {} +
echo "Set base path to '$BASE_PATH' done"

echo "Set SERVER_URL to '$SERVER_URL'"
# grep -R __SERVER_URL__  /usr/share/nginx/html/*
find /usr/share/nginx/html -type f -exec sed -i "s|__SERVER_URL__|$SERVER_URL|g" {} +
echo "Set SERVER_URL url to '$SERVER_URL' done"

echo "Set DATA_SERVER_URL to '$DATA_SERVER_URL'"
find /usr/share/nginx/html -type f -exec sed -i "s|__DATA_SERVER_URL__|$DATA_SERVER_URL|g" {} +
echo "Set DATA_SERVER_URL url to '$DATA_SERVER_URL' done"

echo "Set AUTH_URL to '$AUTH_URL'"
find /usr/share/nginx/html -type f -exec sed -i "s|__AUTH_URL__|$AUTH_URL|g" {} +
echo "Set AUTH_URL url to '$AUTH_URL' done"

# echo Starting nginx
# exec nginx -g 'daemon off;'
