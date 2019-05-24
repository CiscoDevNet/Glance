(function(nx) {
    var EXPORT = nx.define("glance.paging.InfoPanel", nx.ui.tag.Form, {
        view: {
            cssclass: "info-panel",
            attributes: {
                action: nx.binding("model", function(model) {
                    return glance.service.api.getSmallAvatarUrl(model);
                }),
                method: "POST",
                enctype: "multipart/form-data"
            },
            content: [{
                type: "nx.ui.tag.Label",
                cssclass: "avatar-container",
                attributes: {
                    "for": "image"
                },
                content: [{
                    type: "nx.lib.component.CentralizedImage",
                    cssclass: "avatar",
                    properties: {
                        src: nx.binding("model.id, model.avatarVersion", function(id, version) {
                            if (id) {
                                return glance.service.api.getSmallAvatarUrl(this.model()) + "?x=" + version;
                            }
                        })
                    }
                }, {
                    cssclass: "uploader",
                    content: [{
                        content: {
                            type: "nx.ui.tag.InputFile",
                            attributes: {
                                id: "image",
                                name: "image",
                                accept: "image/*",
                                disabled: nx.binding("model", function(model) {
                                    return model ? false : "disabled";
                                })
                            },
                            events: {
                                change: function() {
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
                    value: nx.binding("service.selected", function(selected) {
                        return window.location.href;
                    })
                }
            }, {
                type: "nx.lib.component.NormalInput",
                cssclass: "input readonly-{nameReadonly}",
                properties: {
                    placeholder: "Input a name",
                    readonly: "{nameReadonly}",
                    value: "{model.name}"
                },
                events: {
                    input: function(sender) {
                        if (this.model().name() !== sender.value()) {
                            this.model().name(sender.value());
                        }
                    }
                }
            }]
        },
        properties: {
            model: {},
            nameReadonly: false
        },
        methods: {
            submit: function() {
                if (this.file().dom().value) {
                    var postData = $(this.dom()).serialize();
                    var formURL = this.get("action");
                    $.ajax({
                        url: formURL,
                        type: "POST",
                        data: postData,
                        success: function(data, textStatus, jqXHR) {
                            window.location.href += "?id=" + this.model().id()
                        }.bind(this),
                        error: function(jqXHR, textStatus, errorThrown) {
                            // TODO
                        }
                    });
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".info-panel": {
                    "padding": "2em 0 .2em 0",
                    "border-bottom": "1px solid #666",
                    "white-space": "nowrap",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis"
                },
                ".info-panel .avatar-container": {
                    "position": "relative",
                    "margin-right": "1em",
                    "margin-top": "-2em",
                    "vertical-align": "top",
                    "display": "inline-block"
                },
                ".info-panel .avatar": {
                    "width": "5em",
                    "height": "5em",
                    "border": ".17rem solid #00bab0",
                    "border-radius": "50%"
                },
                ".info-panel > label": {
                    "margin-left": "1em",
                    "float": "left",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis",
                    "line-height": "1em",
                    "vertical-align": "baseline"
                },
                ".info-panel > label > .uploader": {
                    "position": "relative",
                    "display": "block",
                    "font-weight": "normal",
                    "width": "5em",
                    "text-align": "center",
                    "line-height": "2em",
                    "margin": "auto"
                },
                ".info-panel > label > .uploader:before": {
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
                ".info-panel > label > .uploader:after": {
                    "content": "Change photo",
                    "font-size": ".6em",
                    "font-weight": "300"
                },
                ".info-panel > label > .uploader > nx-element": {
                    "width": "0px",
                    "height": "0px",
                    "overflow": "hidden"
                },
                ".info-panel > .input": {
                    "height": "2em",
                    "margin-left": "6em"
                },
                ".info-panel > .input:not(.readonly-true)": {
                    "border-bottom": "1px solid #777"
                }
            })
        }
    });
})(nx);
