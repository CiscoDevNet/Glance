(function(nx) {
    var EXPORT = nx.define("devme.admin.Backup", nx.ui.Element, {
        events: ["close"],
        view: {
            cssclass: "glance-admin-page glance-admin-page-backup",
            cssstyle: {
                display: nx.binding("global.app.service.page", function(page) {
                    return page === "backup" ? "block" : "none";
                })
            },
            content: [{
                content: "Backup:"
            }, {
                name: "backup",
                type: "nx.ui.tag.HyperLink",
                attributes: {
                    href: nx.binding("global.app.service", function(service) {
                        return service && service.getBackupUrl();
                    })
                },
                content: "Download Backup Data"
            }, {
                name: "form",
                type: "nx.ui.tag.Form",
                cssclass: "form",
                attributes: {
                    action: nx.binding("global.app.service", function(service) {
                        return service && service.getBackupUrl();
                    }),
                    method: "POST",
                    enctype: "multipart/form-data"
                },
                content: [{
                    cssclass: "title",
                    content: [{
                        type: "nx.ui.tag.HyperLink",
                        cssclass: "link-download",
                        attributes: {
                            target: "_blank",
                            href: nx.binding("global.app.service", function(service) {
                                return service && service.getBackupTemplateUrl();
                            })
                        },
                        content: "Download template file"
                    }, "Restore:"]
                }, {
                    name: "uploadData",
                    type: "devme.admin.MapUploadLabel",
                    properties: {
                        prompt: "From",
                        name: "data",
                        empty: "(Select backup file)",
                        accept: ".xlsx"
                    }
                }, {
                    cssclass: "result success-{result.success}",
                    content: ["{result.text}"]
                }, {
                    type: "nx.ui.tag.InputHidden",
                    attributes: {
                        name: "url",
                        value: nx.binding("global.app.service.page", function() {
                            return window.location.href;
                        })
                    }
                }]
            }, {
                cssclass: ["button", nx.binding("uploadData.value", function(data) {
                    return data ? "" : "disabled";
                })],
                content: "Upload",
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
                        this.form().dom().submit();
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
                        this.fire("close");
                    }
                }
            }]
        },
        properties: {
            result: nx.binding("global.nx.util.hash.map", true, function(async, map) {
                return map.cascade("#, result", function(page, result) {
                    var message;
                    if (page === "backup" && result) {
                        result = result.split(",");
                        switch (result[0]) {
                            case "200":
                                message = {
                                    success: true,
                                    text: "Restore successfully,  " + result[2] + "/" + result[1] + " updated."
                                };
                                break;
                            default:
                                message = {
                                    success: false,
                                    text: "Restore failed."
                                };
                        }
                        // clear result
                        var hash = nx.util.hash;
                        var m = hash.getHashMap();
                        delete m.result;
                        hash.setHashMap(m);
                        // set message for 3 seconds
                        async.set(message);
                        nx.timer(5000, function() {
                            async.set(null);
                        });
                    }
                });
            })
        },
        methods: {
            reset: function() {
                this.uploadData().reset();
                this.form().dom().reset();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-page-backup > a": {
                    "display": "block",
                    "text-align": "center",
                    "height": "2em",
                    "line-height": "1.9em",
                    "text-decoration": "none"
                },
                ".glance-admin-page-backup > .form > .result": {
                    "font-size": ".5em",
                    // "line-height": "2em",
                    "text-align": "center"
                },
                ".glance-admin-page-backup > .form > .title > .link-download": {
                    "float": "right",
                    "font-size": ".5em",
                    "line-height": "2em",
                    "color": "#777"
                },
                ".glance-admin-page-backup > .form > .result.success-false": {
                    "color": "red"
                },
                ".glance-admin-page-backup > .form > .title > .link-download:hover": {
                    "color": "#aaa"
                }
            })
        }
    });
})(nx);
