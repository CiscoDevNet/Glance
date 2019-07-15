(function(nx) {
    var EXPORT = nx.define("devme.admin.Setup", nx.ui.Element, {
        view: {
            cssclass: "glance-admin-page glance-admin-page-setup",
            cssstyle: {
                display: nx.binding("global.app.service.page", function(page) {
                    return page === "setup" ? "block" : "none";
                })
            },
            content: [{
                name: "globalForm",
                type: "nx.ui.tag.Form",
                cssclass: "form",
                cssstyle: {
                    "display": nx.binding("active", function(active) {
                        return active ? "none" : "";
                    })
                },
                attributes: {
                    action: nx.binding("global.app.service", function(service) {
                        return service && service.getGlobalSetupUrl && service.getGlobalSetupUrl();
                    }),
                    method: "POST",
                    enctype: "multipart/form-data"
                },
                content: [{
                    type: "nx.ui.tag.InputHidden",
                    attributes: {
                        name: "url",
                        value: nx.binding("global.app.service.page", function() {
                            return window.location.href;
                        })
                    }
                }, {
                    cssclass: "group",
                    content: [{
                        cssclass: "title",
                        content: "Floors"
                    }, {
                        cssclass: "list",
                        content: {
                            repeat: "{floors}",
                            cssclass: "item",
                            content: [{
                                cssclass: "index",
                                content: nx.binding("scope.index", function(index) {
                                    return index + 1;
                                })
                            }, {
                                cssclass: "name",
                                content: "{scope.model.floorName}"
                            }],
                            capture: {
                                tap: function() {
                                    var context = nx.path(this, "scope.context");
                                    var model = nx.path(this, "scope.model");
                                    context.active(model);
                                }
                            }
                        }
                    }]
                }, {
                    repeat: "{globalFields}",
                    cssclass: "group group-{scope.model.group}",
                    content: [{
                        cssclass: "title",
                        content: "{scope.model.group}"
                    }, {
                        repeat: "{scope.model.keys}",
                        cssclass: "field",
                        content: [{
                            type: "nx.ui.tag.Label",
                            attributes: {
                                for: "{scope.model.key}"
                            },
                            content: ["{scope.model.label}", ":"]
                        }, {
                            type: "nx.lib.component.NormalInput",
                            properties: {
                                id: "{scope.model.key}",
                                name: "{scope.model.key}",
                                value: nx.binding("scope.model.key", function(key) {
                                    return nx.binding("scope.context.scope.context.globalSettings." + key, function(value) {
                                        if (nx.is(value, "Number") || nx.is(value, "Boolean")) {
                                            return "" + value;
                                        }
                                        return value || "";
                                    });
                                })
                            }
                        }]
                    }, {
                        cssclass: "button button-test",
                        cssstyle: {
                            display: nx.binding("scope.model.testUrl", function(testUrl) {
                                return testUrl ? "block" : "none";
                            })
                        },
                        content: "Validate",
                        capture: {
                            tap: function(sender, evt) {
                                var context = nx.path(this, "scope.context");
                                var model = nx.path(this, "scope.model");
                                context.onTest(sender, model);
                            }
                        }
                    }]
                }]
            }, {
                name: "form",
                type: "nx.ui.tag.Form",
                cssclass: "form floor-form",
                cssstyle: {
                    "display": nx.binding("active", function(active) {
                        return active ? "block" : "none";
                    })
                },
                attributes: {
                    action: nx.binding("global.app.service, active.floorId", function(service, id) {
                        return service && service.getFloorSetupUrl && service.getFloorSetupUrl(id);
                    }),
                    method: "POST",
                    enctype: "multipart/form-data"
                },
                content: [{
                    type: "nx.ui.tag.InputHidden",
                    attributes: {
                        name: "url",
                        value: nx.binding("global.app.service.page", function() {
                            return window.location.href;
                        })
                    }
                }, {
                    repeat: "{floorFields}",
                    cssclass: "group",
                    content: [{
                        cssclass: "title",
                        content: "{scope.model.group}"
                    }, {
                        repeat: "{scope.model.keys}",
                        cssclass: "field",
                        content: [{
                            type: "nx.ui.tag.Label",
                            attributes: {
                                for: "{scope.model.key}"
                            },
                            content: ["{scope.model.label}", ":"]
                        }, {
                            type: "nx.lib.component.NormalInput",
                            properties: {
                                id: "{scope.model.key}",
                                name: "{scope.model.key}",
                                value: nx.binding("scope.model.key", function(key) {
                                    return nx.binding("scope.context.scope.context.active." + key, function(value) {
                                        if (nx.is(value, "Number") || nx.is(value, "Boolean")) {
                                            return "" + value;
                                        }
                                        return value || "";
                                    });
                                })
                            }
                        }]
                    }]
                }]
            }, {
                cssclass: "button",
                content: "Save",
                events: {
                    "mousedown touchstart": function(sender, evt) {
                        if (!sender.hasClass("disabled") && evt.capture(sender, ["tap", "end"])) {
                            sender.toggleClass("active", true);
                        }
                    },
                    captureend: function(sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function(sender, evt) {
                        if (this.active()) {
                            this.form().dom().submit();
                        } else {
                            this.globalForm().dom().submit();
                        }
                    }
                }
            }, {
                cssclass: "button button-cancel",
                content: "Cancel",
                events: {
                    "mousedown touchstart": function(sender, evt) {
                        evt.capture(sender, "tap");
                    },
                    capturetap: function(sender, evt) {
                        if (this.active()) {
                            this.active(null);
                        } else {
                            this.fire("close");
                        }
                    }
                }
            }]
        },
        properties: {
            globalSettings: nx.binding("global.app.service", true, function(async, service) {
                if (service) {
                    nx.util.ajax({
                        url: service.getGlobalSetupUrl(),
                        success: function(resources, response) {
                            async.set(response.data)
                        },
                        error: function() {
                            // TODO error handler
                            async.set({
                                receiverProtocol: "http",
                                receiverHostName: "",
                                receiverHostPort: "80",
                                defaultTimezone: "-0700",
                                cmxHost: "",
                                cmxPort: "443",
                                cmxProtocol: "https",
                                cmxUserName: "",
                                cmxPassword: "",
                                cmxTimezone: "-0700",
                                tropoAuthToken: ""
                            });
                        }
                    });
                }
            }),
            floors: nx.binding("global.app.service", true, function(async, service) {
                if (service) {
                    nx.util.ajax({
                        url: service.getFloorListUrl(),
                        success: function(resources, response) {
                            async.set(response.data)
                        },
                        error: function() {
                            // TODO error handler
                            async.set([{
                                floorId: nx.uuid(),
                                floorName: "F1",
                                hierarchy: "",
                                mapName: "normal-glance",
                                swapXY: false,
                                cmxPositionAmplifyX: 0,
                                cmxPositionAmplifyY: 0,
                                cmxPositionPlusX: 0,
                                cmxPositionPlusY: 0
                            }, {
                                floorId: nx.uuid(),
                                floorName: "F2"
                            }]);
                        }
                    });
                }
            }),
            active: null,
            globalFields: function() {
                var service = nx.path(nx.global, "app.service");
                return [{
                    group: "GLANCE Receiver",
                    keys: [{
                        key: "receiverProtocol",
                        label: "Protocol"
                    }, {
                        key: "receiverHostName",
                        label: "Host"
                    }, {
                        key: "receiverHostPort",
                        label: "Port"
                    }, {
                        key: "defaultTimezone",
                        label: "Default Timezone"
                    }]
                }, {
                    group: "CMX",
                    testUrl: service && service.getCmxTestUrl(),
                    keys: [{
                        key: "cmxHost",
                        label: "Host"
                    }, {
                        key: "cmxPort",
                        label: "Port"
                    }, {
                        key: "cmxProtocol",
                        label: "Protocol"
                    }, {
                        key: "cmxUserName",
                        label: "User Name"
                    }, {
                        key: "cmxPassword",
                        label: "Password"
                    }, {
                        key: "cmxTimezone",
                        label: "Timezone"
                    }]
                }, {
                    group: "Tropo",
                    keys: [{
                        key: "tropoAuthToken",
                        label: "Auth Token"
                    }]
                }];
            },
            floorFields: function() {
                return [{
                    group: "Floor",
                    keys: [{
                        key: "floorId",
                        label: "ID",
                        readonly: true
                    }, {
                        key: "floorName",
                        label: "Name"
                    }, {
                        key: "hierarchy",
                        label: "Hierarchy"
                    }, {
                        key: "mapName",
                        label: "Map"
                    }]
                }, {
                    group: "Position",
                    keys: [{
                        key: "swapXY",
                        label: "Swap XY"
                    }, {
                        key: "cmxPositionAmplifyX",
                        label: "X Scale"
                    }, {
                        key: "cmxPositionAmplifyY",
                        label: "Y Scale"
                    }, {
                        key: "cmxPositionPlusX",
                        label: "X Offset"
                    }, {
                        key: "cmxPositionPlusY",
                        label: "Y Offset"
                    }]
                }];
            }
        },
        methods: {
            reset: function() {
                this.form().dom().reset();
            },
            onTest: function(sender, model) {
                if (model) {
                    var form = this.globalForm().dom();
                    var data = {};
                    nx.each(model.keys, function(item) {
                        data[item.key] = form[item.key].value;
                    });
                    nx.util.ajax({
                        url: model.testUrl,
                        data: data,
                        success: function(resources, response) {
                            alert(model.group + " settings validate succeed.");
                        },
                        error: function() {
                            alert(model.group + " settings validate fail.");
                        }
                    })
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-page-setup > a": {
                    "display": "block",
                    "text-align": "center",
                    "height": "2em",
                    "line-height": "1.9em",
                    "text-decoration": "none"
                },
                ".glance-admin-page-setup > .form > .group > .list > .item": {
                    "display": "flex",
                    "font-size": ".7em",
                    "padding": ".5em 1em",
                    "border": "1px solid #ccc",
                    "cursor": "pointer"
                },
                ".glance-admin-page-setup > .form > .group > .list > .item:hover": {
                    "background": "#ccc",
                    "color": "white"
                },
                ".glance-admin-page-setup > .form > .group > .list > .item > .index": {
                    "width": "2em",
                    "padding-right": ".5em"
                },
                ".glance-admin-page-setup > .form > .group > .title": {
                    "font-weight": "400",
                    "line-height": "2em"
                },
                ".glance-admin-page-setup > .form > .group > .field": {
                    "display": "flex",
                    "font-size": ".7em",
                    "line-height": "1.5em"
                },
                ".glance-admin-page-setup > .form > .group > .field > label": {
                    "text-align": "right",
                    "padding-right": ".3em"
                },
                ".glance-admin-page-setup > .form > .group > .field > nx-element": {
                    "flex-grow": "1",
                    "height": "1.5em"
                },
                ".glance-admin-page-setup > .form > .group > .button": {
                    "width": "5em",
                    "text-align": "center",
                    "background": "#ccc",
                    "font-size": ".5em",
                    "line-height": "1.5em",
                    "margin": ".5em 0 .5em auto",
                    "border-radius": ".3em",
                    "cursor": "default"
                },
                ".glance-admin-page-setup > .form > .group > .button:hover": {
                    "background": "#aaa"
                },
                ".glance-admin-page-setup > .form > .group > .button:active": {
                    "background": "#bbb"
                }
            })
        }
    });
})(nx);
