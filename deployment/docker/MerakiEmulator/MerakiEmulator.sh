#!/usr/bin/env bash


declare -a macAddressesZoneA=("88:15:44:60:F4:A0" "88:15:44:60:F4:60" \
                         "88:15:44:M0:F4:60" "88:15:F4:60:F4:60" \
                         "C8:15:44:60:F4:X0" "X8:15:44:M0:F4:60" \
                         "88:15:44:M0:F4:60" "88:15:F4:60:F4:60" \
                         "A8:15:44:M0:F4:60" "88:1B:F4:60:F4:60" \
                         "B8:15:44:M0:F4:60" "88:1A:F4:60:F4:60" \
                         "C8:15:44:M0:F4:60" "88:1C:F4:60:F4:60" \
                         "D8:15:44:M0:F4:60" "88:1F:F4:60:F4:60" \
                         "E8:15:44:M0:F4:60" "88:1N:F4:60:F4:60" \
                         "F8:15:44:M0:F4:60" "88:1O:F4:60:F4:60" \
                         "G8:15:44:M0:F4:60" "88:1R:F4:60:F4:60" \
                         "H8:15:44:M0:F4:60" "88:W5:F4:60:F4:60" \
                         "I8:15:44:M0:F4:60" "88:Z5:F4:60:F4:60" \
                         "L8:15:44:M0:F4:60" "88:1D:F4:60:F4:60" \
                         "88:X5:44:M0:F4:60" "88:1X:FD:60:F4:60" \
                         "88:J5:44:M0:F4:60" "88:15:Q4:60:F4:60" \
                         "88:L5:44:M0:F4:60" "88:15:B4:60:F4:60" \
                         "88:N5:44:M0:F4:60" "88:15:J4:60:F4:60" \
                         "88:X5:44:M0:F4:60" "88:15:L4:60:F4:60" \
                         "88:Q5:44:M0:F4:60" "88:15:T4:60:F4:60" \
                         "88:E5:44:M0:F4:60" "88:15:U4:60:F4:60" \
                         "88:R5:44:M0:F4:60" "88:15:A4:60:F4:60" \
                         )

declare -a macAddressesZoneB=("88:15:44:60:F4:Y0" "88:15:44:60:F4:X0" \
                         "88:15:44:M0:F4:Y0" "88:15:F4:60:F4:X0" \
                         "C8:15:44:60:F4:X0" "X8:15:44:M0:F4:X0" \
                         "88:15:44:M0:F4:Y0" "88:15:F4:60:F4:X0" \
                         "A8:15:44:M0:F4:Y0" "88:1B:F4:60:F4:X0" \
                         "B8:15:44:M0:F4:Y0" "88:1A:F4:60:F4:X0" \
                         "C8:15:44:M0:F4:Y0" "88:1C:F4:60:F4:X0" \
                         "D8:15:44:M0:F4:Y0" "88:1F:F4:60:F4:X0" \
                         "E8:15:44:M0:F4:Y0" "88:1N:F4:60:F4:X0" \
                         "F8:15:44:M0:F4:Y0" "88:1O:F4:60:F4:X0" \
                         "G8:15:44:M0:F4:Y0" "88:1R:F4:60:F4:X0" \
                         "H8:15:44:M0:F4:Y0" "88:W5:F4:60:F4:X0" \
                         "I8:15:44:M0:F4:Y0" "88:Z5:F4:60:F4:X0" \
                         "L8:15:44:M0:F4:Y0" "88:1D:F4:60:F4:X0" \
                         "88:X5:44:M0:F4:Y0" "88:1X:FD:60:F4:X0" \
                         "88:R5:44:M0:F4:Y0" "88:15:A4:60:F4:X0" \
                         )

declare -a macAddressesZoneC=("88:15:44:60:F4:W0" "88:15:44:60:F4:Z0" \
                         "88:15:44:M0:F4:W0" "88:15:F4:60:F4:Z0" \
                         "C8:15:44:60:F4:W0" "X8:15:44:M0:F4:Z0" \
                         "88:15:44:M0:F4:W0" "88:15:F4:60:F4:Z0" \
                         "A8:15:44:M0:F4:W0" "88:1B:F4:60:F4:Z0" \
                         "B8:15:44:M0:F4:W0" "88:1A:F4:60:F4:Z0" \
                         "C8:15:44:M0:F4:W0" "88:1C:F4:60:F4:Z0" \
                         "D8:15:44:M0:F4:W0" "88:1F:F4:60:F4:Z0" \
                         "E8:15:44:M0:F4:W0" "88:1N:F4:60:F4:Z0" \
                         "F8:15:44:M0:F4:W0" "88:1O:F4:60:F4:Z0" \
                         "G8:15:44:M0:F4:W0" "88:1R:F4:60:F4:Z0" \
                         "H8:15:44:M0:F4:W0" "88:W5:F4:60:F4:Z0" \
                         "I8:15:44:M0:F4:W0" "88:Z5:F4:60:F4:Z0" \
                         "L8:15:44:M0:F4:W0" "88:1D:F4:60:F4:Z0" \
                         "88:X5:44:M0:F4:W0" "88:1X:FD:60:F4:Z0" \
                         "88:J5:44:M0:F4:W0" "88:15:Q4:60:F4:Z0" \
                         "88:L5:44:M0:F4:W0" "88:15:B4:60:F4:Z0" \
                         "88:N5:44:M0:F4:W0" "88:15:J4:60:F4:Z0" \
                         "88:X5:44:M0:F4:W0" "88:15:L4:60:F4:Z0" \
                         "88:Q5:44:M0:F4:W0" "88:15:T4:60:F4:Z0" \
                         "88:E5:44:M0:F4:W0" "88:15:U4:60:F4:Z0" \
                         "88:R5:44:M0:F4:W0" "88:15:A4:60:F4:Z0" \
                         )

declare -a macAddressesZoneD=("88:15:44:60:F4:D0" "88:15:44:60:F4:D1" \
                         "88:15:44:M0:F4:D0" "88:15:F4:60:F4:D1" \
                         "C8:15:44:60:F4:D0" "X8:15:44:M0:F4:D1" \
                         "88:15:44:M0:F4:D0" "88:15:F4:60:F4:D1" \
                         "A8:15:44:M0:F4:D0" "88:1B:F4:60:F4:D1" \
                         "B8:15:44:M0:F4:D0" "88:1A:F4:60:F4:D1" \
                         "C8:15:44:M0:F4:D0" "88:1C:F4:60:F4:D1" \
                         "D8:15:44:M0:F4:D0" "88:1F:F4:60:F4:D1" \
                         "88:L5:44:M0:F4:D0" "88:15:B4:60:F4:D1" \
                         "88:N5:44:M0:F4:D0" "88:15:J4:60:F4:D1" \
                         "88:X5:44:M0:F4:D0" "88:15:L4:60:F4:D1" \
                         "88:Q5:44:M0:F4:D0" "88:15:T4:60:F4:D1" \
                         "88:E5:44:M0:F4:D0" "88:15:U4:60:F4:D1" \
                         "88:R5:44:M0:F4:D0" "88:15:A4:60:F4:D1" \
                         )

declare -a macAddressesZoneE=("88:15:44:60:F4:E0" "88:15:44:60:F4:E1" \
                         "88:15:44:M0:F4:E0" "88:15:F4:60:F4:E1" \
                         "C8:15:44:60:F4:E0" "X8:15:44:M0:F4:E1" \
                         "88:15:44:M0:F4:E0" "88:15:F4:60:F4:E1" \
                         "A8:15:44:M0:F4:E0" "88:1B:F4:60:F4:E1" \
                         "B8:15:44:M0:F4:E0" "88:1A:F4:60:F4:E1" \
                         "C8:15:44:M0:F4:E0" "88:1C:F4:60:F4:E1" \
                         "88:Q5:44:M0:F4:E0" "88:15:T4:60:F4:E1" \
                         "88:E5:44:M0:F4:E0" "88:15:U4:60:F4:E1" \
                         "88:R5:44:M0:F4:E0" "88:15:A4:60:F4:E1" \
                         )

declare -a macAddressesZoneF=("88:15:44:60:F4:F0" "88:15:44:60:F4:F1" \
                         "88:15:44:M0:F4:F0" "88:15:F4:60:F4:F1" \
                         "C8:15:44:60:F4:F0" "X8:15:44:M0:F4:F1" \
                         "88:15:44:M0:F4:F0" "88:15:F4:60:F4:F1" \
                         "A8:15:44:M0:F4:F0" "88:1B:F4:60:F4:F1" \
                         "B8:15:44:M0:F4:F0" "88:1A:F4:60:F4:F1" \
                         "C8:15:44:M0:F4:F0" "88:1C:F4:60:F4:F1" \
                         "D8:15:44:M0:F4:F0" "88:1F:F4:60:F4:F1" \
                         "E8:15:44:M0:F4:F0" "88:1N:F4:60:F4:F1" \
                         "F8:15:44:M0:F4:F0" "88:1O:F4:60:F4:F1" \
                         "G8:15:44:M0:F4:F0" "88:1R:F4:60:F4:F1" \
                         "H8:15:44:M0:F4:F0" "88:W5:F4:60:F4:F1" \
                         "I8:15:44:M0:F4:F0" "88:Z5:F4:60:F4:F1" \
                         "L8:15:44:M0:F4:F0" "88:1D:F4:60:F4:F1" \
                         "88:X5:44:M0:F4:F0" "88:1X:FD:60:F4:F1" \
                         "88:J5:44:M0:F4:F0" "88:15:Q4:60:F4:F1" \
                         "88:R5:44:M0:F4:F0" "88:15:A4:60:F4:F1" \
                         )

declare -a macAddressesZoneX=("88:15:44:60:F4:6A" "88:15:44:60:F4:1A" \
                         "88:15:44:M0:F4:6A" "88:15:F4:60:F4:1A" \
                         "C8:15:44:60:F4:XA" "X8:15:44:M0:F4:1A" \
                         "88:15:44:M0:F4:6A" "88:15:F4:60:F4:1A" \
                         "A8:15:44:M0:F4:6A" "88:1B:F4:60:F4:1A" \
                         "B8:15:44:M0:F4:6A" "88:1A:F4:60:F4:1A" \
                         "C8:15:44:M0:F4:6A" "88:1C:F4:60:F4:1A" \
                         "D8:15:44:M0:F4:6A" "88:1F:F4:60:F4:1A" \
                         "E8:15:44:M0:F4:6A" "88:1N:F4:60:F4:1A" \
                         "F8:15:44:M0:F4:6A" "88:1O:F4:60:F4:1A" \
                         "G8:15:44:M0:F4:6A" "88:1R:F4:60:F4:1A" \
                         "H8:15:44:M0:F4:6A" "88:W5:F4:60:F4:1A" \
                         "I8:15:44:M0:F4:6A" "88:Z5:F4:60:F4:1A" \
                         "L8:15:44:M0:F4:6A" "88:1D:F4:60:F4:1A" \
                         "88:X5:44:M0:F4:6A" "88:1X:FD:60:F4:1A" \
                         "88:J5:44:M0:F4:6A" "88:15:Q4:60:F4:1A" \
                         "88:L5:44:M0:F4:6A" "88:15:B4:60:F4:1A" \
                         "88:N5:44:M0:F4:6A" "88:15:J4:60:F4:1A" \
                         "88:X5:44:M0:F4:6A" "88:15:L4:60:F4:1A" \
                         "88:Q5:44:M0:F4:6A" "88:15:T4:60:F4:1A" \
                         "88:E5:44:M0:F4:6A" "88:15:U4:60:F4:1A" \
                         "88:R5:44:M0:F4:6A" "88:15:A4:60:F4:1A" \
                         "A8:15:44:M0:F4:6A" "A8:1D:F4:60:F4:1A" \
                         "A8:X5:44:M0:F4:6A" "A8:1X:FD:60:F4:1A" \
                         "A8:J5:44:M0:F4:6A" "A8:15:Q4:60:F4:1A" \
                         "A8:L5:44:M0:F4:6A" "A8:15:B4:60:F4:1A" \
                         "A8:N5:44:M0:F4:6A" "A8:15:J4:60:F4:1A" \
                         "A8:X5:44:M0:F4:6A" "A8:15:L4:60:F4:1A" \
                         "A8:Q5:44:M0:F4:6A" "A8:15:T4:60:F4:1A" \
                         "A8:E5:44:M0:F4:6A" "A8:15:U4:60:F4:1A" \
                         "A8:R5:44:M0:F4:6A" "A8:15:A4:60:F4:1A" \
                         )

declare -a macAddressesZoneY=("88:Y0:44:60:F4:6A" "88:Y1:44:60:F4:1A" \
                         "88:Y0:44:M0:F4:6A" "88:Y1:F4:60:F4:1A" \
                         "C8:Y0:44:60:F4:XA" "X8:Y1:44:M0:F4:1A" \
                         "88:Y0:44:M0:F4:6A" "88:Y1:Y1:60:F4:1A" \
                         "A8:Y0:44:M0:F4:6A" "88:1B:Y1:60:F4:1A" \
                         "B8:Y0:44:M0:F4:6A" "88:1A:Y1:60:F4:1A" \
                         "C8:Y0:44:M0:F4:6A" "88:1C:Y1:60:F4:1A" \
                         "D8:Y0:44:M0:F4:6A" "88:1F:Y1:60:F4:1A" \
                         "E8:Y0:44:M0:F4:6A" "88:1N:Y1:60:F4:1A" \
                         "F8:Y0:44:M0:F4:6A" "88:1O:Y1:60:F4:1A" \
                         "G8:Y0:44:M0:F4:6A" "88:1R:Y1:60:F4:1A" \
                         "H8:Y0:44:M0:F4:6A" "88:W5:Y1:60:F4:1A" \
                         "I8:Y0:44:M0:F4:6A" "88:Z5:Y1:60:F4:1A" \
                         "L8:Y0:44:M0:F4:6A" "88:1D:Y1:60:F4:1A" \
                         "8L:Y0:44:M0:F4:6A" "88:1X:Y1:60:F4:1A" \
                         "8Q:Y0:44:M0:F4:6A" "88:Y1:Y1:60:F4:1A" \
                         "8A:Y0:44:M0:F4:6A" "Y1:15:Y1:60:F4:1A" \
                         "80:Y0:44:M0:F4:6A" "88:Y1:J4:60:F4:1A" \
                         "8X:Y0:44:M0:F4:6A" "Y1:15:L4:Y1:F4:1A" \
                         "8Z:Y0:44:M0:F4:6A" "Y1:Y1:T4:Y1:F4:1A" \
                         "8K:Y0:44:M0:F4:6A" "88:Y1:U4:60:F4:1A" \
                         "8R:Y0:44:M0:F4:6A" "88:15:A4:60:F4:1A" \
                         "A8:Y0:44:M0:F4:6A" "A8:1D:F4:Y1:F4:1A" \
                         "X8:Y0:44:M0:F4:6A" "A8:1X:FD:Y1:F4:1A" \
                         "A7:Y0:44:M0:F4:6A" "A8:15:Q4:Y1:F4:1A" \
                         "A1:Y0:44:M0:F4:6A" "A8:15:B4:Y1:F4:1A" \
                         "A9:Y0:44:M0:F4:6A" "A8:15:J4:Y1:F4:1A" \
                         "A2:Y0:44:M0:F4:6A" "A8:15:L4:Y1:F4:1A" \
                         "A3:Y0:44:M0:F4:6A" "A8:15:T4:Y1:F4:1A" \
                         "A4:Y0:44:M0:F4:6A" "A8:15:U4:Y1:F4:1A" \
                         "A5:Y0:44:M0:F4:6A" "A8:15:A4:Y1:F4:1A" \
                         )

declare -a elements=()
MerakiMessage=""
MerakiData=""
ObjectData=""
ObjectDataX=""
PostUrl="http://ec2-35-157-126-108.eu-central-1.compute.amazonaws.com/api/v1/callback/meraki/glance/floor1"
FloorId="b20-2"
Secret="cisco123"

#{ "version": "2.0","secret": "cisco123","type": "DevicesSeen",

while :
do
    #post area zone;
    #curl -vX POST $PostUrl --header "Content-Type: application/json" -d @MerakiAreaA.json

    #Zone A generator
    ObjectDataX=""
    for i in "${macAddressesZoneA[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(124-40))+40 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(183-110))+110 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)
       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalk\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"
       sleep $(awk 'BEGIN{srand();print int(rand()*(3)) }')

    #Zone B Generator
    ObjectDataX=""
    for i in "${macAddressesZoneB[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(198-130))+130 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(157-105))+105 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)
       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkB\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"

        sleep $(awk 'BEGIN{srand();print int(rand()*(3)) }')

    #Zone C Generator
    ObjectDataX=""
    for i in "${macAddressesZoneC[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(286-205))+205 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(184-121))+121 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)

       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkC\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"

        sleep $(awk 'BEGIN{srand();print int(rand()*(3)) }')

    #Zone D Generator
    ObjectDataX=""
    for i in "${macAddressesZoneD[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(108-47))+47 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(96-45))+45 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)

       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkD\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"
       sleep $(awk 'BEGIN{srand();print int(rand()*(3))}')

    #Zone E Generator
    ObjectDataX=""
    for i in "${macAddressesZoneE[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(199-128))+128 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(97-44))+44 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)

       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkE\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"
    sleep $(awk 'BEGIN{srand();print int(rand()*(3))}')

    #Zone F Generator
    ObjectDataX=""
    for i in "${macAddressesZoneF[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(281-219))+219 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(97-44))+44 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)

       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi
        sleep $(awk 'BEGIN{srand();print int(rand()*(3))}')
       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkF\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"

    #Zone X Generator
    ObjectDataX=""
    for i in "${macAddressesZoneX[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(335-0))+0 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(255-0))+0 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)

       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkX\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"
       sleep $(awk 'BEGIN{srand();print int(rand()*(3))}')

    #Random MacAddress Generator

    for i in {1..3}
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(335-0))+0 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(255-0))+0 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)
       hexchars="0123456789ABCDEF"
       end=$( for i in {1..6} ; do echo -n ${hexchars:$(( $RANDOM % 16 )):1} ; done | sed -e 's/\(..\)/:\1/g' )
       macAddress=$(echo D5:6F:2F$end)

       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$macAddress\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Intel\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkX\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"
    sleep $(awk 'BEGIN{srand();print int(rand()*(3))}')

    #Zone Y Generator
    ObjectDataX=""
    for i in "${macAddressesZoneY[@]}"
    do
       x=$(awk 'BEGIN{srand();print int(rand()*(335-0))+0 }')
       y=$(awk 'BEGIN{srand();print int(rand()*(255-160))+160 }')
       currentTime=$(date +"%FT%TZ")
       seenEpoch=$(date +%s)


       ObjectData="{\"ipv4\": null,\"location\": {\"lat\": 31.272467386294355,\"lng\": 121.4590669060392,\"unc\": 34.87214310638062,\"x\": [$x],\
            \"y\": [$y]},\"seenTime\": \"$currentTime\",\"ssid\": null,\"os\": null, \
                \"clientMac\": \"$i\",\"seenEpoch\": $seenEpoch,\"rssi\": 22,\"ipv6\": null,\"manufacturer\": \"Meraki\"}"

       if [ -n "$ObjectDataX" ]; then
         ObjectDataX="$ObjectDataX,$ObjectData"
       else
         ObjectDataX="$ObjectData"
       fi

       # or do whatever with individual element of the array
    done
       #echo $ObjectDataXj
       MerakiData="{\"apMac\":\""$i"\",\"apFloors\":[\"$FloorId\"],\"apTags\":[\"iTalkX\"],\"observations\":[$ObjectDataX]}"
       echo $MerakiData
       MerakiMessage="{\"version\":\"2.0\",\"secret\":\"$Secret\",\"type\":\"DevicesSeen\",\"data\":"$MerakiData"}"
       echo $MerakiMessage
       curl -vX POST $PostUrl --header "Content-Type: application/json" -d "$MerakiMessage"


      sleep $(awk 'BEGIN{srand();print int(rand()*(3)+10)}')
done

#curl -vX POST $PostUrl --header "Content-Type: application/json" --data-binary "./MerakiAreaA.json" -v -s


