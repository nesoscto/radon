#!/bin/bash

docker compose run --rm frontend npm run build
cd frontend
tar cvf ../deploy-frontend.tar --exclude="*.map" ./captain-definition ./dist/*