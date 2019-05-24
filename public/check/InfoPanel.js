(function (nx) {
    var EXPORT = nx.define("devme.check.InfoPanel", nx.ui.tag.Form, {
        view: {
            cssclass: "info-panel",
            attributes: {
                action: nx.binding("model", function (model) {
                    return global.app.service().getSmallAvatarUrl(model);
                }),
                method: "POST",
                enctype: "multipart/form-data"
            },
            content: [{
                type: "nx.ui.tag.Label",
                attributes: {
                    "for": "image",
                    class: "avatar-container"
                },
                content: [{
                    type: "nx.lib.component.CentralizedImage",
                    cssclass: "avatar",
                    properties: {
                        src: nx.binding("model.id, model.avatarVersion", function (id, version) {
                            if (id) {
                                return global.app.service().getSmallAvatarUrl(this.model()) + "?x=" + version;
                            }
                        })
                    }
                }, {
                    content: [{
                        content: {
                            type: "nx.ui.tag.InputFile",
                            attributes: {
                                id: "image",
                                name: "image",
                                accept: "image/*",
                                disabled: nx.binding("model", function (model) {
                                    return model ? false : "disabled";
                                })
                            },
                            events: {
                                change: function () {
                                    this.dom().submit();
                                }
                            }
                        }
                    }]
                }]
            }, {
                type: "nx.ui.tag.InputHidden",
                attributes: {
                    name: "url",
                    value: nx.binding("global.app.service.expertChecked, global.app.service.expertSelected", function (checked, selected) {
                        return window.location.href;
                    })
                }
            }, {
                content: nx.binding("model.name")
            }]
        },
        properties: {
            model: {}
        },
        methods: {
            submit: function () {
                if (this.file().dom().value) {
                    var postData = $(this.dom()).serialize();
                    var formURL = this.get("action");
                    $.ajax({
                        url: formURL,
                        type: "POST",
                        data: postData,
                        success: function (data, textStatus, jqXHR) {
                            window.location.href += "?id=" + this.model().id()
                        }.bind(this),
                        error: function (jqXHR, textStatus, errorThrown) {
                            // TODO
                        }
                    });
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".info-panel": {
                    "padding": "2.7em 0 .2em 1em",
                    "border-bottom": "1px solid #666",
                    "white-space": "nowrap",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis"
                },
                ".info-panel > nx-element": {
                    "display": "inline",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis",
                    "line-height": "1em",
                    "vertical-align": "baseline"
                },
                ".info-panel > nx-element:last-child": {
                    "font-size": "1em"
                },
                ".info-panel .avatar-container": {
                    "position": "relative",
                    "margin-right": "1em",
                    "margin-top": "-2em",
                    "vertical-align": "top"
                },
                ".info-panel .avatar": {
                    "width": "5em",
                    "height": "5em",
                    "border": ".17rem solid #00bab0",
                    "border-radius": "50%"
                },
                ".info-panel label > nx-element:last-child": {
                    "position": "relative",
                    "display": "block",
                    "font-weight": "normal",
                    "width": "5em",
                    "text-align": "center",
                    "line-height": "2em",
                    "margin": "auto"
                },
                ".info-panel label > nx-element:last-child:before": {
                    "content": "\\f021",
                    "font-family": "FontAwesome",
                    "font-size": ".8em",
                    "display": "block",
                    "text-align": "center",
                    "width": "1.4em",
                    "height": "1.4em",
                    "line-height": "1.4em",
                    "border-radius": "50%",
                    "background": "#00bab0",
                    "position": "absolute",
                    "left": "50%",
                    "margin-left": "-.7em",
                    "top": "-.7em",
                    "color": "white"
                },
                ".info-panel label > nx-element:last-child:after": {
                    "content": "Change photo",
                    "font-size": ".6em",
                    "font-weight": "300"
                },
                ".info-panel label > nx-element:last-child > nx-element": {
                    "width": "0px",
                    "height": "0px",
                    "overflow": "hidden"
                }
            })
        }
    });
})(nx);
