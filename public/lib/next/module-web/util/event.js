(function(nx) {
    var browser = nx.env.browser;
    var prefix = browser.cssPrefix;

    var EXPORT = nx.define("nx.util.event", {
        statics: {
            supported: function(dom) {
                if (dom === window) {
                    return EXPORT.EVENTS_WINDOW.slice();
                }
                return EXPORT.EVENTS_BASIC.concat(EXPORT.EVENTS_TAG[dom.tagName.toLowerCase()]);
            },
            EVENTS_WINDOW: [
                "load",
                "unload",
                "resize"
            ],
            EVENTS_BASIC: [
                "click",
                "dblclick",
                "contextmenu",
                "mousedown",
                "mouseup",
                "mousemove",
                "mouseenter",
                "mouseleave",
                "mouseover",
                "mouseout",
                "keydown",
                "keyup",
                "keypress",
                "focus",
                "blur",
                "touchstart",
                "touchmove",
                "touchend",
                "touchcancel"
            ],
            EVENTS_TAG: {
                "form": [
                    "reset",
                    "submit"
                ],
                "input": [
                    "change",
                    "input"
                ],
                "textarea": [
                    "change",
                    "input"
                ],
                "select": [
                    "select"
                ],
                "img": [
                    "load",
                    "error"
                ]
            }
        }
    });
})(nx);
