(function(nx) {
    var EXPORT = nx.define("devme.admin.ExpertRegisterForm", nx.ui.tag.Form, {
        events: ["close"],
        view: {
            cssclass: "glance-expert-register-form",
            content: [{
                cssclass: "message",
                content: nx.binding("message")
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    attributes: {
                        for: "name"
                    },
                    content: "User name:"
                }, {
                    name: "inputName",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        id: "name",
                        name: "name",
                        placeholder: "Required"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    attributes: {
                        for: "title"
                    },
                    content: "Title:"
                }, {
                    name: "inputTitle",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        id: "title",
                        name: "title",
                        placeholder: "Required"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    attributes: {
                        for: "id"
                    },
                    content: "CISCO CEC ID:"
                }, {
                    name: "inputId",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        id: "id",
                        name: "id",
                        placeholder: "Required"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    attributes: {
                        for: "category"
                    },
                    content: "Category:"
                }, {
                    name: "inputCategory",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        id: "category",
                        name: "category",
                        placeholder: "Required"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    attributes: {
                        for: "macAddress"
                    },
                    content: "MAC Address:"
                }, {
                    name: "inputMacAddress",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        id: "macAddress",
                        name: "macAddress",
                        placeholder: "Required"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    attributes: {
                        for: "phoneNumber"
                    },
                    content: "Mobile:"
                }, {
                    name: "inputPhoneNumber",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        id: "phoneNumber",
                        name: "phoneNumber"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    attributes: {
                        for: "expertise"
                    },
                    content: "Expertise:"
                }, {
                    name: "inputExpertise",
                    type: "nx.ui.tag.TextArea",
                    attributes: {
                        id: "expertise",
                        name: "expertise"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    content: "&nbsp;"
                }, {
                    cssclass: ["button default", nx.binding("inputName.value, inputTitle.value, inputId.value, inputCategory.value, inputMacAddress.value", function(n, t, i, c, m) {
                        return (n && t && i && c && m) ? "" : "disabled";
                    })],
                    content: "Add to database",
                    events: {
                        "mousedown touchstart": function(sender, evt) {
                            if (!sender.hasClass("disabled") && evt.capture(sender, ["tap", "end"])) {
                                sender.toggleClass("active", true);
                            }
                        },
                        captureend: function(sender) {
                            sender.toggleClass("active", false);
                        },
                        capturetap: "commit"
                    }
                }]
            }, {
                content: [{
                    type: "nx.ui.tag.Label",
                    content: "&nbsp;"
                }, {
                    cssclass: "button cancel",
                    content: "Cancel",
                    events: {
                        "mousedown touchstart": function(sender, evt) {
                            if (evt.capture(sender, ["tap", "end"])) {
                                sender.toggleClass("active", true);
                            }
                        },
                        captureend: function(sender) {
                            sender.toggleClass("active", false);
                        },
                        capturetap: "close"
                    }
                }]
            }]
        },
        properties: {
            message: "Fill out the fields to add a new expert to GLANCE data base"
        },
        methods: {
            close: function() {
                this.fire("close");
            },
            commit: function() {
                var cecid = this.inputId().value();
                var name = this.inputName().value();
                var category = this.inputCategory().value();
                var macAddress = this.inputMacAddress().value();
                var title = this.inputTitle().value();
                var topics = this.inputExpertise().dom().value;
                if (cecid && name && title && category && macAddress) {
                    $.ajax({
                        method: "POST",
                        url: global.app.service().getExpertRegisterUrl(),
                        data: JSON.stringify({
                            cecid: cecid,
                            email: cecid + "@glancedemo.cisco.com",
                            name: name,
                            category: category,
                            macAddress: macAddress,
                            title: title,
                            topics: topics,
                            phoneNumber: this.inputPhoneNumber().value()
                        }),
                        contentType: "application/json",
                        dataType: "json",
                        success: function() {
                            this.message("The expert has been added to GLANCE data base");
                            this.dom().reset();
                        }.bind(this),
                        error: function() {
                            // TODO fail to add, e.g. duplicated
                        }
                    });
                } else {
                    // TODO some fields required
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-expert-register-form": {
                    "line-height": "normal",
                    "margin": "auto",
                    "display": "flex",
                    "flex-direction": "column"
                },
                ".glance-expert-register-form > nx-element": {
                    "position": "relative",
                    "margin": ".5em 0"
                },
                ".glance-expert-register-form > nx-element.message": {
                    "margin": ".5em 0",
                    "text-align": "center",
                    "font-size": "1.2em",
                    "font-weight": "200",
                    "line-height": "3em"
                },
                ".glance-expert-register-form > nx-element > label": {
                    "box-sizing": "border-box",
                    "display": "inline-block",
                    "vertical-align": "top",
                    "font-family": "Roboto",
                    "font-weight": "300",
                    "height": "2em",
                    "line-height": "2em",
                    "width": "25%",
                    "padding": "0 .5em",
                    "text-align": "right"
                },
                ".glance-expert-register-form > nx-element > *:last-child": {
                    "display": "inline-block",
                    "vertical-align": "top",
                    "width": "75%",
                    "border-radius": ".5em",
                    "box-sizing": "border-box"
                },
                ".glance-expert-register-form > nx-element > .nx-normal-input": {
                    "height": "2em",
                    "text-indent": ".5em",
                    "line-height": "2em",
                    "background": "white"
                },
                ".glance-expert-register-form > nx-element > textarea": {
                    "padding": ".3em .5em",
                    "height": "7.7em",
                    "line-height": "1.4em",
                    "outline": "none",
                    "border": "0",
                    "resize": "none"
                },
                ".glance-expert-register-form > nx-element > .button": {
                    "text-align": "center",
                    "height": "2em",
                    "line-height": "2em",
                    "background": "transparent",
                    "color": "#666",
                    "outline": "none",
                    "border": "0"
                },
                ".glance-expert-register-form > nx-element > .button.default": {
                    "background": "#00bab0",
                    "color": "white"
                },
                ".glance-expert-register-form > nx-element > .button.disabled.default": {
                    "background": "#ddd",
                    "color": "#eee"
                },
                ".glance-expert-register-form > nx-element > .button.default.active": {
                    "background": "rgba(0, 186, 176, .7)"
                },
                ".glance-expert-register-form > nx-element > .nx-normal-input > input::input-placeholder": {
                    "color": "#ddd"
                }
            })
        }
    });
})(nx);
