#!/usr/bin/env bash
curl -s -o smoke.out -w "%{http_code}" $1
cat smoke.out
