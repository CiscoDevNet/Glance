(function (nx) {

    var global = nx.global;
    var document = global.document;
    var ua = navigator.userAgent.toLowerCase();
    var os = (function () {
        var os, patterns = {
            "windows": /windows|win32/,
            "macintosh": /macintosh|mac_powerpc/,
            "linux": /linux/
        };
        for (os in patterns) {
            if (patterns[os].test(ua)) {
                return os;
            }
        }
        return "other";
    })();

    var browser = (function () {
        var getVersionByPrefix = function (prefix) {
            var match = new RegExp(prefix + '(\\d+\\.\\d+)').exec(ua);
            return match ? parseFloat(match[1]) : 0;
        };
        var browser, browsers = [{
            tests: [/msie/, /^(?!.*opera)/],
            name: "ie",
            version: getVersionByPrefix("msie "),
            prefix: "ms", // not checked
            cssPrefix: "-ms-",
            engine: {
                name: "trident",
                version: getVersionByPrefix("trident\\/") || 4
            }
        }, {
            tests: [/gecko/, /^(?!.*webkit)/],
            name: "firefox",
            version: getVersionByPrefix("\\bfirefox\/"),
            prefix: "Moz",
            cssPrefix: "-moz-",
            engine: {
                name: "gecko",
                version: getVersionByPrefix("rv:") || 4
            }
        }, {
            tests: [/\bchrome\b/],
            name: "chrome",
            version: getVersionByPrefix('\\bchrome\/'),
            prefix: "webkit",
            cssPrefix: "-webkit-",
            engine: {
                name: 'webkit',
                version: getVersionByPrefix('webkit\\/')
            }
        }, {
            tests: [/safari/, /^(?!.*\bchrome\b)/],
            name: "safari",
            version: getVersionByPrefix('version\/'),
            prefix: "webkit",
            cssPrefix: "-webkit-",
            engine: {
                name: 'webkit',
                version: getVersionByPrefix('webkit\\/')
            }
        }, {
            tests: [/opera/],
            name: "opera",
            version: getVersionByPrefix('version\/'),
            prefix: "O",
            cssPrefix: "-o-",
            engine: {
                name: getVersionByPrefix("presto\\/") ? "presto" : "webkit",
                version: getVersionByPrefix("presto\\/") || getVersionByPrefix("webkit\\/")
            }
        }];
        // do browser determination one by one
        while (browsers.length) {
            browser = browsers.shift();
            while (browser.tests.length) {
                if (!browser.tests[0].test(ua)) {
                    break;
                }
                browser.tests.shift();
            }
            if (browser.tests.length) {
                continue;
            }
            delete browser.tests;
            return browser;
        }
        return {
            name: "other",
            version: 0,
            engine: {
                name: "unknown",
                version: 0
            }
        };
    })();

    var ie = browser.name === "ie" && browser.version;
    var tempElement = document.createElement('div');
    var tempStyle = tempElement.style;

    /**
     * 
     * @class env
     * @namespace nx
     */
    nx.define("nx.env", {
        statics: {
            /**
             * The document mode.
             *
             * @static
             * @property documentMode
             */
            documentMode: document.documentMode || 0,
            /**
             * In compat mode or not.
             *
             * @static
             * @property compatMode
             */
            compatMode: document.compatMode,
            /**
             * In strict mode or not.
             *
             * @static
             * @property strict
             */
            strict: document.compatMode === "CSS1Compat",
            /**
             * Using secure connection or not.
             *
             * @static
             * @property secure
             */
            secure: location.protocol.toLowerCase() === "https:",
            /**
             * Same as navigator.userAgent.
             *
             * @static
             * @property userAgent
             */
            userAgent: ua,
            /**
             * Operating system: windows, macintosh, linux or other.
             *
             * @static
             * @property os
             */
            os: os,
            /**
             * The browser's name, version, prefix/cssPrefix, and engine.
             * The engine contains its name and version.
             *
             * @static
             * @property browser
             */
            browser: browser,
            /**
             * The support status to some special features of current browser.
             *
             * @static
             * @property SUPPORT_MAP
             */
            SUPPORT_MAP: {
                addEventListener: !!document.addEventListener,
                dispatchEvent: !!document.dispatchEvent,
                getBoundingClientRect: !!document.documentElement.getBoundingClientRect,
                onmousewheel: 'onmousewheel' in document,
                XDomainRequest: !!window.XDomainRequest,
                crossDomain: !!(window.XDomainRequest || window.XMLHttpRequest),
                getComputedStyle: 'getComputedStyle' in window,
                iePropertyChange: !!(ie && ie < 9),
                w3cChange: !ie || ie > 8,
                w3cFocus: !ie || ie > 8,
                w3cInput: !ie || ie > 9,
                innerText: 'innerText' in tempElement,
                firstElementChild: 'firstElementChild' in tempElement,
                cssFloat: 'cssFloat' in tempStyle,
                opacity: (/^0.55$/).test(tempStyle.opacity),
                filter: 'filter' in tempStyle,
                classList: !!tempElement.classList,
                removeProperty: 'removeProperty' in tempStyle,
                touch: 'ontouchstart' in document.documentElement
            },
            /**
             * Some key code of known keys.
             *
             * @static
             * @property KEY_MAP
             */
            KEY_MAP: {
                BACKSPACE: 8,
                TAB: 9,
                CLEAR: 12,
                ENTER: 13,
                SHIFT: 16,
                CTRL: 17,
                ALT: 18,
                META: (browser.name === "chrome" || browser.name === "webkit" || browser.name === "safari") ? 91 : 224, // the apple key on macs
                PAUSE: 19,
                CAPS_LOCK: 20,
                ESCAPE: 27,
                SPACE: 32,
                PAGE_UP: 33,
                PAGE_DOWN: 34,
                END: 35,
                HOME: 36,
                LEFT_ARROW: 37,
                UP_ARROW: 38,
                RIGHT_ARROW: 39,
                DOWN_ARROW: 40,
                INSERT: 45,
                DELETE: 46,
                HELP: 47,
                LEFT_WINDOW: 91,
                RIGHT_WINDOW: 92,
                SELECT: 93,
                NUMPAD_0: 96,
                NUMPAD_1: 97,
                NUMPAD_2: 98,
                NUMPAD_3: 99,
                NUMPAD_4: 100,
                NUMPAD_5: 101,
                NUMPAD_6: 102,
                NUMPAD_7: 103,
                NUMPAD_8: 104,
                NUMPAD_9: 105,
                NUMPAD_MULTIPLY: 106,
                NUMPAD_PLUS: 107,
                NUMPAD_ENTER: 108,
                NUMPAD_MINUS: 109,
                NUMPAD_PERIOD: 110,
                NUMPAD_DIVIDE: 111,
                F1: 112,
                F2: 113,
                F3: 114,
                F4: 115,
                F5: 116,
                F6: 117,
                F7: 118,
                F8: 119,
                F9: 120,
                F10: 121,
                F11: 122,
                F12: 123,
                F13: 124,
                F14: 125,
                F15: 126,
                NUM_LOCK: 144,
                SCROLL_LOCK: 145
            }
        }
    });
})(nx);
