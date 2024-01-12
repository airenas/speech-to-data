#!/bin/sh
echo Configuring BASE_HREF to "$BASE_HREF"
sed -i "s|BASE_HREF|$BASE_HREF|" /usr/share/nginx/html/index.html

echo Configuring KALDI_URL to "$KALDI_URL"
sed -i "s|KALDI_URL|$KALDI_URL|" /usr/share/nginx/html/index.html

echo Configuring PUNCTUATION_URL to "$PUNCTUATION_URL"
sed -i "s|PUNCTUATION_URL|$PUNCTUATION_URL|" /usr/share/nginx/html/index.html

echo Env conf done
