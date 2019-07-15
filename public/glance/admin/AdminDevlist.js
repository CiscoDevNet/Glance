(function(nx) {

    var columns = [{
        control: "text",
        key: "name",
        cssclass: "name",
        text: "Title"
    }, {
        control: "select",
        settings: [{
            value: "",
            text: "<none>"
        }, {
            value: "person",
            text: "Person"
        }, {
            value: "thing",
            text: "Thing"
        }, {
            value: "expert",
            text: "Expert"
        }, {
            value: "equipment",
            text: "Equipment"
        }],
        key: "category",
        cssclass: "category",
        text: "Category"
    }, {
        control: "macaddr",
        key: "macAddress",
        cssclass: "address",
        text: "Mac"
    }, {
        control: "text",
        key: "owner",
        cssclass: "owner",
        text: "Owner"
    }, {
        control: "text",
        key: "phoneNumber",
        cssclass: "number",
        text: "Number"
    }];

    var Header = nx.define("glance.admin.AdminDevlist.Header", nx.ui.Element, {
        view: {
            cssclass: "row row-header",
            content: [{
                repeat: "{columns}",
                cssclass: "cell cell-{scope.model.cssclass}",
                content: "{scope.model.text}"
            }, {
                cssclass: "cell cell-opr",
                content: "&nbsp;"
            }]
        }
    });

    var Row = nx.define("glance.admin.AdminDevlist.Row", nx.ui.Element, {
        view: {
            cssclass: "row editing-{model.editing}",
            content: [{
                repeat: "{columns}",
                cssclass: "cell cell-{scope.model.cssclass} editing-{scope.context.model.editing}",
                content: nx.binding("scope.context.model.editing", function(editing) {
                    if (editing) {
                        return nx.binding("scope.model.control", function(control) {
                            var data;
                            switch (control) {
                                case "select":
                                    return {
                                        type: "nx.lib.component.NormalSelect",
                                        properties: {
                                            id: "{scope.model.key}",
                                            name: "{scope.model.key}",
                                            options: "{scope.model.settings}",
                                            value: nx.binding("scope.model.key", function(key) {
                                                return nx.binding("scope.context.model." + key, function(value) {
                                                    if (nx.is(value, "Number") || nx.is(value, "Boolean")) {
                                                        return "" + value;
                                                    }
                                                    return value || "";
                                                });
                                            })
                                        }
                                    };
                                case "password":
                                    data = true;
                                case "text":
                                default:
                                    return {
                                        type: "nx.lib.component.NormalInput",
                                        properties: {
                                            id: "{scope.model.key}",
                                            name: "{scope.model.key}",
                                            password: data,
                                            value: nx.binding("scope.model.key", function(key) {
                                                return nx.binding("scope.context.model." + key, function(value) {
                                                    if (nx.is(value, "Number") || nx.is(value, "Boolean")) {
                                                        return "" + value;
                                                    }
                                                    return value || "";
                                                });
                                            })
                                        }
                                    };
                            }
                        })
                    } else {
                        return nx.binding("scope.model.key", function(key) {
                            return nx.binding("scope.context.model." + key, function(value) {
                                if (nx.is(value, "Number") || nx.is(value, "Boolean")) {
                                    value = "" + value;
                                }
                                return {
                                    content: value || ""
                                };
                            });
                        })
                    }
                })
            }, {
                cssclass: "cell cell-opr",
                content: [{
                    cssclass: "button button-edit",
                    capture: {
                        tap: function() {
                            nx.path(this, "model.editing", true);
                        }
                    }
                }, {
                    cssclass: "button button-remove",
                    capture: {
                        tap: function() {
                            this.fire("remove");
                        }
                    }
                }, {
                    cssclass: "button button-commit",
                    capture: {
                        tap: function() {
                            var data = {};
                            var controls = this.dom().querySelectorAll("select, input");
                            nx.each(controls, function(control) {
                                var name = control.getAttribute("name");
                                var value = control.value;
                                if (name) {
                                    data[name] = value;
                                }
                            });
                            // TODO
                            this.fire("update", data);
                            nx.path(this, "model.editing", false);
                        }
                    }
                }, {
                    cssclass: "button button-cancel",
                    capture: {
                        tap: function() {
                            nx.path(this, "model.editing", false);
                        }
                    }
                }]
            }]
        }
    });

    var EXPORT = nx.define("glance.admin.AdminDevlist", nx.ui.Element, {
        view: {
            cssclass: "glance-admin-devlist",
            content: [{
                cssclass: "title",
                content: [{
                    cssclass: "navpath",
                    content: [
                        "Device List: ", "{model.name}"
                    ]
                }, {
                    cssclass: "operator",
                    content: [{
                        cssclass: "button",
                        content: "Download"
                    }, {
                        cssclass: "button",
                        content: "Import"
                    }, {
                        cssclass: "button",
                        content: "Add"
                    }, {
                        cssclass: "button",
                        content: "Close"
                    }]
                }]
            }, {
                cssclass: "panel",
                content: [{
                    type: Header,
                    properties: {
                        columns: "{columns}"
                    }
                }, {
                    repeat: "{model.devices}",
                    type: Row,
                    properties: {
                        model: "{scope.model}",
                        columns: "{scope.context.columns}"
                    },
                    events: {
                        update: function(sender, data) {
                            var model = sender.model();
                            var context = nx.path(this, "scope.context");
                            context.updateItemModel(model, data);
                        },
                        remove: function() {
                            // TODO
                            var list = nx.path(this, "scope.list");
                            var model = nx.path(this, "scope.model");
                            list.remove(model);
                        }
                    }
                }]
            }]
        },
        properties: {
            model: null,
            columns: () => columns,
            _updateDemo: nx.binding("model.name", function(name) {
                if (name === "Experts" && nx.path(nx.global, "nx.util.url.search.DEMO")) {
                    // update columns
                    nx.util.ajax({
                        url: glance.service.api.getUserListUrl(),
                        contentType: "application/json",
                        dataType: "json",
                        success: function(resources, data) {
                            this.updateDevices(data.experts);
                        }.bind(this),
                        error: function() {
                            this.updateDevices(glance.admin.DEMO.EXPERTS);
                        }.bind(this)
                    });
                }
            })
        },
        methods: {
            init: function() {
                this.inherited();
                // update columns
                nx.util.ajax({
                    url: glance.service.api.getBleListUrl(),
                    success: function(resources, data) {
                        this.updateBleMacAddressSettings(data);
                    }.bind(this),
                    error: function() {
                        if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                            this.updateBleMacAddressSettings(glance.admin.DEMO.BLE_LIST);
                        }
                    }.bind(this)
                });
            },
            updateBleMacAddressSettings: function(data) {
                var columns = nx.clone(EXPORT.DEFAULT_COLUMNS, true);
                var column = columns.find((column) => (column.key === "macAddress"));
                column.control = "select";
                column.text = "BLE MacAddress";
                column.settings = data.map((item) => ({
                    text: item.id,
                    value: item.macAddress
                }));
                column.settings.unshift({
                    text: "<none>",
                    value: ""
                });
                this.columns(columns);
            },
            updateDevices: function(devices) {
                var model = this.model();
                model.devices().removeAll();
                nx.each(devices, function(device) {
                    var dev = new nx.Object();
                    nx.each(device, function(value, key) {
                        nx.Object.extendProperty(dev, key, {
                            value: value
                        }, true);
                    });
                    model.devices().push(dev);
                });
            },
            updateItemModel: function(model, data) {
                nx.util.ajax({
                    url: glance.service.api.getUserItemUrl(model.id()),
                    method: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(data),
                    success: function() {
                        nx.each(data, function(value, key) {
                            nx.path(model, key, value);
                        });
                    }.bind(this),
                    error: function(from, xhr, errorThrown) {
                        if (xhr.status && xhr.status == 409) //conflict..
                            alert("This tag has been assigned to \"" + xhr.responseJSON.assignedName + "\", please recycle that tag and then reassign.")
                        else
                            alert("Failed to assign tag to user, please try again!")
                    }.bind(this)
                });
            }
        },
        statics: {
            DEFAULT_COLUMNS: columns,
            CSS: nx.util.csssheet.create({
                ".glance-admin-devlist": {
                    "font-size": ".7em"
                },
                ".glance-admin-devlist > .title": {
                    "margin": ".5em",
                    "nx:absolute": "0 0 auto 0",
                    "height": "1.5em",
                    "line-height": "1.5em",
                    "display": "flex"
                },
                ".glance-admin-devlist > .title > .navpath": {
                    "flex-grow": "1"
                },
                ".glance-admin-devlist > .title > .operator": {
                    "position": "relative",
                    "text-align": "right",
                    "width": "24em",
                    "flex-grow": "0",
                    "padding": "0"
                },
                ".glance-admin-devlist > .title > .operator > .button": {
                    "display": "inline-block",
                    "vertical-align": "top",
                    "box-sizing": "border-box",
                    "border": "1px solid #ccc",
                    "border-radius": ".2em",
                    "margin": "0 0 0 .5em",
                    "padding": "0 .5em",
                    "text-align": "center",
                    "min-width": "5em",
                    "cursor": "default"
                },
                ".glance-admin-devlist > .title > .operator > .button:hover": {
                    "background": "#fff"
                },
                ".glance-admin-devlist > .panel": {
                    "nx:absolute": "2.5em .5em .5em .5em",
                    "background": "#fff",
                    "overflow-y": "auto"
                },
                ".glance-admin-devlist > .panel > .row": {
                    "height": "2.4em",
                    "line-height": "2em",
                    "display": "flex",
                    "justify-content": "space-between"
                },
                ".glance-admin-devlist > .panel > .row.row-header": {
                    "height": "2em",
                    "line-height": "2em",
                    "border-bottom": "1px solid #e4eaf1"
                },
                ".glance-admin-devlist > .panel > .row > .cell": {
                    "position": "relative",
                    "flex-basis": "2em",
                    "white-space": "nowrap"
                },
                ".glance-admin-devlist > .panel > .row-header > .cell": {
                    "padding": ".2em"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-name": {
                    "flex-grow": "5"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-category": {
                    "flex-grow": "4"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-address": {
                    "flex-grow": "6"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-owner": {
                    "flex-grow": "3"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-number": {
                    "flex-grow": "4"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-opr": {
                    "flex-grow": "1"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-opr > .button": {
                    "display": "inline-block",
                    "nx:size": "1.5em",
                    "line-height": "1.5em",
                    "text-align": "center"
                },
                ".glance-admin-devlist > .panel > .row.editing-true > .cell.cell-opr > .button-edit": {
                    "display": "none"
                },
                ".glance-admin-devlist > .panel > .row.editing-true > .cell.cell-opr > .button-remove": {
                    "display": "none"
                },
                ".glance-admin-devlist > .panel > .row:not(.editing-true) > .cell.cell-opr > .button-commit": {
                    "display": "none"
                },
                ".glance-admin-devlist > .panel > .row:not(.editing-true) > .cell.cell-opr > .button-cancel": {
                    "display": "none"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-opr > .button:before": {
                    "font-family": "FontAwesome"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-opr > .button-edit:before": {
                    "content": "\\f040"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-opr > .button-remove:before": {
                    "content": "\\f1f8"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-opr > .button-commit:before": {
                    "content": "\\f00c"
                },
                ".glance-admin-devlist > .panel > .row > .cell.cell-opr > .button-cancel:before": {
                    "content": "\\f05e"
                },
                ".glance-admin-devlist > .panel > .row > .cell:not(.cell-opr) > :first-child": {
                    "nx:absolute": ".2em",
                    "border": "1px solid transparent"
                },
                ".glance-admin-devlist > .panel > .row > .cell.editing-true > :first-child": {
                    "border-color": "black",
                    "border-radius": ".2em"
                }
            })
        }
    });

})(nx);
