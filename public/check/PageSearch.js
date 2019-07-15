(function (nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("devme.check.PageSearch", nx.ui.Element, {
        events: ["select"],
        view: {
            cssclass: "glance-check-page-search",
            cssstyle: {
                display: nx.binding("global.app.service.expertChecked, global.app.service.expertSelected", function (checked, selected) {
                    return (!checked && !selected) ? "block" : "none";
                })
            },
            content: [{
                name: "input",
                type: "nx.lib.component.NormalInput",
                properties: {
                    placeholder: "Input your name here"
                }
            }, {
                type: "glance.common.IconClose",
                cssclass: "clear",
                cssstyle: {
                    display: nx.binding("input.value.length", function (v) {
                        return v ? "block" : "none"
                    })
                },
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        if (evt.capture(sender, ["tap", "end"])) {
                            sender.toggleClass("active", true);
                        }
                    },
                    captureend: function (sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function () {
                        this.input().value("");
                    }
                }
            }, {
                cssclass: "matched-list",
                cssstyle: {
                    display: nx.binding("input.value", function (v) {
                        return v ? "block" : "none";
                    })
                },
                content: [{
                    content: nx.template({
                        paths: "matched",
                        pattern: {
                            cssclass: "matched-item",
                            content: [{
                                content: nx.binding("scope.model.id")
                            }, {
                                type: "nx.lib.component.CentralizedImage",
                                cssclass: "avatar",
                                properties: {
                                    src: nx.binding("scope.model.id, scope.model.avatarVersion", function (id, version) {
                                        if (id) {
                                            return global.app.service().getSmallAvatarUrl(this.scope().model()) + "?x=" + version;
                                        }
                                    })
                                }
                            }, {
                                content: nx.binding("scope.context.input.value, scope.model.name", function (word, name) {
                                    return glance.common.Util.matchTextHighlight(word, name);
                                })
                            }],
                            events: {
                                click: function (sender, evt) {
                                    this.scope().context().fire("select", this.scope().model());
                                }
                            }
                        }
                    })
                }, {}]
            }]
        },
        properties: {
            matched: {
                dependencies: "global.app.service.experts, input.value",
                value: function (experts, value) {
                    if (experts && value) {
                        return experts.filter(function (expert) {
                            return glance.common.Util.matchRate(value, nx.path(expert, "name")) >= 0;
                        });
                    }
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-check-page-search": {
                    "position": "relative",
                    "margin": "1rem"
                },
                ".glance-check-page-search .nx-normal-input": {
                    "height": "2em",
                    "line-height": "1.9em",
                    "border-width": "0 0 1px 0",
                    "border-style": "solid",
                    "border-color": "#666"
                },
                ".glance-check-page-search .nx-normal-input > input": {
                    "font-weight": "300"
                },
                ".glance-check-page-search > .clear": {
                    "position": "absolute",
                    "top": "0.25em",
                    "width": "1.5em",
                    "height": "1.5em",
                    "right": "0em"
                },
                ".glance-check-page-search > .matched-list": {
                    "position": "absolute",
                    "top": "100%",
                    "width": "100%",
                    "max-height": "20em",
                    "z-index": "1"
                },
                ".glance-check-page-search > .matched-list > nx-element:last-child": {
                    "font-size": ".7em",
                    "height": "3em",
                    "line-height": "3em",
                    "background-color": "#e6e6e6",
                    "padding": "0 1em"
                },
                ".glance-check-page-search > .matched-list > nx-element:last-child:before": {
                    "content": "\\f070",
                    "font-family": "FontAwesome",
                    "display": "inline-block",
                    "width": "2em",
                    "margin-right": "0.5em",
                    "height": "2em",
                    "line-height": "2em",
                    "text-align": "center"
                },
                ".glance-check-page-search > .matched-list > nx-element:last-child:after": {
                    "content": "If you could not find your name, please go to see a receptionist.",
                    "font-size": ".6em"
                },
                ".glance-check-page-search > .matched-list .matched-item": {
                    "font-size": ".7em",
                    "height": "3em",
                    "line-height": "3em",
                    "overflow": "hidden",
                    "background-color": "#e6e6e6",
                    "border-bottom": ".1em solid white",
                    "padding": "0 1em",
                    "white-space": "nowrap",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis"
                },
                ".glance-check-page-search > .matched-list .matched-item:hover": {
                    "background": "#00bab0",
                    "color": "white"
                },
                ".glance-check-page-search > .matched-list .matched-item.active": {
                    "background": "#00bab0",
                    "color": "white"
                },
                ".glance-check-page-search > .matched-list .matched-item > nx-element": {
                    "display": "inline-block",
                    "vertical-align": "middle",
                    "font-weight": "500"
                },
                ".glance-check-page-search > .matched-list .matched-item > nx-element:first-child": {
                    "float": "right",
                    "font-size": ".7em",
                    "font-weight": "400"
                },
                ".glance-check-page-search > .matched-list .matched-item > nx-element:last-child": {
                    "display": "inline",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis",
                    "white-space": "nowrap"
                },
                ".glance-check-page-search > .matched-list .matched-item > nx-element > span": {
                    "color": "#f7931e"
                },
                ".glance-check-page-search > .matched-list .matched-item .avatar": {
                    "width": "2em",
                    "height": "2em",
                    "border": ".15em solid #00bab0",
                    "border-radius": "50%",
                    "margin-right": "0.5em",
                    "overflow": "hidden"
                },
                ".glance-check-page-search > .matched-list .matched-item:hover .avatar": {
                    "border-color": "white"
                },
                ".glance-check-page-search > .matched-list .matched-item.active .avatar": {
                    "border-color": "white"
                }
            })
        }
    });
})(nx);
