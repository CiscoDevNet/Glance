(function (nx, ui, toolkit, global) {
    var EXPORT = nx.path(toolkit, "css", (function () {
        var internal = {
            PREFIX: (function () {
                // FIXME
                return "-webkit-";
                return nx.browser.webkit ? "-webkit-" : (nx.browser.mozilla || nx.browser.firefox ? "-moz-" : "");
            })(),
            KeyFrames: (function () {
                var KeyFrames = function (options) {
                    if (!options.definition) {
                        this.definition = options.definition;
                    } else {
                        this.definition = options.definition;
                        var i, KEYS = KeyFrames.KEYS,
                            key;
                        this.name = options.name || ("keyframes-" + toolkit.uuid());
                        for (i = 1; i < KEYS.length; i++) {
                            key = KEYS[i];
                            this[key] = options[key] || options[internal.uncamelize(key)];
                        }
                    }
                };
                KeyFrames.KEYS = ["name", "duration", "timing-function", "delay", "iteration-count", "direction", "fill-mode", "play-state"];
                KeyFrames.DEFAULTS = {
                    "duration": "0s",
                    "timing-function": "ease",
                    "delay": "0s",
                    "iteration-count": "infinite",
                    "direction": "normal",
                    "fill-mode": "none",
                    "play-state": "running"
                };
                return KeyFrames;
            })(),
            keyframes: function (options) {
                return new internal.KeyFrames(options);
            },
            camelize: function (str) {
                return str.replace(/-\w/g, function (c) {
                    return c.charAt(1).toUpperCase();
                });
            },
            uncamelize: function (str) {
                return str.replace(/[A-Z]/g, function (c) {
                    return "-" + c.toLowerCase();
                });
            },
            standardize: function (key, value) {
                key = internal.uncamelize(key);
                // TODO more special rules
                // TODO add "px" for measurable keys
                // TODO pre-process for cross browser: prefix of -webkit-, -moz-, -o-, etc.
                switch (key) {
                case "display":
                    if (value === "flex") {
                        value = internal.PREFIX + value;
                    }
                    break;
                case "user-select":
                    // user-select
                case "transform":
                case "transform-origin":
                    // transform
                case "animation":
                case "animation-name":
                case "animation-duration":
                case "animation-delay":
                case "animation-iteration-count":
                case "animation-timing-function":
                case "animation-fill-mode":
                    // animation relative
                case "flex-direction":
                case "flex-flow":
                case "flex-wrap":
                case "justify-content":
                case "align-content":
                case "align-items":
                    // flex box parent
                case "flex":
                case "order":
                case "flex-grow":
                case "flex-shrink":
                case "flex-basis":
                case "align-self":
                    // flex box child
                    key = internal.PREFIX + key;
                    break;
                case "content":
                    value = "\"" + value + "\"";
                    break;
                case "background-image":
                    value = value.replace(/\S*gradient\(/gi, function (match) {
                        return internal.PREFIX + match;
                    });
                    break;
                }
                return {
                    key: key,
                    value: value
                };
            },
            pair: function (texts, key, value) {
                if (key === "animation" && value instanceof internal.KeyFrames) {
                    if (!value.name) {
                        value.name = "keyframes-" + nx.uuid();
                    }
                    // create the KeyFrames in CSS text
                    texts.push("@" + internal.PREFIX + "keyframes " + value.name + " {" + internal.css(value.definition) + "}");
                    if (navigator.userAgent.indexOf("Safari/6") >= 0) {
                        // fix bug of animation on Safari 6
                        return (function (kf) {
                            // return the value setting
                            var i, key, value, kv;
                            var KEYS = internal.KeyFrames.KEYS;
                            var DEFAULTS = internal.KeyFrames.DEFAULTS;
                            var animation = [];
                            for (i = 0; i < KEYS.length; i++) {
                                key = KEYS[i];
                                if (kf[key] || typeof kf[key] === "number") {
                                    value = kf[key];
                                } else {
                                    value = DEFAULTS[key];
                                }
                                kv = internal.standardize("animation-" + key, value);
                                animation.push(kv.key + ":" + kv.value + ";");
                            }
                            return animation.join("");
                        })(value);
                    }
                    value = (function (kf) {
                        // return the value setting
                        var i, key;
                        var KEYS = internal.KeyFrames.KEYS;
                        var DEFAULTS = internal.KeyFrames.DEFAULTS;
                        var animation = [];
                        for (i = 0; i < KEYS.length; i++) {
                            key = KEYS[i];
                            if (kf[key] || typeof kf[key] === "number") {
                                animation.push(kf[key]);
                            } else {
                                animation.push(DEFAULTS[key]);
                            }
                        }
                        return animation.join(" ");
                    })(value);
                }
                var kv = internal.standardize(key, value);
                return kv.key + ":" + kv.value + ";";
            },
            rule: function (texts, selector, rules) {
                var grouped = "",
                    key, value;
                if (rules instanceof internal.KeyFrames) {
                    grouped = internal.css(rules.definition);
                } else {
                    for (key in rules) {
                        value = rules[key];
                        grouped += internal.pair(texts, key, value);
                    }
                    // TODO more specialize
                    if (selector.indexOf(":input-placeholder") >= 0) {
                        selector = selector.replace(/:input-placeholder/g, ":" + internal.PREFIX + "input-placeholder");
                    }
                }
                return selector + "{" + grouped + "}";
            },
            css: function (css) {
                var texts = [""],
                    selector, rules;
                for (selector in css) {
                    texts[0] += internal.rule(texts, selector, css[selector]);
                }
                return texts.join("");
            }
        };
        var delayed = [],
            identified = {};
        nx.dom.Document.ready(function () {
            var i;
            for (i = 0; i < delayed.length; i++) {
                delayed[i].call(this);
            }
            delayed = null;
        });

        function css(identity, map, oncreate) {
            if (typeof identity !== "string") {
                oncreate = map;
                map = identity;
                identity = toolkit.uuid();
            }
            // TODO for ie
            var applier = function () {
                // create the style node
                var cssText = internal.css(map);
                var style_node, head = document.getElementsByTagName("head")[0];
                style_node = document.createElement("style");
                style_node.setAttribute("type", "text/css");
                style_node.setAttribute("media", "screen");
                style_node.setAttribute("rel", "stylesheet");
                style_node.appendChild(document.createTextNode(cssText));
                // clear previous and append new
                head.appendChild(style_node);
                if (identified[identity]) {
                    head.removeChild(identified[identity]);
                }
                // mark new
                identified[identity] = style_node;
                // notify the callback
                if (oncreate) {
                    oncreate(style_node);
                }
            };
            // clear this css style from head
            var releaser = function () {
                var head = document.getElementsByTagName("head")[0];
                if (identified[identity]) {
                    head.removeChild(identified[identity]);
                }
            };
            if (delayed) {
                delayed.push(applier);
            } else {
                applier();
            }
            return {
                identity: identity,
                release: releaser
            };
        }
        css.identified = function (identity) {
            return identified[identity];
        };
        css.keyframes = internal.keyframes;
        css.standardize = internal.standardize;
        css.PREFIX = internal.PREFIX || "";
        return css;
    })());
})(nx, nx.ui, nxex.toolkit, window);
