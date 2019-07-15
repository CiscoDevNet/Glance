(function(nx) {
    var EXPORT = nx.define("glance.service.Api", {
        properties: {
            server: {
                value: function() {
                    return window.location.host;
                }
            },
            schema: {
                value: function() {
                    return window.location.protocol + "//";
                }
            }
        },
        methods: {
            getLargeAvatarUrl: function(person) {
                if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                    return person && "avatar/" + nx.path(person, "id") + ".jpg";
                }
                return person && this.schema() + this.server() + "/api/v1/image/avatar/large/" + nx.path(person, "id");
                return person && "http://www.glancedemo.com/dir/photo/zoom/" + nx.path(person, "id") + ".jpg";
                //return person && "https://" + this.server() + "/image/avatar/small/" + nx.path(person, "id");
            },
            getSmallAvatarUrl: function(person) {
                if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                    return person && "avatar/" + nx.path(person, "id") + ".jpg";
                }
                return person && this.schema() + this.server() + "/api/v1/image/avatar/small/" + nx.path(person, "id");
                return person && "http://www.glancedemo.com/dir/photo/std/" + nx.path(person, "id") + ".jpg";
                //return person && "https://" + this.server() + "/image/avatar/small/" + nx.path(person, "id");
            },
            getNotifyUrl: function(person) {
                return this.schema() + this.server() + "/api/v1/sms/" + nx.path(person, "phoneNumber");
                //return "https://" + this.server() + "/api/v1/sms/" + nx.path(person, "phoneNumber");
            },
            getCheckUrl: function(person) {
                return this.schema() + this.server() + "/api/v1/check/" + nx.path(person, "id");
                //return "https://" + this.server() + "/api/v1/check/" + nx.path(person, "id");
            },
            getSocketUrl: function() {
                if (this.schema() == "https://")
                    return "wss://" + this.server() + "/glance";
                else
                    return "ws://" + this.server() + "/glance";
            },
            getMapRegisterUrl: function() {
                return this.schema() + this.server() + "/api/v1/map/register";
            },
            getBackupUrl: function() {
                return this.schema() + this.server() + "/api/v1/console/backup";
            },
            getPersonListUrl: function() {
                return this.schema() + this.server() + "/api/persons/glance/all";
                //return "https://" + this.server() + "/api/persons/glance/all";
            },
            getPersonRegisterUrl: function() {
                return this.schema() + this.server() + "/api/persons/add";
            },
            getHandWriteUrl: function() {
                return this.schema() + this.server() + "/api/handwriting/recognize";
            },
            getHeatmapUrl: function() {
                return this.schema() + this.server() + "/api/v1/visitors/heatmap/all";
            },
            getSendMessageUrl: function(type, receiver, message) {
                switch (type) {
                    case "spark":
                        return this.schema() + this.server() + "/api/v1/message/spark/" + receiver + "/" + message;
                    case "sms":
                        return this.schema() + this.server() + "/api/v1/message/sms/" + receiver + "/" + message;
                }
                throw new Error("Unsupport message type.");
            },
            getBleListUrl: function() {
                return this.schema() + this.server() + "/api/v1/device_alias";
            },
            getUserItemUrl: function(id) {
                return this.schema() + this.server() + "/api/v1/glanceuser/deviceid/" + id;
            },
            getUserListUrl: function() {
                return this.schema() + this.server() + "/api/v1/experts/glance/all";
            }
        }
    });
    nx.path(nx.global, "glance.service.api", new EXPORT());
})(nx);
