(function(nx) {
    var EXPORT = nx.define("glance.admin.DEMO", {
        statics: {
            BLE_LIST: [{
                id: "000001",
                macAddress: "00:00:00:00:00:00:00:01"
            }, {
                id: "000002",
                macAddress: "00:00:00:00:00:00:00:02"
            }, {
                id: "000003",
                macAddress: "00:00:00:00:00:00:00:03"
            }, {
                id: "000004",
                macAddress: "00:00:00:00:00:00:00:04"
            }],
            EXPERTS: [{
                "glanceOrgId": "cisco",
                "glanceUserId": "glance",
                "id": "iphone1",
                "name": "Apple iPhone1",
                "email": "iphone1@glancedemo.cisco.com",
                "phoneNumber": "+1978123456",
                "topics": [
                    "Apple iPhone1"
                ],
                "title": "Apple iPhone1",
                "bio": "Apple iPhone1",
                "avatar": "594886272a00001700a9f1e0",
                "avatarUrl": "https://d3nevzfk7ii3be.cloudfront.net/igi/cMVbyIbIrTEbi2j5.standard",
                "macAddress": [
                    "a8:5b:78:48:ad:95"
                ],
                "category": "thing",
                "fixedLocation": false,
                "status": 0,
                "checkout": 0,
                "tags": [],
                "properties": {},
                "lastNotified": "2017-06-20T10:14:18.445+0800",
                "dataFrom": "Glance",
                "created": 1497925158445,
                "updated": 1497925158445,
                "skills": [
                    "Apple iPhone1"
                ],
                "position": [
                    0,
                    963
                ]
            }, {
                "glanceOrgId": "cisco",
                "glanceUserId": "glance",
                "id": "iphone2",
                "name": "Apple iPhone2",
                "email": "iphone2@glancedemo.cisco.com",
                "phoneNumber": "+1978123456",
                "topics": [
                    "Apple iPhone2"
                ],
                "title": "Apple iPhone2",
                "bio": "Apple iPhone2",
                "avatar": "594886272a00001700a9f1df",
                "avatarUrl": "https://d3nevzfk7ii3be.cloudfront.net/igi/cMVbyIbIrTEbi2j5.standard",
                "macAddress": [
                    "6c:40:08:90:d8:9a"
                ],
                "category": "thing",
                "fixedLocation": false,
                "status": 0,
                "checkout": 0,
                "tags": [],
                "properties": {},
                "lastNotified": "2017-06-20T10:14:18.445+0800",
                "dataFrom": "Glance",
                "created": 1497925158445,
                "updated": 1497925158445,
                "skills": [
                    "Apple iPhone2"
                ],
                "position": [
                    0,
                    963
                ]
            }, {
                "glanceOrgId": "cisco",
                "glanceUserId": "glance",
                "id": "iphone3",
                "name": "Apple iPhone3",
                "email": "iphone3@glancedemo.cisco.com",
                "phoneNumber": "+1978123456",
                "topics": [
                    "Apple iPhone3"
                ],
                "title": "Apple iPhone3",
                "bio": "Apple iPhone3",
                "avatar": "594886272a00001700a9f1e1",
                "avatarUrl": "https://d3nevzfk7ii3be.cloudfront.net/igi/cMVbyIbIrTEbi2j5.standard",
                "macAddress": [
                    "f4:5c:89:a6:60:21"
                ],
                "category": "thing",
                "fixedLocation": false,
                "status": 0,
                "checkout": 0,
                "tags": [],
                "properties": {},
                "lastNotified": "2017-06-20T10:14:18.445+0800",
                "dataFrom": "Glance",
                "created": 1497925158445,
                "updated": 1497925158445,
                "skills": [
                    "Apple iPhone3"
                ],
                "position": [
                    0,
                    963
                ]
            }],
            run: function(app, service) {
                service.fire("message", {
                    servers: [{
                        serverId: nx.uuid(true),
                        name: "SITE",
                        campuses: [{
                            campusId: nx.uuid(true),
                            name: "Glance Demo Offices",
                            buildings: [{
                                buildingId: nx.uuid(true),
                                name: "Glance Demo",
                                floors: [{
                                    floorId: nx.uuid(true),
                                    name: "2F",
                                    map: {
                                        url: "map/normal-demo-1.svg"
                                    },
                                    locationers: [{
                                        type: "meraki",
                                        url: "http://1.1.1.1:88/meraki",
                                        username: "admin",
                                        password: "admin",
                                        timezone: "Pacific Standard Time"
                                    }]
                                }, {
                                    floorId: nx.uuid(true),
                                    name: "15AF"
                                }]
                            }, {
                                buildingId: nx.uuid(true),
                                name: "SHN13",
                                floors: [{
                                    floorId: nx.uuid(true),
                                    name: "5F"
                                }, {
                                    floorId: nx.uuid(true),
                                    name: "6F"
                                }, {
                                    floorId: nx.uuid(true),
                                    name: "7F"
                                }, {
                                    floorId: nx.uuid(true),
                                    name: "8F"
                                }, {
                                    floorId: nx.uuid(true),
                                    name: "11F"
                                }]
                            }]
                        }]
                    }],
                    devlists: [{
                        name: "Experts",
                        devices: [{
                            id: nx.serial(),
                            name: "Device 01",
                            model: "iPhone 5S",
                            category: "expert",
                            macAddress: "00:00:00:00:00:00:00:00",
                            owner: "John",
                            phoneNumber: "0101010101"
                        }, {
                            id: nx.serial(),
                            name: "Device 02",
                            model: "iPhone 6S",
                            category: "thing",
                            macAddress: "00:00:00:00:00:00:00:00",
                            owner: "Kim",
                            phoneNumber: "0101010101"
                        }]
                    }, {
                        name: "Visitors",
                        devices: [{
                            id: nx.serial(),
                            name: "A",
                            model: "iPhone 5S",
                            category: "phone",
                            macAddress: "00:00:00:00:00:00:00:00",
                            owner: "John",
                            phoneNumber: "0101010101"
                        }, {
                            id: nx.serial(),
                            name: "B",
                            model: "iPhone 6S",
                            category: "phone",
                            macAddress: "00:00:00:00:00:00:00:00",
                            owner: "Kim",
                            phoneNumber: "0101010101"
                        }].concat(nx.array.times(50).map(() => ({
			    // Array(50) cannot map correctly
                            id: nx.serial()
                        })))
                    }]
                });
            }
        }
    });
})(nx);
