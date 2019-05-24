(function(nx) {
    /**
     * @namespace nx.util
     */
    var EXPORT = nx.define("nx.util.hash", {
        static: true,
        properties: {
            map: function() {
                return new nx.Map();
            }
        },
        methods: {
            init: function() {
                this.inherited();
                window.addEventListener("hashchange", this.onhashchange.bind(this));
                this.onhashchange();
            },
            getHashString: function() {
                var hash = window.location.hash;
                // FIXME the bug of browser: hash of "xxx#" is "", not "#"
                if (!hash) {
                    hash = window.location.href.indexOf("#");
                    if (hash >= 0) {
                        hash = window.location.href.substring(hash);
                    } else {
                        hash = "";
                    }
                }
                return hash;
            },
            getHashMap: function() {
                return this.toHashMap(this.getHashString());
            },
            setHashMap: function(map) {
                var hash = [];
                nx.each(map, function(value, key) {
                    if (key === "#") {
                        hash.unshift(value || "");
                    } else if (value || typeof value === "string") {
                        hash.push(key + "=" + value);
                    }
                });
                return window.location.href = "#" + hash.join("&");
            },
            onhashchange: function() {
                var maplast, map, hash = this.getHashString();
                map = this.toHashMap(hash);
                // get old map
                maplast = this._lastHashMap || {};
                // update map
                this.updateMap(maplast, map);
                // store the hash map
                this._lastHashMap = map;
                // fire hash change event
                this.fire("change", nx.global.location.href);
            },
            updateMap: function(maplast, map) {
                var dict = this.map();
                var has = Object.prototype.hasOwnProperty;
                nx.each(maplast, function(value, key) {
                    if (!has.call(map, key)) {
                        dict.remove(key);
                    }
                });
                nx.each(map, function(value, key) {
                    dict.set(key, value);
                });
            },
            toHashMap: function(hash) {
                if (!hash) {
                    return {};
                }
                var pairs, main, map = {};
                pairs = hash.substring(1).split("&");
                if (pairs[0].indexOf("=") === -1) {
                    map["#"] = pairs.shift();
                } else {
                    map["#"] = null;
                }
                nx.each(pairs, function(pair) {
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

})(nx);
