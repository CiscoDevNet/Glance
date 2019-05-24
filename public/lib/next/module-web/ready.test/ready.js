module("ready");

(function () {
    var loading = !(document.readyState === "interactive" || document.readyState === "complete");
    var nReady = 0;
    var nRelease = 0;
    var fn = function () {
        nReady++;
        return {
            release: function () {
                nRelease++;
            }
        };
    };
    var resource = nx.ready(fn);
    var xReady = nReady;
    test("ready function", function () {
        // on loading
        ok(loading, "testing on loading");
        equal(xReady, 0, "not called immidiately on loading");
        equal(nReady, 1, "ready on loading");
        equal(nRelease, 0, "not released");
        resource.release();
        equal(nRelease, 1, "can be released");
        // on loaded
        loading = !(document.readyState === "interactive" || document.readyState === "complete");
        resource = nx.ready(fn);
        ok(!loading, "testing on loaded");
        equal(nReady, 2, "ready on loade");
        equal(nRelease, 1, "not released on initial");
        resource.release();
        equal(nRelease, 2, "can be released");
    });
})();

(function () {
    var loading = !(document.readyState === "interactive" || document.readyState === "complete");
    var nReady = 0;
    var nRelease = 0;
    var tag = "div-" + nx.uuid();
    var Class = nx.define({
        properties: {
            dom: function () {
                return document.createElement(tag);
            }
        },
        methods: {
            init: function () {
                this.inherited();
                nReady++;
                this.retain({
                    release: function () {
                        nRelease++;
                    }
                });
            }
        }
    });
    var resource = nx.ready(Class);
    var xReady = nReady;
    var xDom = document.getElementsByTagName(tag)[0];
    test("ready class and dom", function () {
        // on loading
        ok(loading, "testing on loading");
        equal(xReady, 0, "not called immidiately on loading");
        ok(!xDom, "not attached immidiately on loading");
        equal(nReady, 1, "ready on loading");
        xDom = document.getElementsByTagName(tag)[0];
        ok(xDom, "attached on loading");
        equal(nRelease, 0, "not released on initial");
        resource.release();
        equal(nRelease, 1, "can be released");
        xDom = document.getElementsByTagName(tag)[0];
        ok(!xDom, "detached on release");
        // on loaded
        loading = !(document.readyState === "interactive" || document.readyState === "complete");
        resource = nx.ready(Class);
        ok(!loading, "testing on loaded");
        equal(nReady, 2, "ready on loade");
        equal(nRelease, 1, "not released on initial");
        xDom = document.getElementsByTagName(tag)[0];
        ok(xDom, "attached immidiately on loaded");
        resource.release();
        equal(nRelease, 2, "can be released");
        xDom = document.getElementsByTagName(tag)[0];
        ok(!xDom, "detached on release");
    });
})();
