(function(nx) {
    var EXPORT = nx.define("glance.common.Service", {
        properties: {
            server: {
                value: function() {
                    return window.location.host;
                }
            },
            timer: {
                value: function() {
                    return new glance.common.Timer(10000);
                }
            }
        },
        methods: {
            getLargeAvatarUrl: function(expert) {
                return expert && window.location.protocol + "//" + this.server() + "/api/v1/image/avatar/small/" + nx.path(expert, "id");
            },
            getSmallAvatarUrl: function(expert) {
                return expert && window.location.protocol + "//" + this.server() + "/api/v1/image/avatar/small/" + nx.path(expert, "id");
            },
            getNotifyUrl: function(expert) {
                return window.location.protocol + "//" + this.server() + "/api/v1/sms/" + nx.path(expert, "phoneNumber");
            },
            getCheckUrl: function(expert) {
                return window.location.protocol + "//" + this.server() + "/api/v1/check/" + nx.path(expert, "id");
            },
            getSocketUrl: function() {
                if (window.location.protocol + "//" == "https://")
                    return "wss://" + this.server() + "/glance";
                else
                    return "ws://" + this.server() + "/glance";
                //return "ws://" + this.server() + "/glance";
                // return "ws://" + this.server() + "/experts/any";
            },
            getMapRegisterUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/map/register";
                // return "ws://" + this.server() + "/experts/any";
            },
            getBackupUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/console/backup";
                // return "ws://" + this.server() + "/experts/any";
            },
            getExpertListUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/experts/glance/all";
            },
            getExpertRegisterUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/experts/add";
            },
            getHandWriteUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/handwriting/recognize";
            },
            getGlobalSetupUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/system/config";
            },
            getFloorSetupUrl: function(id) {
                return window.location.protocol + "//" + this.server() + "/api/v1/system/floor/" + id;
            },
            getFloorListUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/system/floor";
            },
            getCmxTestUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/system/cmxtest";
            },
            getBackupTemplateUrl: function() {
                return window.location.protocol + "//" + this.server() + "/api/v1/template/glancefile";
            }
        }
    });
})(nx);
