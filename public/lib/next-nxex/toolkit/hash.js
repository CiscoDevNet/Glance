(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Observable
     * @namespace nxex
     */
    var EXPORT = nx.define(nxex.Observable, {
        properties: {
            map: {
                value: function () {
                    return new nx.data.ObservableDictionary();
                },
                init: function () {
                    window.addEventListener("hashchange", this.onhashchange.bind(this));
                    this.onhashchange();
                }
            }
        },
        methods: {
            getHashMap: function () {
                return this.toHashMap(window.location.hash);
            },
            setHashMap: function (map) {
                var hash = [];
                nx.each(map, function (value, key) {
                    if (key === "#" && value) {
                        hash.unshift(value);
                    } else if (value || typeof value === "string") {
                        hash.push(key + "=" + value);
                    }
                });
                return window.location.href = "#" + hash.join("&");
            },
            onhashchange: function () {
                var maplast, map, hash = window.location.hash;
                // no different between "" and "#"
                if (hash) {
                    map = this.toHashMap(hash);
                } else {
                    map = {};
                }
                // get old map
                maplast = this._lastHashMap || {};
                // update map
                this.updateMap(maplast, map);
                // store the hash map
                this._lastHashMap = map;
            },
            updateMap: function (maplast, map) {
                var dict = this.map();
                var has = Object.prototype.hasOwnProperty;
                nx.each(maplast, function (value, key) {
                    if (!has.call(map, key)) {
                        dict.removeItem(key);
                    }
                });
                nx.each(map, function (value, key) {
                    dict.setItem(key, value);
                });
            },
            toHashMap: function (hash) {
                var pairs, main, map = {};
                pairs = hash.substring(1).split("&");
                if (pairs[0].indexOf("=") === -1) {
                    map["#"] = pairs.shift();
                } else {
                    map["#"] = null;
                }
                nx.each(pairs, function (pair) {
                    pair = pair.split("=");
                    if (pair.length < 2) {
                        pair[1] = true;
                    }
                    map[pair[0]] = pair[1];
                });
                return map;
            }
        }
    });

    var hashMonitor = new EXPORT();

    nx.path(toolkit, "hash", hashMonitor);

})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
