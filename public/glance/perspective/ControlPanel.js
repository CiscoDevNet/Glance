(function(nx) {
    var EXPORT = nx.define("glance.perspective.ControlPanel", nx.ui.Element, {
        view: {
            cssclass: "glance-control-panel",
            content: [{
                type: "glance.common.BrandA",
                cssclass: "brand"
            }, {
                cssclass: "sign",
                cssstyle: {
                    display: nx.binding("model.whoami.category", function(category) {
                        return "none";
                        return (category === "visitor" || category === "guest") ? "" : "none";
                    })
                },
                capture: {
                    tap: "{onRegister}"
                }
            }, {
                cssclass: "sign",
                cssstyle: {
                    display: nx.binding("model.whoami.category", function(category) {
                        return "none";
                        return (category === "expert") ? "" : "none";
                    })
                },
                capture: {
                    tap: "{onCheck}"
                }
            }, {
                cssclass: "display-mode",
                cssstyle: {
                    display: nx.binding("model.whoami.isMobile", function(isMobile) {
                        return "";
                        return isMobile ? "none" : "";
                    })
                },
                content: {
                    repeat: "{listOptions}",
                    cssclass: "button button-{scope.model.key}",
                    attributes: {
                        tabindex: -1
                    },
                    content: [{
                        cssclass: "label",
                        content: "{scope.model.key}"
                    }, {
                        cssclass: "bubble",
                        content: {
                            type: "glance.perspective.ControlPanelBubble",
                            properties: {
                                model: "{scope.context.model}",
                                options: "{scope.model.options}"
                            }
                        }
                    }],
                    capture: {
                        start: function(sender) {
                            if (document.activeElement === sender.dom()) {
                                sender.infocus = true;
                            }
                        },
                        tap: function(sender, evt) {
                            if (sender.infocus) {
                                sender.dom().blur();
                            } else {
                                sender.dom().focus();
                            }
                        },
                        end: function(sender) {
                            sender.infocus = false;
                        }
                    }
                }
            }, {
                cssclass: "search-panel search-{model.search.visible} keyboard-native-{model.isUseNativeKeyboard}",
                content: [{
                    cssclass: "search-toggle",
                    capture: {
                        tap: function(evt) {
                            if (this.model() && !this.model().search().isUseNativeKeyboard()) {
                                // show simulated keyboard
                                this.model().search().visible(!this.model().search().visible());
                                evt._dom.offsetParent.lastChild.style.display = "none";
                            } else if (this.model().search().isUseNativeKeyboard()) {
                                // show native keyboard
                                this.model().search().visible(!this.model().search().visible());
                                // focus the input box
                                evt._dom.offsetParent.lastElementChild.firstElementChild.focus();
                                evt._dom.nextElementSibling.style.display = "none";
                            }
                        }
                    }
                }, {
                    name: "search",
                    type: "glance.perspective.search.SearchBox",
                    cssclass: "search",
                    events: {
                        close: function() {
                            this.model() && this.model().search().visible(false);
                        }
                    },
                    content: {
                        cssclass: "list-container list-{model.search.matched.length}",
                        content: {
                            cssclass: "list",
                            content: {
                                repeat: "{model.search.matched}",
                                cssclass: "item",
                                content: [{
                                    type: "nx.lib.component.CentralizedImage",
                                    cssclass: "avatar",
                                    properties: {
                                        src: nx.binding("scope.model.id, scope.model.avatarVersion", function(id, version) {
                                            if (id) {
                                                return glance.service.api.getSmallAvatarUrl(this.scope().model()) + "?x=" + version;
                                            }
                                        })
                                    }
                                }, {
                                    content: nx.binding("scope.model.name, scope.model.skills, scope.context.model.search.word", function(name, skills, word) {
                                        if (name && word) {
                                            if (glance.common.Util.matchRate(word, name) >= 0) {
                                                return glance.common.Util.matchTextHighlight(word, name);
                                            } else {
                                                var matchedSkill = glance.common.Util.matchTextHighlightSkills(word, skills);
                                                return name + " (" + matchedSkill + ")";
                                            }
                                        }
                                    })
                                }],
                                capture: {
                                    tap: function(sender, evt) {
                                        var model = nx.path(this, "scope.model");
                                        var context = nx.path(this, "scope.context");
                                        context.fire("picked", {
                                            model: model
                                        });
                                    }
                                }
                            }
                        }
                    }
                }, {
                    name: "nativesearch",
                    type: "glance.perspective.search.NativeSearchBox",
                    cssclass: "native-search",
                    events: {
                        close: function() {
                            this.model() && this.model().search().visible(false);
                        }
                    },
                    content: {
                        cssclass: "list-container list-{model.search.matched.length}",
                        content: {
                            cssclass: "list",
                            content: {
                                repeat: "{model.search.matched}",
                                cssclass: "item",
                                content: [{
                                    type: "nx.lib.component.CentralizedImage",
                                    cssclass: "avatar",
                                    properties: {
                                        src: nx.binding("scope.model.id, scope.model.avatarVersion", function(id, version) {
                                            if (id) {
                                                return glance.service.api.getSmallAvatarUrl(this.scope().model()) + "?x=" + version;
                                            }
                                        })
                                    }
                                }, {
                                    content: nx.binding("scope.model.name, scope.model.skills, scope.context.model.search.word", function(name, skills, word) {
                                        if (name && word) {
                                            if (glance.common.Util.matchRate(word, name) >= 0) {
                                                return glance.common.Util.matchTextHighlight(word, name);
                                            } else {
                                                var matchedSkill = glance.common.Util.matchTextHighlightSkills(word, skills);
                                                return name + " (" + matchedSkill + ")";
                                            }
                                        }
                                    })
                                }],
                                capture: {
                                    tap: function(sender, evt) {
                                        var model = nx.path(this, "scope.model");
                                        var context = nx.path(this, "scope.context");
                                        context.fire("picked", {
                                            model: model
                                        });
                                        console.log(model); //ClientModel

                                    }
                                }
                            }

                        }
                    }
                }]
            }, {
                cssclass: "settings",
                attributes: {
                    tabindex: -1
                },
                content: [{
                    cssclass: "label",
                    content: "&nbsp;"
                }, {
                    cssclass: "bubble",
                    content: [{
                        content: "Size of Icons"
                    }, {
                        cssclass: "zoom-bar",
                        content: [{
                            cssclass: "zoom zoom-in",
                            content: "+",
                            capture: {
                                tap: function() {
                                    var level = this.model().iconSizeLevel();
                                    level += 0.25;
                                    level = Math.min(1.5, level);
                                    this.model().iconSizeLevel(level);
                                }
                            }
                        }, {
                            cssclass: "zooming",
                            content: nx.binding("model.iconSizeLevel", function(level) {
                                return glance.common.Util.toPercentage(level);
                            })
                        }, {
                            cssclass: "zoom zoom-out",
                            content: "-",
                            capture: {
                                tap: function() {
                                    var level = this.model().iconSizeLevel();
                                    level -= 0.25;
                                    level = Math.max(0.5, level);
                                    this.model().iconSizeLevel(level);
                                }
                            }
                        }]
                    }]
                }],
                capture: {
                    start: function(sender) {
                        if (document.activeElement === sender.dom()) {
                            sender.infocus = true;
                        }
                    },
                    tap: function(sender, evt) {
                        if (sender.infocus) {
                            sender.dom().blur();
                        } else {
                            sender.dom().focus();
                        }
                    },
                    end: function(sender) {
                        sender.infocus = false;
                    }
                }
            }]
        },
        properties: {
            model: null,
            listOptions: function() {
                return [{
                    key: "people",
                    options: [{
                        key: "person",
                        text: "Register User"
                    }, {
                        key: "image",
                        text: "Show Avatar"
                    }]
                }, {
                    key: "thing",
                    options: [{
                        key: "thing",
                        text: "Thing"
                    }]
                }, {
                    key: "place",
                    options: [{
                        key: "furnish",
                        text: "Furnish"
                    }, {
                        key: "zone",
                        text: "Zone"
                    }, {
                        key: "facility",
                        text: "Facility"
                    }]
                }, {
                    key: "analytic",
                    options: [{
                        key: "heatmap",
                        text: "Heat Map"
                    }]
                }];
            }
        },
        methods: {
            init: function() {
                this.inherited();
                this.retain(nx.Object.cascade(this, "model.search.isUseNativeKeyboard,search.word,nativesearch.word", function(isUseNativeKeyboard, searchWord, nativeWord) {
                    var model = this.model();
                    if (isUseNativeKeyboard) {
                        model && model.search().word(nativeWord);
                    } else {
                        model && model.search().word(searchWord);

                    }

                }.bind(this)));


            },
            onRegister: function() {
                var hash = nx.util.hash;
                var map = hash.getHashMap();
                map["#"] = "register";
                hash.setHashMap(map);
            },
            onCheck: function() {
                var hash = nx.util.hash;
                var map = hash.getHashMap();
                map["#"] = "check";
                hash.setHashMap(map);
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-control-panel": {
                    "position": "absolute",
                    "right": "0",
                    "top": "0",
                    "bottom": "0",
                    "width": "4em",
                    "border-left": "1px solid #f1f1f1",
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": "space-between"
                },
                ".glance-control-panel > .brand": {
                    "width": "2em",
                    "height": "4em",
                    "margin": "auto auto 1px auto"
                },
                ".glance-control-panel > nx-element": {
                    "position": "relative",
                    "height": "4em",
                    "line-height": "4em"
                },
                ".glance-control-panel > .sign": {
                    "nx:size": "4em",
                    "box-sizing": "border-box",
                    "text-align": "center",
                    "border": "1px solid #f1f1f1",
                    "border-radius": ".2em"
                },
                ".glance-control-panel > .sign:active:before": {
                    "content": " ",
                    "background": "#cd0101",
                    "nx:absolute": "3px"
                },
                ".glance-control-panel > .sign:after": {
                    "content": "\\f234",
                    "nx:absolute": "3px",
                    "font-size": "1.8em",
                    "line-height": "2.1em",
                    "color": "#cd0101",
                    "font-family": "FontAwesome"
                },
                ".glance-control-panel > .sign:active:after": {
                    "color": "white"
                },
                ".glance-control-panel > .display-mode": {
                    "flex-grow": "1",
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": "flex-start"
                },
                ".glance-control-panel > .display-mode > .button": {
                    "position": "relative",
                    "border-width": "0 0 1px 0",
                    "border-style": "solid",
                    "border-color": "#f1f1f1",
                    "margin": "-1px 0 0 0",
                    "height": "4em",
                    "text-align": "center",
                    "cursor": "default",
                    "color": "#cd0101"
                },
                ".glance-control-panel > .display-mode > .button:first-child": {
                    "border-width": "1px 0"
                },
                ".glance-control-panel > .display-mode > .button:focus:before": {
                    "content": " ",
                    "nx:absolute": "-1px",
                    "background": "#cd0101",
                    "border-color": "#f1f1f1"
                },
                ".glance-control-panel > .display-mode > .button > .label": {
                    "nx:absolute": "3px",
                    "font-family": "CiscoScreenPRO",
                    "font-size": ".7em",
                    "text-transform": "uppercase"
                },
                ".glance-control-panel > .display-mode > .button:focus > .label": {
                    "color": "white"
                },
                ".glance-control-panel > .display-mode > .button:not(:focus) > .label": {
                    "color": "#808080"
                },
                ".glance-control-panel > .display-mode > .button > .label:before": {
                    "font-family": "FontAwesome",
                    "display": "block",
                    "font-size": "3em",
                    "width": "1em",
                    "height": ".6em",
                    "line-height": "1.4em",
                    "text-align": "center",
                    "margin": "auto"
                },
                ".glance-control-panel > .display-mode > .button:not(:focus) > .label:before": {
                    "color": "#cd0101"
                },
                ".glance-control-panel > .display-mode > .button.button-people > .label:before": {
                    "content": "\\f21d"
                },
                ".glance-control-panel > .display-mode > .button.button-thing > .label:before": {
                    "content": "\\f109"
                },
                ".glance-control-panel > .display-mode > .button.button-place > .label:before": {
                    "content": "\\f041"
                },
                ".glance-control-panel > .display-mode > .button.button-analytic > .label:before": {
                    "content": "\\f080"
                },
                ".glance-control-panel > .display-mode > .button > .bubble": {
                    "nx:absolute": "-0.1em 100% auto auto",
                    "width": "8em",
                    "border": ".1em solid #cd0101",
                    "background": "#fff"
                },
                ".glance-control-panel > .display-mode > .button:not(:focus) > .bubble": {
                    "display": "none"
                },
                ".glance-control-panel > .display-mode > .button > .bubble:after": {
                    "content": " ",
                    "nx:absolute": "1.5em auto auto 100%",
                    "border-width": ".5em",
                    "border-style": "solid",
                    "border-color": "transparent transparent transparent white"
                },
                ".glance-control-panel > .search-panel > .search-toggle": {
                    "nx:size": "4em",
                    "box-sizing": "border-box",
                    "text-align": "center",
                    "border-top": "1px solid #f1f1f1"
                },
                ".glance-control-panel > .search-panel > .search-toggle:after": {
                    "content": "\\f002",
                    "nx:absolute": "3px",
                    "font-size": "1.8em",
                    "line-height": "2.1em",
                    "color": "#cd0101",
                    "font-family": "FontAwesome"
                },
                ".glance-control-panel > .search-panel.search-true > .search-toggle:after": {
                    "color": "white"
                },
                ".glance-control-panel > .search-panel.search-true > .search-toggle:before": {
                    "content": " ",
                    "background": "#cd0101",
                    "nx:absolute": "0px"
                },
                ".glance-control-panel > .search-panel > .search": {
                    "position": "fixed",
                    "bottom": "0",
                    "right": "4em",
                    "width": "30%",
                    "padding": "0 1%"
                },
                ".glance-control-panel > .search-panel:not(.search-true) > .search": {
                    "display": "none"
                },
                ".glance-control-panel > .search-panel:not(.search-true) > .native-search": {
                    "display": "none"
                },
                ".glance-control-panel > .search-panel > .search:after": {
                    "content": " ",
                    "nx:absolute": "7em auto auto 100%",
                    "border-width": ".5em",
                    "border-style": "solid",
                    "border-color": "transparent transparent transparent white"
                },
                ".glance-control-panel > .search-panel:not(.keyboard-native-true) > .native-search >": {
                    "display": "none"
                },
                ".glance-control-panel > .search-panel > .search > .list-container": {
                    "nx:absolute": "auto 5% 100%",
                    "background-color": "rgba(255,255,255,.8)",
                    "max-height": "10em",
                    "padding": ".5em"
                },
                ".glance-control-panel > .search-panel > .search > .list-container.list-0": {
                    "display": "none"
                },
                ".glance-control-panel > .search-panel > .search > .list-container > .list": {
                    "position": "relative",
                    "max-height": "9em",
                    "overflow": "scroll",
                    "overflow-x": "hidden",
                    "-webkit-overflow-scrolling": "touch"
                },
                ".glance-control-panel > .search-panel > .search > .list-container > .list > .item": {
                    "line-height": "2em",
                    "color": "#333"
                },
                ".glance-control-panel > .search-panel > .search > .list-container > .list > .item > .avatar": {
                    "display": "inline-block",
                    "vertical-align": "middle",
                    "width": "1.5em",
                    "height": "1.5em",
                    "border": ".1em solid #fbb03b",
                    "border-radius": "50%",
                    "overflow": "hidden"
                },
                ".glance-control-panel > .search-panel > .search > .list-container > .list > .item > :last-child": {
                    "display": "inline",
                    "margin-left": ".5em"
                },
                ".glance-control-panel > .search-panel > .search > .list-container > .list > .item > :last-child > span": {
                    "font-weight": "bold",
                    "color": "#fbb03b"
                },
                ".glance-control-panel > .search-panel > .native-search > .list-container": {
                    "position": "absolute",
                    "bottom": "5em",
                    "background-color": "rgba(255,255,255,.8)",
                    "max-height": "10em",
                    "padding": ".5em",
                    "width": "97%"
                },
                ".glance-control-panel > .search-panel > .native-search > .list-container.list-0": {
                    "display": "none"
                },
                ".glance-control-panel > .search-panel > .native-search > .list-container > .list": {
                    "position": "relative",
                    "max-height": "9em",
                    "overflow-y": "auto",
                    "overflow-x": "hidden",
                    "-webkit-overflow-scrolling": "touch",
                    "-webkit-overflow-y": "scroll"
                },
                ".glance-control-panel > .search-panel > .native-search > .list-container > .list > .item": {
                    "line-height": "2em",
                    "color": "#333"
                },
                ".glance-control-panel > .search-panel > .native-search > .list-container > .list > .item > .avatar": {
                    "display": "inline-block",
                    "vertical-align": "middle",
                    "width": "1.5em",
                    "height": "1.5em",
                    "border": ".1em solid #fbb03b",
                    "border-radius": "50%",
                    "overflow": "hidden"
                },
                ".glance-control-panel > .search-panel > .native-search > .list-container > .list > .item > :last-child": {
                    "display": "inline",
                    "margin-left": ".5em"
                },
                ".glance-control-panel > .search-panel > .native-search > .list-container > .list > .item > :last-child > span": {
                    "font-weight": "bold",
                    "color": "#fbb03b"
                },
                ".glance-control-panel > .settings": {
                    "position": "relative",
                    "border-width": "1px 0 0",
                    "border-style": "solid",
                    "border-color": "#f1f1f1",
                    "height": "4em",
                    "text-align": "center",
                    "cursor": "default",
                    "color": "#cd0101"
                },
                ".glance-control-panel > .settings:focus:before": {
                    "content": " ",
                    "nx:absolute": "-1px",
                    "background": "#cd0101",
                    "border-color": "#cd0101"
                },
                ".glance-control-panel > .settings > .label": {
                    "nx:absolute": "3px",
                    "font-family": "CiscoScreenPRO",
                    "font-size": ".7em",
                    "text-transform": "uppercase"
                },
                ".glance-control-panel > .settings:focus > .label": {
                    "color": "white"
                },
                ".glance-control-panel > .settings:not(:focus) > .label": {
                    "color": "#808080"
                },
                ".glance-control-panel > .settings > .label:before": {
                    "content": "\\f013",
                    "font-family": "FontAwesome",
                    "display": "block",
                    "font-size": "3em",
                    "width": "1em",
                    "height": ".6em",
                    "line-height": "2em",
                    "text-align": "center",
                    "margin": "auto"
                },
                ".glance-control-panel > .settings:not(:focus) > .label:before": {
                    "color": "#cd0101"
                },
                ".glance-control-panel > .settings > .bubble": {
                    "nx:absolute": "auto 100% -0.1em auto",
                    "text-align": "left",
                    "width": "8em",
                    "min-height": "4em",
                    "border": ".1em solid #cd0101",
                    "background": "#fff",
                    "font-size": ".8em",
                    "line-height": "1.2em",
                    "color": "#000",
                    "padding": ".5em"
                },
                ".glance-control-panel > .settings:not(:focus) > .bubble": {
                    "display": "none"
                },
                ".glance-control-panel > .settings > .bubble:after": {
                    "content": " ",
                    "nx:absolute": "auto auto 1.5em 100%",
                    "border-width": ".5em",
                    "border-style": "solid",
                    "border-color": "transparent transparent transparent white"
                },
                ".glance-control-panel > .settings > .bubble > .zoom-bar": {
                    "margin-top": ".2em",
                    "text-align": "center",
                    "display": "flex",
                    "justify-content": "space-between",
                    "border": "1px solid #000",
                    "border-radius": ".2em",
                    "line-height": "1.2em"
                },
                ".glance-control-panel > .settings > .bubble > .zoom-bar > .zoom": {
                    "nx:size": "1.2em 1.2em",
                    "color": "#cd0101",
                    "cursor": "pointer"
                },
                ".glance-control-panel > .settings > .bubble > .zoom-bar > .zoom-in": {
                    "border-right": "1px solid #000"
                },
                ".glance-control-panel > .settings > .bubble > .zoom-bar > .zoom-out": {
                    "border-left": "1px solid #000"
                },
                ".glance-control-panel > .settings > .bubble > .zoom-bar > .zooming": {
                    "flex-grow": "1"
                }
            })
        }
    });
})(nx);
