(function(nx) {
    var EXPORT = nx.define("glance.admin.DialogLocationer", glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-locationer",
            extend: {
                body: {
                    content: [{
                        repeat: "{fields}",
                        cssclass: "field",
                        content: [ //
                            {
                                type: "nx.ui.tag.Label",
                                attributes: {
                                    for: "{scope.model.key}"
                                },
                                content: ["{scope.model.text}", ":"]
                            },
                            nx.binding("scope.model.control", function(control) {
                                var data;
                                switch (control) {
                                    case "select":
                                        return {
                                            type: "nx.ui.tag.Select",
                                            attributes: {
                                                id: "{scope.model.key}",
                                                name: "{scope.model.key}"
                                            },
                                            content: {
                                                repeat: "{scope.model.settings}",
                                                type: "nx.ui.tag.SelectOption",
                                                attributes: {
                                                    value: "{scope.model.value}",
                                                    selected: nx.binding("scope.context.scope.model.key, scope.model.value", function(key, value) {
                                                        return nx.binding("scope.context.scope.context.model." + key, function(mvalue) {
                                                            if (nx.is(mvalue, "Number") || nx.is(mvalue, "Boolean")) {
                                                                mvalue = "" + mvalue;
                                                            }
                                                            return value === mvalue && "selected";
                                                        })
                                                    })
                                                },
                                                content: "{scope.model.text}"
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
                        ]
                    }, {
                        cssclass: "footer",
                        content: [{
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
                        }, {
                            cssclass: "button button-ok",
                            content: "OK",
                            capture: {
                                tap: function() {
                                    var data = {};
                                    var controls = this.body().dom().querySelectorAll("select, input");
                                    nx.each(controls, function(control) {
                                        var name = control.getAttribute("name");
                                        var value = control.value;
                                        if (name) {
                                            data[name] = value;
                                        }
                                    });
                                    this.fire("close", data);
                                }
                            }
                        }, {
                            cssclass: "button button-cancel",
                            content: "Cancel",
                            capture: {
                                tap: function() {
                                    this.fire("close", false);
                                }
                            }
                        }]
                    }]
                }
            }
        },
        properties: {
            model: null,
            fields: function() {
                var service = nx.path(nx.global, "app.service");
                return [{
                    control: "text",
                    key: "name",
                    text: "Name"
                }, {
                    control: "select",
                    settings: [{
                        value: "cmx",
                        text: "CMX"
                    }, {
                        value: "meraki",
                        text: "Meraki"
                    }],
                    key: "type",
                    text: "Type"
                }, {
                    control: "text",
                    key: "url",
                    text: "URL"
                }, {
                    control: "text",
                    key: "userName",
                    text: "User Name"
                }, {
                    control: "password",
                    key: "password",
                    text: "Password"
                }, {
                    control: "select",
                    settings: glance.common.Util.TIMEZONES,
                    key: "timezone",
                    text: "Timezone"
                }];
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-locationer > .body": {
                    "padding": "1em",
                    "background": "white"
                },
                ".glance-dialog-locationer > .body > .header": {
                    "width": "100%",
                    "color": "white",
                    "height": "3em",
                    "box-sizing": "border-box",
                    "padding-left": "6em",
                    "padding-top": "1.5em",
                    "background": "linear-gradient(to right, #67bd71, #16aec6)"
                },
                ".glance-dialog-locationer > .body > .field": {
                    "display": "flex",
                    "font-size": ".7em",
                    "line-height": "1.5em"
                },
                ".glance-dialog-locationer > .body > .field:not(:first-child)": {
                    "margin-top": ".5em"
                },
                ".glance-dialog-locationer > .body > .field > label": {
                    "text-align": "right",
                    "padding-right": ".3em",
                    "width": "15%"
                },
                ".glance-dialog-locationer > .body > .field > :nth-child(2)": {
                    "flex-grow": "1",
                    "border": "1px solid black",
                    "background": "white",
                    "border-radius": ".2em"
                },
                ".glance-dialog-locationer > .body > .field > select": {
                    "background": "transparent",
                    "font-size": "inherit"
                },
                ".glance-dialog-locationer > .body > .footer": {
                    "text-align": "right",
                    "nx:absolute": "auto 1em 1em auto"
                },
                ".glance-dialog-locationer > .body > .footer > .button": {
                    "position": "relative",
                    "display": "inline-block",
                    "margin": "0 1em",
                    "padding": ".2em",
                    "border": "1px solid #ccc",
                    "border-radius": ".2em",
                    "min-width": "4em",
                    "text-align": "center",
                    "overflow": "hidden"
                },
                ".glance-dialog-locationer > .body > .footer > .button:hover:before": {
                    "content": " ",
                    "nx:absolute": "0",
                    "background": "rgba(0,0,0,.2)"
                }
            })
        }
    });
})(nx);
