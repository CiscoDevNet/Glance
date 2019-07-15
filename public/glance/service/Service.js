(function(nx) {
    var EXPORT = nx.define("glance.service.Service", {
        properties: {
            autoconnect: false,
            api: function() {
                return new glance.service.Api();
            },
            clientType: "glance",
            socket: {
                dependencies: "api, clientType, autoconnect",
                async: true,
                value: function(async, api, clientType, autoconnect) {
                    if (api && autoconnect) {
                        this.connect(api, function(socket) {
                            async.set(socket);
                            socket.send({
                                clientType: clientType || "glance"
                            });
                        });
                    }
                }
            }
        },
        methods: {
            init: function(clientType, autoconnect) {
                this.inherited();
                this.clientType(clientType);
                this.autoconnect(autoconnect);
            },
            connect: function(api, callback, retry) {
                var self = this;
                var socket = new WebSocket(api.getSocketUrl());
                socket.onopen = function() {
                    callback(socket);
                };
                socket.onmessage = function(evt) {
                    self.fire("message", JSON.parse(evt.data));
                };
                socket.onerror = function() {
                    retry = retry || 1000;
                    nx.timer(retry * 2, function() {
                        self.connect(api, callback, retry * 2);
                    });
                };
                return socket;
            },
            send: function(message) {
                this.socket() && this.socket().send(JSON.stringify(message));
            }
        }
    });
})(nx);
