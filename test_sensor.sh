#!/bin/bash

API_KEY="replace-with-a-strong-random-key"
TEMPLATE="single-log.json"
DEVICE_SERIAL="58439058940385843"
VALUE=${1:-123.45}
RSSI=${2:--64}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEDUP_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
HEXDATA=$(printf '%x' "${VALUE%.*}")

MODIFIED_JSON=$(jq \
  --arg time "$TIMESTAMP" \
  --arg value "$HEXDATA" \
  --arg rssi "$RSSI" \
  --arg did "$DEDUP_ID" \
  --arg devEui "$DEVICE_SERIAL" \
  '.time = $time | .object.hexdata = $value | .rxInfo[0].rssi = ($rssi|tonumber) | .deduplicationId = $did | .deviceInfo.devEui = $devEui' \
  "$TEMPLATE")

echo "$MODIFIED_JSON" | http POST http://localhost:8000/api/sensor-ingest/ \
  "Authorization: Api-Key $API_KEY" \
  Content-Type:application/json