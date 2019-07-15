(function (nx) {

    var tostr = Object.prototype.toString;
    var hasown = Object.prototype.hasOwnProperty;

    /**
     * @class Map
     * @namespace nx
     */
    var EXPORT = nx.define("nx.Map", {
        methods: {
            init: function (map) {
                this.inherited();
                this._nummap = {};
                this._strmap = {};
                this._nxomap = {};
                this._objmap = [];
                // initialize
                if (nx.is(map, EXPORT)) {
                    map.each(function (value, key) {
                        this.set(key, value);
                    }, this);
                } else {
                    var key;
                    for (key in map) {
                        this.set(key, map[key]);
                    }
                }
            },
            /**
             * Clear all handling things.
             *
             * @method clear
             */
            clear: function () {
                delete this._undefined;
                delete this._null;
                delete this._true;
                delete this._false;
                this._nummap = {};
                this._strmap = {};
                this._nxomap = [];
                this._objmap = [];
                this.fire("change", {
                    action: "clear"
                });
            },
            /**
             * Check if specified key has value stored in the map.
             *
             * @method has
             * @param {Any} key The key.
             * @return {Boolean} Has or not.
             */
            has: function (key) {
                // check the type
                if (key === null) {
                    return hasown.call(this, "_null");
                } else if (key === undefined) {
                    return hasown.call(this, "_undefined");
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        return hasown.call(this, "_null");
                    case "[object Boolean]":
                        return hasown.call(this, key ? "_true" : "_false");
                    case "[object Undefined]":
                        return hasown.call(this, "_undefined");
                    case "[object Number]":
                        return hasown.call(this._nummap, key);
                    case "[object String]":
                        return hasown.call(this._strmap, key);
                    default:
                        if (key.__id__) {
                            return hasown.call(this._nxomap, key.__id__);
                        } else {
                            return !!EXPORT.getArrayMapItem(this._objmap, key);
                        }
                    }
                }
            },
            /**
             * Remove specified key.
             *
             * @method remove
             * @param {Any} key The key.
             */
            remove: function (key) {
                // XXX optimizable for obj-map
                var previousValue = this.get(key);
                // check the type
                if (key === null) {
                    delete this._null;
                } else if (key === undefined) {
                    delete this._undefined;
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        delete this._null;
                    case "[object Undefined]":
                        return this._undefined;
                    case "[object Boolean]":
                        if (key) {
                            delete this._true;
                        } else {
                            delete this._false;
                        }
                    case "[object Number]":
                        delete this._nummap[key];
                    case "[object String]":
                        delete this._strmap[key];
                    default:
                        if (key.__id__) {
                            delete this._nxomap[key.__id__];
                        } else {
                            EXPORT.removeArrayMapItem(this._objmap, key);
                        }
                    }
                }
                this.fire("change", {
                    action: "remove",
                    key: key,
                    previousValue: previousValue
                });
                return previousValue;
            },
            /**
             * Get value of specified key.
             *
             * @method get
             * @param {Any} key The key.
             * @return Value
             */
            get: function (key) {
                // check the type
                if (key === null) {
                    return this._null;
                } else if (key === undefined) {
                    return this._undefined;
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        return this._null;
                    case "[object Boolean]":
                        return key ? this._true : this._false;
                    case "[object Undefined]":
                        return this._undefined;
                    case "[object Number]":
                        return this._nummap[key];
                    case "[object String]":
                        return this._strmap[key];
                    default:
                        if (key.__id__) {
                            return (this._nxomap[key.__id__] || {}).value;
                        } else {
                            return EXPORT.getArrayMapValue(this._objmap, key);
                        }
                    }
                }
            },
            /**
             * Set value of specified key.
             *
             * @method set
             * @param {Any} key The key.
             * @param {Number} value The value to be set.
             * @return Final value
             */
            set: function (key, value) {
                // XXX optimizable for obj-map
                var previousValue = this.get(key);
                // check if change happening
                if (previousValue === value) {
                    return value;
                }
                // change value
                if (key === null) {
                    this._null = value;
                } else if (key === undefined) {
                    this._undefined = value;
                } else {
                    switch (tostr.call(key)) {
                    case "[object Null]":
                        this._null = value;
                        break;
                    case "[object Boolean]":
                        if (key) {
                            this._true = value;
                        } else {
                            this._false = value;
                        }
                        break;
                    case "[object Undefined]":
                        this._undefined = value;
                        break;
                    case "[object Number]":
                        this._nummap[key] = value;
                        break;
                    case "[object String]":
                        this._strmap[key] = value;
                        break;
                    default:
                        if (key.__id__) {
                            this._nxomap[key.__id__] = {
                                key: key,
                                value: value
                            };
                        } else {
                            EXPORT.setArrayMapValue(this._objmap, key, value);
                        }
                        break;
                    }
                }
                // trigger events
                this.fire("change", {
                    action: "set",
                    key: key,
                    previousValue: previousValue,
                    value: value
                });
                return value;
            },
            /**
             * Iterate all key-value pairs.
             *
             * @method each
             * @param fn The callback for each key-value pair
             * @return
             */
            each: function (fn, context) {
                if (hasown.call(this, "_undefined")) {
                    if (fn.call(context, this._undefined, undefined) === false) {
                        return false;
                    }
                }
                if (hasown.call(this, "_null")) {
                    if (fn.call(context, this._null, null) === false) {
                        return false;
                    }
                }
                if (hasown.call(this, "_true")) {
                    if (fn.call(context, this._true, true) === false) {
                        return false;
                    }
                }
                if (hasown.call(this, "_false")) {
                    if (fn.call(context, this._false, false) === false) {
                        return false;
                    }
                }
                var k, v, len;
                for (k in this._nummap) {
                    if (fn.call(context, this._nummap[k], Number(k)) === false) {
                        return false;
                    }
                }
                for (k in this._strmap) {
                    if (fn.call(context, this._strmap[k], k) === false) {
                        return false;
                    }
                }
                for (k in this._nxomap) {
                    v = this._nxomap[k];
                    if (fn.call(context, v.value, v.key) === false) {
                        return false;
                    }
                }
                for (k = 0, len = this._objmap.length; k < len; k++) {
                    v = this._objmap[k];
                    if (fn.call(context, v.value, v.key) === false) {
                        return false;
                    }
                }
            },
            /**
             * Apply a diff watcher, which handles each key-item-pair in the collection, to the dictionary.
             *
             * @method monitor
             * @param handler lambda(key, item) returning a rollback method
             * @return unwatcher A Object with unwatch method.
             */
            monitor: function (callback, context) {
                var map = this;
                var resources = new nx.Map();
                var listener = map.on("change", function (target, evt) {
                    var res;
                    switch (evt.action) {
                    case "set":
                        res = resources.get(evt.key);
                        res && res.release();
                        res = callback.call(context, evt.key, evt.value, evt.previousValue);
                        res && resources.set(evt.key, {
                            release: res
                        });
                        break;
                    case "remove":
                        res = resources.get(evt.key);
                        res && res.release();
                        break;
                    case "clear":
                        resources.each(function (res, key) {
                            res && res.release();
                        });
                        resources.clear();
                        break;
                    }
                });
                map.each(function (value, key) {
                    var res = callback.call(context, key, value);
                    res && resources.set(key, res);
                });
                return {
                    release: function () {
                        if (listener) {
                            resources.each(function (res, key) {
                                res && res.release();
                            });
                            resources.clear();
                            listener.release();
                            listener = null;
                        }
                    }
                };
            },
            cascade: function (keys, callback, context) {
                if (typeof keys === "string") {
                    keys = keys.replace(/\s/g, "").split(",");
                }
                var self = this;
                var values, resource;
                values = [];
                nx.each(keys, function (key) {
                    values.push(this.get(key));
                }, this);
                var listener = this.on("change", function (map, evt) {
                    var idx, vals;
                    switch (evt.action) {
                    case "set":
                    case "remove":
                        idx = keys.indexOf(evt.key);
                        if (idx >= 0 && values[idx] !== evt.value) {
                            values[idx] = evt.value;
                            vals = values.slice();
                            vals.push(evt.key, evt.previousValue);
                            callback.apply(context, vals);
                        }
                        break;
                    case "clear":
                        callback.call(context);
                        break;
                    }
                });
                callback.apply(context, values);
                return {
                    release: function () {
                        if (listener) {
                            listener.release();
                            listener = null;
                        }
                    }
                };
            },
            __each__: function (fn, context) {
                return this.each(fn, context);
            },
            __get__: function (key) {
                if (this[key] && this[key].__type__ === "property") {
                    return this[key].call(this);
                } else {
                    return this.get(key);
                }
            },
            __set__: function (key, value) {
                if (this[key] && this[key].__type__ === "property") {
                    return this[key].call(this, value);
                } else {
                    return this.set(key, value);
                }
            }
        },
        statics: {
            getArrayMapItem: function (map, key) {
                return map.filter(function (item) {
                    return item.key === key;
                })[0];
            },
            removeArrayMapItem: function (map, key) {
                nx.each(map, function (item, idx) {
                    if (item.key === key) {
                        map.splice(idx, 1);
                        return false;
                    }
                });
            },
            getArrayMapValue: function (map, key) {
                return (EXPORT.getArrayMapItem(map, key) || {}).value;
            },
            setArrayMapValue: function (map, key, value) {
                var item = EXPORT.getArrayMapItem(map, key);
                if (!item) {
                    map.push({
                        key: key,
                        value: value
                    });
                } else {
                    item.value = value;
                }
                return value;
            }
        }
    });

})(nx);
