(function(nx) {

    var PREFIX = nx.env.browser.cssPrefix;
    var stylize = nx.util.cssstyle.stylize;
    var uncamelize = nx.string.uncamelize;
    var camelize = nx.string.camelize;

    var KeyFrames = (function() {
        var KeyFrames = function(options) {
            if (!options.definition) {
                this.definition = options.definition;
            } else {
                this.definition = options.definition;
                var i, KEYS = KeyFrames.KEYS,
                    key;
                this.name = options.name || ("keyframes-" + nx.uuid());
                for (i = 1; i < KEYS.length; i++) {
                    key = KEYS[i];
                    this[key] = options[key] || options[camelize(key)];
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
    })();

    var EXCEPTIONS = {
        selector: {
            "::placeholder": {
                regexp: /::placeholder/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "input-placeholder";
                }
            },
            "::scrollbar": {
                regexp: /::scrollbar/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "scrollbar";
                }
            },
            "::scrollbar-track": {
                regexp: /::scrollbar-track/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "scrollbar-track";
                }
            },
            "::scrollbar-thumb": {
                regexp: /::scrollbar-thumb/g,
                handler: function() {
                    // TODO actually worse in Firefox and MS
                    return "::" + PREFIX + "scrollbar-thumb";
                }
            }
        }
    };

    var EXPORT = nx.define("nx.util.csssheet", {
        static: true,
        methods: {
            create: function create(identity, map, oncreate) {
                // optionalize arguments
                if (typeof identity !== "string") {
                    oncreate = map;
                    map = identity;
                    identity = "jss-" + nx.serial();
                }
                // make sure the creation will be called
                return nx.ready(function() {
                    // TODO for ie
                    // create the style node
                    var cssText = EXPORT.css(map);
                    var resource, style_node, head = document.getElementsByTagName("head")[0];
                    style_node = document.createElement("style");
                    style_node.setAttribute("id", identity);
                    style_node.setAttribute("type", "text/css");
                    style_node.setAttribute("media", "screen");
                    style_node.setAttribute("rel", "stylesheet");
                    style_node.appendChild(document.createTextNode(cssText));
                    // clear previous and append new
                    head.appendChild(style_node);
                    // callback when finally created
                    resource = oncreate && oncreate(style_node, identity);
                    return {
                        release: function() {
                            resource && resource.release();
                            resource = null;
                            style_node && head.removeChild(style_node);
                            style_node = null;
                        }
                    };
                });
            },
            css: function(css) {
                var selector, rules, texts = [""];
                for (selector in css) {
                    texts[0] += EXPORT._rule(texts, selector, css[selector]);
                }
                return texts.join("");
            },
            keyframes: function(options) {
                return new KeyFrames(options);
            },
            _pair: function(texts, key, value) {
                if (key.indexOf("nx:") === 0) {
                    return EXPORT._nxpair(texts, key.substring(3), value);
                }
                if (key === "animation" && value instanceof KeyFrames) {
                    if (!value.name) {
                        value.name = "keyframes-" + nx.uuid();
                    }
                    // create the KeyFrames in CSS text
                    texts.push("@" + PREFIX + "keyframes " + value.name + " {" + EXPORT.css(value.definition) + "}");
                    if (navigator.userAgent.indexOf("Safari/6") >= 0) {
                        // fix bug of animation on Safari 6
                        return (function(kf) {
                            // return the value setting
                            var i, key, value, kv;
                            var KEYS = KeyFrames.KEYS;
                            var DEFAULTS = KeyFrames.DEFAULTS;
                            var animation = [];
                            for (i = 0; i < KEYS.length; i++) {
                                key = KEYS[i];
                                if (kf[key] || typeof kf[key] === "number") {
                                    value = kf[key];
                                } else {
                                    value = DEFAULTS[key];
                                }
                                kv = stylize("animation-" + key, value);
                                animation.push(kv.text);
                            }
                            return animation.join("");
                        })(value);
                    }
                    value = (function(kf) {
                        // return the value setting
                        var i, key;
                        var KEYS = KeyFrames.KEYS;
                        var DEFAULTS = KeyFrames.DEFAULTS;
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
                var kv = stylize(key, value);
                return kv.text;
            },
            _nxpair: function(texts, key, value) {
                var result;
                switch (key) {
                    case "fixed":
                    case "absolute":
                        if (typeof value === "string") {
                            value = nx.string.trim(value).split(/\s*[,\s]\s*/);
                        }
                        result = "position:" + key + ";";
                        if (value.length >= 4) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "right", value[1]));
                            value[2] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[2]));
                            value[3] !== "auto" && (result += EXPORT._pair(texts, "left", value[3]));
                        } else if (value.length === 3) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "right", value[1]));
                            value[2] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[2]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "left", value[1]));
                        } else if (value.length === 2) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "right", value[1]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "left", value[1]));
                        } else if (value.length === 1 && value[0]) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "top", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "right", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "bottom", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "left", value[0]));
                        }
                        break;
                    case "size":
                        if (typeof value === "string") {
                            value = nx.string.trim(value).split(/\s*[,\s]\s*/);
                        }
                        result = "";
                        if (value.length >= 2) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "width", value[0]));
                            value[1] !== "auto" && (result += EXPORT._pair(texts, "height", value[1]));
                        } else if (value.length === 1 && value[0]) {
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "width", value[0]));
                            value[0] !== "auto" && (result += EXPORT._pair(texts, "height", value[0]));
                        }
                        break;
                }
                return result;
            },
            _rule: function(texts, selector, rules) {
                var grouped = "",
                    key, value;
                if (rules instanceof KeyFrames) {
                    // create the KeyFrames in CSS text
                    texts.push("@" + PREFIX + "keyframes " + (selector) + " {" + EXPORT.css(rules.definition) + "}");
                    // other properties are ignored
                    return "";
                } else {
                    for (key in rules) {
                        value = rules[key];
                        grouped += EXPORT._pair(texts, key, value);
                    }
                    // fixup selector
                    nx.each(EXCEPTIONS.selector, function(value, key) {
                        if (selector.indexOf(key) >= 0) {
                            selector = selector.replace(value.regexp, value.handler);
                        }
                    });
                    return selector + "{" + grouped + "}";
                }
            }
        }
    });
})(nx);
