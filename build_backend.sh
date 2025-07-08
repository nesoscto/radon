#!/bin/bash

TAG="$@"

docker build -t nmfm/radonapp-test:$TAG backend/
docker push nmfm/radonapp-test:$TAG
echo "Built nmfm/radonapp-test:$TAG"
