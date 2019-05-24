(function(nx) {
    var EXPORT = nx.define("glance.perspective.DEMO", {
        statics: {
            whoami: {
                category: "screen",
                id: "screen1",
                name: "Glance Demo Screen1",
                floorId: "floor-4",
                position: [800, 300]
            },
            components: [{
                type: "config",
                position: {
                    according: "right top",
                    offset: [-100, 0]
                }
            }],
            settings: {},
            heatmap: {
                "data": {
                    "buildingId": "building-glance",
                    "floorId": "floor-glance",
                    "density": [
                        [{
                            "position": [
                                2000,
                                1000
                            ],
                            "count": 15
                        }, {
                            "position": [
                                3000,
                                1000
                            ],
                            "count": 15
                        }],
                        [{
                            "position": [
                                5000,
                                2000
                            ],
                            "count": 10
                        }],
                        [{
                            "position": [
                                2500,
                                2500
                            ],
                            "count": 3
                        }]
                    ]
                }
            },
            run: function(app, service) {
                // prepare for demo data
                var WIDTH = 796;
                var HEIGHT = 576;
                var register, join, movement;
                floors = [{
                    floorId: "floor-glance", //
                    floorName: "",
                    mapName: "target-map"
                }];
                floors_stadium = [{
                    floorId: "floor-statium",
                    floorName: "",
                    mapName: "normal-test-statium"
                }];

                register = [{
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo1",
                    "name": "Li Kang",
                    "email": "glancedemo1@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Communications Manager", "Migrations", "Architecture", "Voice Mail Integrations", "Financial Services", "Unified Communications", "uc architecture"],
                    "title": "ENGINEER.SOFTWARE ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.062+0800",
                    "created": 1452677305062,
                    "updated": 1452677305062,
                    "skills": ["CMX", "Lisp", "Linux"],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo2",
                    "name": "Ashutosh Malegaonkar",
                    "email": "glancedemo2@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Innovation", "Incubation", "MXE3500", "Cisco Pulse", "Recording and Streaming", "Video Analytics", "Search", "Device Drivers", "Linux Kernel", "Video Surveillance", "Video Tagging"],
                    "title": "PRINCIPAL ENGINEER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T16:11:02.840+0800",
                    "created": 1452672962840,
                    "updated": 1452672962840,
                    "skills": [""],
                    "position": [0, 0]
                },{
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo3",
                    "name": "Mofei Qian",
                    "email": "glancedemo3@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["UX", "Design Language", "IOS", "Nexus", "NX-OS", "XR", "IOS", "ISG", "Testing", "Scripting", "Perl", "Tcl", "Linux"],
                    "title": "DESIGNER.USER EXPERIENCE",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.015+0800",
                    "created": 1452677305015,
                    "updated": 1452677305015,
                    "skills": ["UX", "Design Language"],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo4",
                    "name": "Stacy Ling",
                    "email": "glancedemo4@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["UX", "Design", "Data Centerv", "DevNet"],
                    "title": "DESIGNER.USER EXPERIENCE",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.018+0800",
                    "created": 1452677305018,
                    "updated": 1452677305018,
                    "skills": ["Network", "TCP/IP"],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo5",
                    "name": "Haihua Xiao",
                    "email": "glancedemo5@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Cloud", "DevNet", "JSON", "Unix", "Linux", "C/C++", "Java"],
                    "title": "TECHNICAL LEADER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.035+0800",
                    "created": 1452677305035,
                    "updated": 1452677305035,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo6",
                    "name": "Yu Shen",
                    "email": "glancedemo6@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Cloud", "Python", "UC", "Call Center Express", "CCX", "Unity", "Unified Messaging", "Voicemail"],
                    "title": "TECHNICAL LEADER.SOFTWARE ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.030+0800",
                    "created": 1452677305030,
                    "updated": 1452677305030,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo7",
                    "name": "Kenny Chen",
                    "email": "glancedemo7@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Cloud", "Python", "C++", "Conductor", "Networking", "videoconferencing", "CUCM sizing"],
                    "title": "TECHNICAL LEADER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.059+0800",
                    "created": 1452677305059,
                    "updated": 1452677305059,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo8",
                    "name": "Glance Demo 8",
                    "email": "glancedemo8@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Learning Development"],
                    "title": "ENGINEER.CONTENT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.032+0800",
                    "created": 1452677305032,
                    "updated": 1452677305032,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo9",
                    "name": "Glance Demo 9",
                    "email": "glancedemo9@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Marketing", "NCS", "US"],
                    "title": "PRINCIPAL ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.017+0800",
                    "created": 1452677305017,
                    "updated": 1452677305017,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo10",
                    "name": "Glance Demo 10",
                    "email": "glancedemo10@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["nexus 5000 & 2000", "nx-os", "nexus 3000"],
                    "title": "PRODUCT MANAGER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.017+0800",
                    "created": 1452677305017,
                    "updated": 1452677305017,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo11",
                    "name": "Glance Demo 11",
                    "email": "glancedemo11@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Enterprise Switching", "PM - US", "Product Management"],
                    "title": "PRODUCT MANAGER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T16:11:02.849+0800",
                    "created": 1452672962850,
                    "updated": 1452672962850,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo12",
                    "name": "Glance Demo 12",
                    "email": "glancedemo12@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "Security", "# 23434"],
                    "title": "ENGINEER.CUSTOMER SUPPORT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.038+0800",
                    "created": 1452677305038,
                    "updated": 1452677305038,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo13",
                    "name": "Glance Demo 13",
                    "email": "glancedemo13@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["ScanSafe Web Intelligence Reporting", "WIRe", "training & delvelopment", "elearning design & development"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.036+0800",
                    "created": 1452677305036,
                    "updated": 1452677305036,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo14",
                    "name": "Glance Demo 14",
                    "email": "glancedemo14@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["MEDIA", "Service Provider"],
                    "title": "SYSTEMS ENGINEER.SP SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.016+0800",
                    "created": 1452677305016,
                    "updated": 1452677305016,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo15",
                    "name": "Glance Demo 15",
                    "email": "glancedemo15@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "AS", "Broadband Cable", "DOCSIS", "Cable Modem", "UBR10K", "UBR7246VXR", "Mandarin", "Technical Support", "BSOD", "DOCSIS", "Channel Bonding"],
                    "title": "ENGINEER.NETWORK CONSULTING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.021+0800",
                    "created": 1452677305021,
                    "updated": 1452677305021,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo16",
                    "name": "Glance Demo 16",
                    "email": "glancedemo16@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["JabberWinDemo", "JabberiPadDemo", "Jabber", "CUP", "Presence", "Lync", "OCS", "ocs 2007 r2"],
                    "title": "CONSULTING SYSTEMS ENGINEER.SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.027+0800",
                    "created": 1452677305027,
                    "updated": 1452677305027,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo17",
                    "name": "Glance Demo 17",
                    "email": "glancedemo17@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Server Architecture", "Server Virtualisation", "Clustering Technologies", "Ex Egenera", "Ex Dell OEM", "Ex Fujitsu OEM", "Ex Stratus", "Unified Computing - UCS", "Total Cost of Ownership", "TCO Analysis", "Desktop Virtualization", "IoT"],
                    "title": "DIRECTOR.BUSINESS DEVELOPMENT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.082+0800",
                    "created": 1452677305082,
                    "updated": 1452677305082,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo18",
                    "name": "Glance Demo 18",
                    "email": "glancedemo18@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE#28081", "Routing and Switching", "Application Control Engine", "ACE", "Global Site Selector", "GSS", "Application Network Manager", "ANM", "WAAS", "nexus", "UCS", "citrix & vmware"],
                    "title": "TECHNICAL LEADER.SERVICES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.064+0800",
                    "created": 1452677305064,
                    "updated": 1452677305064,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo19",
                    "name": "Glance Demo 19",
                    "email": "glancedemo19@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["UCS", "GPU", "VDI", "BIOS", "UCSM", "Datacenter", "Nexus1000v", "Citrix", "WAAS", "Competitive", "vmware", "virtualization & cloud computing"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.076+0800",
                    "created": 1452677305076,
                    "updated": 1452677305076,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo20",
                    "name": "Glance Demo 20",
                    "email": "glancedemo20@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Manufacturing", "industrial ethernet", "Open Device Vendor`s Association", "ODVA", "IE3000", "Industrial Security", "Industrial Automation"],
                    "title": "ARCHITECT.COMMUNICATIONS",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.066+0800",
                    "created": 1452677305066,
                    "updated": 1452677305066,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo21",
                    "name": "Glance Demo 21",
                    "email": "glancedemo21@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Enterprise Switching", "PM - US", "Product Management"],
                    "title": "PRODUCT MANAGER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T16:11:02.849+0800",
                    "created": 1452672962850,
                    "updated": 1452672962850,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo22",
                    "name": "Glance Demo 22",
                    "email": "glancedemo22@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "Security", "# 23434"],
                    "title": "ENGINEER.CUSTOMER SUPPORT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.038+0800",
                    "created": 1452677305038,
                    "updated": 1452677305038,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo23",
                    "name": "Glance Demo 23",
                    "email": "glancedemo23@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["ScanSafe Web Intelligence Reporting", "WIRe", "training & delvelopment", "elearning design & development"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.036+0800",
                    "created": 1452677305036,
                    "updated": 1452677305036,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo24",
                    "name": "Glance Demo 24",
                    "email": "glancedemo24@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["MEDIA", "Service Provider"],
                    "title": "SYSTEMS ENGINEER.SP SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.016+0800",
                    "created": 1452677305016,
                    "updated": 1452677305016,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo25",
                    "name": "Glance Demo 25",
                    "email": "glancedemo25@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "AS", "Broadband Cable", "DOCSIS", "Cable Modem", "UBR10K", "UBR7246VXR", "Mandarin", "Technical Support", "BSOD", "DOCSIS", "Channel Bonding"],
                    "title": "ENGINEER.NETWORK CONSULTING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.021+0800",
                    "created": 1452677305021,
                    "updated": 1452677305021,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo26",
                    "name": "Glance Demo 26",
                    "email": "glancedemo26@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["JabberWinDemo", "JabberiPadDemo", "Jabber", "CUP", "Presence", "Lync", "OCS", "ocs 2007 r2"],
                    "title": "CONSULTING SYSTEMS ENGINEER.SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.027+0800",
                    "created": 1452677305027,
                    "updated": 1452677305027,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo27",
                    "name": "Glance Demo 27",
                    "email": "glancedemo27@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Server Architecture", "Server Virtualisation", "Clustering Technologies", "Ex Egenera", "Ex Dell OEM", "Ex Fujitsu OEM", "Ex Stratus", "Unified Computing - UCS", "Total Cost of Ownership", "TCO Analysis", "Desktop Virtualization", "IoT"],
                    "title": "DIRECTOR.BUSINESS DEVELOPMENT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.082+0800",
                    "created": 1452677305082,
                    "updated": 1452677305082,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo28",
                    "name": "Glance Demo 28",
                    "email": "glancedemo28@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE#28081", "Routing and Switching", "Application Control Engine", "ACE", "Global Site Selector", "GSS", "Application Network Manager", "ANM", "WAAS", "nexus", "UCS", "citrix & vmware"],
                    "title": "TECHNICAL LEADER.SERVICES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.064+0800",
                    "created": 1452677305064,
                    "updated": 1452677305064,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo29",
                    "name": "Glance Demo 29",
                    "email": "glancedemo29@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["UCS", "GPU", "VDI", "BIOS", "UCSM", "Datacenter", "Nexus1000v", "Citrix", "WAAS", "Competitive", "vmware", "virtualization & cloud computing"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.076+0800",
                    "created": 1452677305076,
                    "updated": 1452677305076,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo30",
                    "name": "Glance Demo 30",
                    "email": "glancedemo30@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Manufacturing", "industrial ethernet", "Open Device Vendor`s Association", "ODVA", "IE3000", "Industrial Security", "Industrial Automation"],
                    "title": "ARCHITECT.COMMUNICATIONS",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.066+0800",
                    "created": 1452677305066,
                    "updated": 1452677305066,
                    "skills": [""],
                    "position": [0, 0]
                },{
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo31",
                    "name": "Glance Demo 31",
                    "email": "glancedemo31@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Enterprise Switching", "PM - US", "Product Management"],
                    "title": "PRODUCT MANAGER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T16:11:02.849+0800",
                    "created": 1452672962850,
                    "updated": 1452672962850,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo32",
                    "name": "Glance Demo 32",
                    "email": "glancedemo32@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "Security", "# 23434"],
                    "title": "ENGINEER.CUSTOMER SUPPORT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.038+0800",
                    "created": 1452677305038,
                    "updated": 1452677305038,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo33",
                    "name": "Glance Demo 33",
                    "email": "glancedemo33@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["ScanSafe Web Intelligence Reporting", "WIRe", "training & delvelopment", "elearning design & development"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.036+0800",
                    "created": 1452677305036,
                    "updated": 1452677305036,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo34",
                    "name": "Glance Demo 34",
                    "email": "glancedemo34@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["MEDIA", "Service Provider"],
                    "title": "SYSTEMS ENGINEER.SP SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.016+0800",
                    "created": 1452677305016,
                    "updated": 1452677305016,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo35",
                    "name": "Glance Demo 35",
                    "email": "glancedemo35@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "AS", "Broadband Cable", "DOCSIS", "Cable Modem", "UBR10K", "UBR7246VXR", "Mandarin", "Technical Support", "BSOD", "DOCSIS", "Channel Bonding"],
                    "title": "ENGINEER.NETWORK CONSULTING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.021+0800",
                    "created": 1452677305021,
                    "updated": 1452677305021,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo36",
                    "name": "Glance Demo 36",
                    "email": "glancedemo36@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["JabberWinDemo", "JabberiPadDemo", "Jabber", "CUP", "Presence", "Lync", "OCS", "ocs 2007 r2"],
                    "title": "CONSULTING SYSTEMS ENGINEER.SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.027+0800",
                    "created": 1452677305027,
                    "updated": 1452677305027,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo37",
                    "name": "Glance Demo 37",
                    "email": "glancedemo37@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Server Architecture", "Server Virtualisation", "Clustering Technologies", "Ex Egenera", "Ex Dell OEM", "Ex Fujitsu OEM", "Ex Stratus", "Unified Computing - UCS", "Total Cost of Ownership", "TCO Analysis", "Desktop Virtualization", "IoT"],
                    "title": "DIRECTOR.BUSINESS DEVELOPMENT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.082+0800",
                    "created": 1452677305082,
                    "updated": 1452677305082,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo38",
                    "name": "Glance Demo 38",
                    "email": "glancedemo38@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE#28081", "Routing and Switching", "Application Control Engine", "ACE", "Global Site Selector", "GSS", "Application Network Manager", "ANM", "WAAS", "nexus", "UCS", "citrix & vmware"],
                    "title": "TECHNICAL LEADER.SERVICES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.064+0800",
                    "created": 1452677305064,
                    "updated": 1452677305064,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo39",
                    "name": "Glance Demo 39",
                    "email": "glancedemo39@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["UCS", "GPU", "VDI", "BIOS", "UCSM", "Datacenter", "Nexus1000v", "Citrix", "WAAS", "Competitive", "vmware", "virtualization & cloud computing"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.076+0800",
                    "created": 1452677305076,
                    "updated": 1452677305076,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo40",
                    "name": "Glance Demo 40",
                    "email": "glancedemo40@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Manufacturing", "industrial ethernet", "Open Device Vendor`s Association", "ODVA", "IE3000", "Industrial Security", "Industrial Automation"],
                    "title": "ARCHITECT.COMMUNICATIONS",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.066+0800",
                    "created": 1452677305066,
                    "updated": 1452677305066,
                    "skills": [""],
                    "position": [0, 0]
                },{
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo41",
                    "name": "Glance Demo 41",
                    "email": "glancedemo41@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Enterprise Switching", "PM - US", "Product Management"],
                    "title": "PRODUCT MANAGER.ENGINEERING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T16:11:02.849+0800",
                    "created": 1452672962850,
                    "updated": 1452672962850,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo42",
                    "name": "Glance Demo 42",
                    "email": "glancedemo42@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "Security", "# 23434"],
                    "title": "ENGINEER.CUSTOMER SUPPORT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.038+0800",
                    "created": 1452677305038,
                    "updated": 1452677305038,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo43",
                    "name": "Glance Demo 43",
                    "email": "glancedemo43@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["ScanSafe Web Intelligence Reporting", "WIRe", "training & delvelopment", "elearning design & development"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.036+0800",
                    "created": 1452677305036,
                    "updated": 1452677305036,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo44",
                    "name": "Glance Demo 44",
                    "email": "glancedemo44@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["MEDIA", "Service Provider"],
                    "title": "SYSTEMS ENGINEER.SP SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.016+0800",
                    "created": 1452677305016,
                    "updated": 1452677305016,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo45",
                    "name": "Glance Demo 45",
                    "email": "glancedemo45@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE", "AS", "Broadband Cable", "DOCSIS", "Cable Modem", "UBR10K", "UBR7246VXR", "Mandarin", "Technical Support", "BSOD", "DOCSIS", "Channel Bonding"],
                    "title": "ENGINEER.NETWORK CONSULTING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.021+0800",
                    "created": 1452677305021,
                    "updated": 1452677305021,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo46",
                    "name": "Glance Demo 46",
                    "email": "glancedemo46@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["JabberWinDemo", "JabberiPadDemo", "Jabber", "CUP", "Presence", "Lync", "OCS", "ocs 2007 r2"],
                    "title": "CONSULTING SYSTEMS ENGINEER.SALES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.027+0800",
                    "created": 1452677305027,
                    "updated": 1452677305027,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo47",
                    "name": "Glance Demo 47",
                    "email": "glancedemo47@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Server Architecture", "Server Virtualisation", "Clustering Technologies", "Ex Egenera", "Ex Dell OEM", "Ex Fujitsu OEM", "Ex Stratus", "Unified Computing - UCS", "Total Cost of Ownership", "TCO Analysis", "Desktop Virtualization", "IoT"],
                    "title": "DIRECTOR.BUSINESS DEVELOPMENT",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.082+0800",
                    "created": 1452677305082,
                    "updated": 1452677305082,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo48",
                    "name": "Glance Demo 48",
                    "email": "glancedemo48@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["CCIE#28081", "Routing and Switching", "Application Control Engine", "ACE", "Global Site Selector", "GSS", "Application Network Manager", "ANM", "WAAS", "nexus", "UCS", "citrix & vmware"],
                    "title": "TECHNICAL LEADER.SERVICES",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.064+0800",
                    "created": 1452677305064,
                    "updated": 1452677305064,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo49",
                    "name": "Glance Demo 49",
                    "email": "glancedemo49@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["UCS", "GPU", "VDI", "BIOS", "UCSM", "Datacenter", "Nexus1000v", "Citrix", "WAAS", "Competitive", "vmware", "virtualization & cloud computing"],
                    "title": "ENGINEER.TECHNICAL MARKETING",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.076+0800",
                    "created": 1452677305076,
                    "updated": 1452677305076,
                    "skills": [""],
                    "position": [0, 0]
                }, {
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo50",
                    "name": "Glance Demo 50",
                    "email": "glancedemo50@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["Manufacturing", "industrial ethernet", "Open Device Vendor`s Association", "ODVA", "IE3000", "Industrial Security", "Industrial Automation"],
                    "title": "ARCHITECT.COMMUNICATIONS",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.066+0800",
                    "created": 1452677305066,
                    "updated": 1452677305066,
                    "skills": [""],
                    "position": [0, 0]
                },{
                    "category": "expert",
                    "glanceOrgId": "cisco",
                    "glanceUserId": "glance",
                    "id": "glancedemo51",
                    "name": "Sean Curtis",
                    "email": "glancedemo51@glancedemo.cisco.com",
                    "phoneNumber": "+1123456789",
                    "topics": ["The Demo Guy"],
                    "title": "DIRECTOR.MGMT-MKT-TECH MKT COMMS",
                    "bio": "",
                    "avatar": "",
                    "macAddress": "",
                    "status": 0,
                    "checkout": 0,
                    "tags": [],
                    "properties": {},
                    "lastNotified": "2016-01-13T17:23:25.091+0800",
                    "created": 1452677305091,
                    "updated": 1452677305091,
                    "skills": [""],
                    "position": [0, 0]
                }];

                var RANDOM_FLOOR_START = 0;
                var RANDOM_FLOOR_COUNT = 1;
                var RANDOM_PEOPLE = 10;
                var RANDOM_LAPTOP = 2;
                var RANDOM_PAD = 2;
                var RANDOM_PHONE = 2;
                var RANDOM_PRINTER = 4;
                var RANDOM_WIFI = 4;

                join = (function() {
                    var i, join = [];
                    for (i = 0; i < RANDOM_PEOPLE; i++) {
                        join.push({
                            id: register[i].id,
                            buildingId: "building-glance",
                            floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                            position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100]
                        });
                    }
                    for (i = 0; i < RANDOM_LAPTOP; i++) {
                        join.push({
                            category: "laptop",
                            id: "Laptop " + (i + 1),
                            name: "MacBook Pro",
                            buildingId: "building-glance",
                            floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                            position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100]
                        });
                    }
                    for (i = 0; i < RANDOM_PAD; i++) {
                        join.push({
                            category: "pad",
                            id: "Pad " + (i + 1),
                            name: "iPad Pro",
                            buildingId: "building-glance",
                            floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                            position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100]
                        });
                    }
                    for (i = 0; i < RANDOM_PHONE; i++) {
                        join.push({
                            category: "phone",
                            id: "Phone " + (i + 1),
                            name: "iPhone 6S",
                            buildingId: "building-glance",
                            floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                            position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100]
                        });
                    }
                    for (i = 0; i < RANDOM_PRINTER; i++) {
                        join.push({
                            category: "printer",
                            id: "Printer " + (i + 1),
                            name: "Xerox",
                            buildingId: "building-glance",
                            floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                            position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100]
                        });
                    }
                    for (i = 0; i < RANDOM_WIFI; i++) {
                        join.push({
                            category: "wifi",
                            id: "Hotpoint " + (i + 1),
                            name: "Cisco Router",
                            buildingId: "building-glance",
                            floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                            position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100]
                        });
                    }
                    join.push({
                        category: "mark",
                        id: "printer-3",
                        name: "Printer 3",
                        buildingId: "building-glance",
                        floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                        position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100],
                        description: "<strong>Printer</strong><br/>Yes, this is a printer."
                    });
                    return join;
                })();

                movement = (function() {
                    return function() {
                        var movements = [];
                        if (nx.path(app, "onlines")) {
                            var onlines = app.onlines();
                            var total = onlines.length();
                            var count = Math.floor(total / 3);
                            var model, id, category, position = Math.floor(Math.random() * (total - count));
                            while (count) {
                                model = onlines.get(position + count);
                                category = model.category();
                                id = model.id();
                                if (id !== "scurtis" && category !== "wifi" && category !== "printer" && category !== "zone" && category !== "facility") {
                                    movements.push({
                                        id: id,
                                        buildingId: "building-glance",
                                        floorId: floors[Math.floor(Math.random() * RANDOM_FLOOR_COUNT) + RANDOM_FLOOR_START].floorId,
                                        position: [Math.random() * (WIDTH - 200) + 100, Math.random() * (HEIGHT - 200) + 100]
                                    });
                                }
                                count--;
                            }
                        }
                        return movements;
                    };
                })();

                var other_buildings = (function() {
                    var i, j, floors, buildings = [];
                    var LIMIT = 3;
                    var THICKNESS = 6;
                    var x0 = -LIMIT - THICKNESS;
                    var xt = LIMIT - 1;
                    var random_floors = function(mapname, from, to) {
                        var floors = [];
                        var LIMIT = 2;
                        var random, i, n = from;
                        if (from !== to) {
                            random = Math.random();
                            n = (to - from) * random;
                        }
                        for (i = 0; i < n; i++) {
                            floors.push({
                                floorId: nx.uuid(true),
                                floorName: "",
                                mapName: mapname
                            });
                        }
                        return floors;
                    };
                    for (i = x0; i < xt; i++) {
                        for (j = x0; j < xt; j++) {
                            if (i + j >= -2 || i + j < -2 - THICKNESS) {
                                continue;
                            }
                            if (i == -2 && j == -2) {
                                floors = random_floors("normal-cisco-shn15-other", 13, 13);
                                floors.push({
                                    floorId: "cisco-shn15-15a",
                                    floorName: "",
                                    mapName: "normal-cisco-shn15-15a"
                                });
                                buildings.push({
                                    buildingId: "building-shn15",
                                    position: [WIDTH * i, -HEIGHT * j],
                                    width: WIDTH,
                                    depth: HEIGHT,
                                    floors: floors
                                });
                                continue;
                            }
                            if (i == -2 && j == -1) {
                                buildings.push({
                                    buildingId: "building_statium",
                                    position: [WIDTH * i, -HEIGHT * j],
                                    width: WIDTH,
                                    depth: HEIGHT,
                                    floors: floors_stadium
                                });
                                continue;
                            }
                            buildings.push({
                                buildingId: nx.uuid(true),
                                position: [WIDTH * i, -HEIGHT * j],
                                width: WIDTH,
                                depth: HEIGHT,
                                floors: random_floors("normal-test-building", 3, 5)
                            });
                        }
                    }
                    return buildings;
                })();
                // fire the service messages
                service.fire("message", {
                    uiConfig: {
                        logoUrl: "glance/icon-glance.png",
                        title: "Glance"
                    },
                    campus: {
                        campusId: "campus-1",
                        buildings: [{
                            buildingId: "building-glance",
                            position: [0, 0],
                            width: WIDTH,
                            depth: HEIGHT,
                            floors: floors
                        }] //  .concat(other_buildings)
                    },
                    total: Math.floor(Math.random() * 10086) + 10086,
                    register: register,
                    join: join,
                    whoami: EXPORT.whoami,
                    zones: {
                        "floor-1": {
                            "zone-nw": {
                                "zoneDisplayName": "Zone North-W",
                                "zoneName": "Zone North-W",
                                "zoneCount": 0,
                                "showLabel": false
                            },
                            "zone-n": {
                                "zoneDisplayName": "Zone North",
                                "zoneName": "Zone North",
                                "zoneCount": 200
                            },
                            "zone-ne": {
                                "zoneDisplayName": "Zone North-E",
                                "zoneName": "Zone North-E",
                                "zoneCount": 5
                            },
                            "zone-s": {
                                "zoneDisplayName": "Zone South",
                                "zoneName": "Zone South",
                                "zoneCount": 4000
                            },
                            "zone-se": {
                                "zoneDisplayName": "Zone South-E",
                                "zoneName": "Zone South-E",
                                "zoneCount": 0
                            },
                            "zone-e": {
                                "zoneDisplayName": "Zone East",
                                "zoneName": "Zone East",
                                "zoneCount": 60
                            }
                        }
                    }
                });
                service.fire("message", {
                    join: [{
                        id: "scurtis",
                        buildingId: "building-glance",
                        floorId: "floor-glance",
                        position: [1760, 410]
                    }]
                });
                nx.timer(5000, function(again) {
                    service.fire("message", {
                        total: Math.floor(Math.random() * 10086) + 10086,
                        movement: movement(),
                        avatar: ["scurtis"]
                    });
                    again();
                });
                window.glance.mockup = {
                    receive: function(message) {
                        service.fire("message", message);
                    }
                };
            }
        }
    });
})(nx);
