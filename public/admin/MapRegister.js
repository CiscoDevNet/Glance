(function (nx) {
    var EXPORT = nx.define("devme.admin.MapRegister", nx.ui.Element, {
        events: ["close"],
        view: {
            cssclass: "glance-admin-page glance-admin-page-map",
            cssstyle: {
                display: nx.binding("global.app.service.page", function (page) {
                    return page === "map-register" ? "block" : "none";
                })
            },
            content: [{
                name: "form",
                type: "nx.ui.tag.Form",
                cssclass: "map-register-form",
                attributes: {
                    action: nx.binding("global.app.service", function (service) {
                        return service && service.getMapRegisterUrl();
                    }),
                    method: "POST",
                    enctype: "multipart/form-data"
                },
                content: [{
                    name: "input",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        id: "name",
                        name: "name",
                        placeholder: "Name the map"
                    }
                }, {
                    name: "uploadMap",
                    type: "devme.admin.MapUploadLabel",
                    properties: {
                        prompt: "Map",
                        name: "map",
                        accept: "image/*"
                    }
                }, {
                    name: "uploadMask",
                    type: "devme.admin.MapUploadLabel",
                    properties: {
                        prompt: "Mask",
                        name: "mask",
                        accept: "image/*"
                    }
                }, {
                    name: "uploadMaskHalf",
                    type: "devme.admin.MapUploadLabel",
                    properties: {
                        prompt: "Mask(1/2)",
                        name: "maskhalf",
                        accept: "image/*"
                    }
                }, {
                    name: "uploadMaskQuarter",
                    type: "devme.admin.MapUploadLabel",
                    properties: {
                        prompt: "Mask(1/4)",
                        name: "maskquarter",
                        accept: "image/*"
                    }
                }, {
                    type: "nx.ui.tag.InputHidden",
                    attributes: {
                        name: "url",
                        value: nx.binding("global.app.service.page", function () {
                            return window.location.href;
                        })
                    }
                }]
            }, {
                cssclass: ["button", nx.binding("input.value, uploadMap.value, uploadMask.value, uploadMaskHalf.value, uploadMaskQuarter.value", function (name, a, b, c, d) {
                    return (name && a && b && c && d) ? "" : "disabled";
                })],
                content: "Upload",
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        if (!sender.hasClass("disabled") && evt.capture(sender, ["tap", "end"])) {
                            sender.toggleClass("active", true);
                        }
                    },
                    captureend: function (sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function (sender, evt) {
                        this.form().dom().submit();
                    }
                }
            }, {
                cssclass: "button button-cancel",
                content: "Cancel",
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        evt.capture(sender, "tap");
                    },
                    capturetap: function (sender, evt) {
                        this.fire("close");
                    }
                }
            }]
        },
        methods: {
            reset: function () {
                this.uploadMap().reset();
                this.uploadMask().reset();
                this.uploadMaskHalf().reset();
                this.uploadMaskQuarter().reset();
                this.form().dom().reset();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-page .nx-normal-input": {
                    "height": "2em",
                    "line-height": "1.9em",
                    "border-width": "0 0 1px 0",
                    "border-style": "solid",
                    "border-color": "#666"
                },
                ".glance-admin-page .nx-normal-input > input": {
                    "font-weight": "300"
                },
                ".glance-admin-page .map-register-form": {

                }
            })
        }
    });
})(nx);
