(function(nx) {

    var global = nx.global;
    var splice = Array.prototype.splice;
    var slice = Array.prototype.slice;
    var hasown = Object.prototype.hasOwnProperty;
    var mathsign = Math.sign || nx.math.sign;

    var REGEXP_CHECK = /^(&&|\|\||&|\||\^|-|\(|\)|[a-zA-Z\_][a-zA-Z\d\_]*|\s)*$/;
    var REGEXP_TOKENS = /&&|\|\||&|\||\^|-|\(|\)|[a-zA-Z\_][a-zA-Z\d\_]*/g;
    var REGEXP_OPN = /[a-zA-Z\_][a-zA-Z\d\_]*/;
    var REGEXP_OPR = /&&|\|\||&|\||\^|-|\(|\)/;
    var OPERATORNAMES = {
        "-": "complement",
        "&": "cross",
        "^": "delta",
        "|": "union",
        "&&": "and",
        "||": "or"
    };

    /**
     * @class List
     * @namespace nx
     */
    var EXPORT = nx.define("nx.List", {
        properties: {
            length: {
                set: function() {
                    throw new Error("Unable to set length of List");
                }
            },
            data: {
                set: function() {
                    throw new Error("Unable to set data of List");
                }
            }
        },
        methods: {
            /**
             * @constructor
             * @param data {Array|List} Initial list.
             */
            init: function(data) {
                this.inherited();
                // optimize
                this._counting_map = new nx.Counter();
                this._counting_num = 0;
                this._counting_res = null;
                // initialize
                this._length = 0;
                this._data = [];
                if (nx.is(data, "Array")) {
                    this.spliceAll(0, 0, data.slice());
                } else if (nx.is(data, EXPORT)) {
                    this.spliceAll(0, 0, data._data.slice());
                }
            },
            /**
             * To Array.
             *
             * @method toArray
             * @return An array with the whole list data.
             */
            toArray: function() {
                return this._data.slice();
            },
            /**
             * Create a sub list from specified start position and length.
             *
             * @method slice
             * @param start Optional. Default 0.
             * @param end Optional. Default the current length of list.
             * @return A difference-object.
             */
            slice: function(start, end) {
                return new EXPORT(slice.call(this._data, start, end));
            },
            /**
             * Get the value at speicified position.
             *
             * @method get
             * @param index The index of value to be get.
             * @return value
             */
            get: function(index) {
                if (index >= 0) {
                    return this._data[index];
                } else if (index < 0) {
                    return this._data[this._data.length + index];
                }
            },
            /**
             * Iterate all values and indices in the list.
             *
             * @method each
             * @param callback The callback for each value.
             * @param context (Optional)
             * @return False if the iteration stoped by returning false in the callback.
             */
            each: function(callback, context) {
                return nx.each(this._data, callback, context);
            },
            __each__: function(callback, context) {
                return nx.each(this._data, callback, context);
            },
            /**
             * Check the list containing a value or not.
             *
             * @method contains
             * @param value
             * @return Containing or not.
             */
            contains: function(value) {
                return this._data.indexOf(value) >= 0;
            },
            /**
             * Find the first index of a value.
             *
             * @method indexOf
             * @return The index value, -1 if not found
             */
            indexOf: function(value, since) {
                return this._data.indexOf(value, since);
            },
            /**
             * Find the last index of a value.
             *
             * @method lastIndexOf
             * @param value The value attemp to find
             * @param since The start point.
             * @return The index value, -1 if not found
             */
            lastIndexOf: function(value, since) {
                if (since === undefined) {
                    return this._data.lastIndexOf(value);
                } else {
                    return this._data.lastIndexOf(value, since);
                }
            },
            /**
             * Find an item that matches the check function.
             *
             * @method fn The match function
             * @return The item.
             */
            find: function(fn) {
                if (this._data.find) {
                    return this._data.find(fn);
                } else {
                    var i;
                    for (i = 0; i < this._data.length; i++) {
                        if (fn(this._data[i])) {
                            return this._data[i];
                        }
                    }
                }
            },
            /**
             * Find an item that matches the check function, and returns its index.
             *
             * @method fn The match function
             * @return The index, -1 if not found.
             */
            findIndex: function(fn) {
                if (this._data.find) {
                    return this._data.findIndex(fn);
                } else {
                    var i;
                    for (i = 0; i < this._data.length; i++) {
                        if (fn(this._data[i])) {
                            return i;
                        }
                    }
                    return -1;
                }
            },
            /**
             * Add variable number of items at the tail of list.
             *
             * @method push
             * @return New length.
             */
            push: function() {
                this.spliceAll(this._data.length, 0, slice.call(arguments));
                return this._data.length;
            },
            /**
             * Add an array of items at the tail of list.
             *
             * @method pushAll
             * @return New length.
             */
            pushAll: function(items) {
                this.spliceAll(this._data.length, 0, items);
                return this._data.length;
            },
            /**
             * Remove the last item at the head of list.
             *
             * @method pop
             * @return The pop item.
             */
            pop: function() {
                return this.spliceAll(this._data.length - 1, 1, [])[0];
            },
            /**
             * Insert variable number of items at the head of list.
             *
             * @method unshift
             * @return New length.
             */
            unshift: function() {
                this.spliceAll(0, 0, slice.call(arguments));
                return this._data.length;
            },
            /**
             * Insert an array of items at the head of list.
             *
             * @method unshift
             * @return New length.
             */
            unshiftAll: function(items) {
                this.spliceAll(0, 0, items);
                return this._data.length;
            },
            /**
             * Remove the first item at the head of list.
             *
             * @method shift
             * @return The shift item.
             */
            shift: function() {
                return this.spliceAll(0, 1, [])[0];
            },
            /**
             * Remove specified count of items from specified start position, and insert variable number of items at the position.
             *
             * @method splice
             * @param offset Optional. Default 0.
             * @param count Optional. Default the current length of list.
             * @param items... Variable. The items gonna be inserted.
             * @return A difference-object.
             */
            splice: function(offset, count) {
                return this.spliceAll(offset, count, slice.call(arguments, 2));
            },
            /**
             * Remove specified count of items from specified start position, and insert variable number of items at the position.
             *
             * @method spliceAll
             * @param offset Optional. Default 0.
             * @param count Optional. Default the current length of list.
             * @param items... Variable. The items gonna be inserted.
             * @return droped items.
             */
            spliceAll: function(offset, count, items) {
                // follow Array.prototype.splice
                if (offset < 0) {
                    offset = this._length + offset;
                }
                if (count < 0) {
                    count = 0;
                }
                if (offset + count > this._length) {
                    if (offset > this._length) {
                        offset = this._length;
                    }
                    count = this._length - offset;
                }
                // do splice by differ
                var removement = this.differ([
                    ["splice", offset, count, items]
                ]);
                return removement.drops[0];
            },
            /**
             * Remove all specified value, including duplicated, in the list.
             *
             * @method remove
             * @param value... The value to be cleared.
             * @return Removed count.
             */
            remove: function() {
                return this.removeAll(slice.call(arguments));
            },
            /**
             * Remove all specified value, including duplicated, in the list.
             *
             * @method remove
             * @param value... The value to be cleared.
             * @return Removed count.
             */
            removeAll: function(values) {
                if (!values) {
                    return this.clear().length;
                }
                var count = 0;
                var i, idx, value, diffs = [];
                for (i = 0; i < values.length; i++) {
                    value = values[i];
                    while ((idx = this.indexOf(value, idx + 1)) >= 0) {
                        diffs.push(["splice", idx, 1, []]);
                        count++;
                    }
                }
                diffs.sort(function(a, b) {
                    return b[1] - a[1];
                });
                this.differ(diffs);
                return count;
            },
            /**
             * Remove all items in the list.
             *
             * @method clear
             * @return Removed items.
             */
            clear: function() {
                var differ = this.differ([
                    ["splice", 0, this._length, []]
                ]);
                return differ.drops[0];
            },
            /**
             * Set the existence of a value in the list.
             *
             * @method toggle
             * @param value The value whose existence attempt to be toggled.
             * @param existence (Optional) Default hasnot(value).
             */
            toggle: function(value, existence) {
                if (arguments.length > 1) {
                    if (!existence) {
                        this.remove(value);
                    } else if (this.indexOf(value) < 0) {
                        this.push(value);
                    }
                    return existence;
                } else {
                    if (this.indexOf(value) >= 0) {
                        this.remove(value);
                        return false;
                    } else {
                        this.push(value);
                        return true;
                    }
                }
            },
            /**
             * Set the index of an item, splice if not exist yet.
             *
             * @method setIndex
             * @param item The value about to move
             * @param index (Optional) Default hasnot(value).
             * @return The final index
             */
            setIndex: function(item, index) {
                var indexFrom = this.indexOf(item);
                if (indexFrom === -1) {
                    var differ = this.differ([
                        ["splice", index, 0, [item]]
                    ]);
                    return differ.diffs[0][1];
                } else {
                    return indexFrom + this.move(indexFrom, 1, index - indexFrom);
                }
            },
            /**
             * Set the existence of a value in the list.
             *
             * @method setIndexAt
             * @param value The value whose existence attempt to be toggled.
             * @param existence (Optional) Default hasnot(value).
             */
            setIndexAt: function(from, index) {
                var len = this._length;
                // check from
                from < 0 && (from = len + from);
                if (from < 0 || from >= len) {
                    // bad from moves nothing
                    return 0;
                }
                return from + this.move(from, 1, index - from);
            },
            /**
             * Specify an area of items and move it backward/forward.
             *
             * @method setIndexAt
             * @param offset The lower-bound of the area
             * @param count The size of the area
             * @param delta The delta of the moving
             * @return The delta actually moved
             */
            move: function(offset, count, delta) {
                var movement, len = this._length;
                // check offset
                offset < 0 && (offset = len + offset);
                if (offset < 0 || offset >= len) {
                    // bad offset moves nothing
                    return 0;
                }
                // check count
                if (offset + count > len) {
                    count = len - offset;
                } else if (count < 0) {
                    if (offset + count < 0) {
                        count = offset;
                        offset = 0;
                    } else {
                        count = -count;
                        offset = offset - count;
                    }
                }
                if (count <= 0) {
                    // bad count moves nothing
                    return 0;
                }
                // check delta
                if (offset + count + delta > len) {
                    delta = len - offset - count;
                } else if (offset + delta < 0) {
                    delta = -offset;
                }
                if (delta === 0) {
                    // bad count moves nothing
                    return 0;
                }
                movement = delta;
                if (delta < 0) {
                    // swap count and delta
                    count = delta - count;
                    delta = delta - count;
                    count = delta + count;
                    // fix count and offset
                    count = -count;
                    offset -= count;
                }
                // apply the differ of move
                this.differ([
                    ["move", offset, count, delta]
                ]);
                return movement;
            },
            /**
             * Apply an array of differences to the list, getting the droped items.
             *
             * @method differ
             * @param diffs The differences
             * @return droped items.
             */
            differ: function(diffs) {
                var length = this._length;
                var evt = this._differ(diffs);
                if (evt && evt.diffs.length) {
                    this.fire("diff", evt);
                    if (length !== this._data._length) {
                        this._length = this._data.length;
                        this.notify("length");
                    }
                }
                return evt;
            },
            _differ: function(diffs) {
                var drops = [];
                var joins = [];
                nx.each(diffs, function(diff) {
                    switch (diff[0]) {
                        case "splice":
                            drops.push(nx.func.apply(splice, this._data, diff[1], diff[2], diff[3]));
                            joins.push(diff[3]);
                            break;
                        case "move":
                            // ["move", offset, count, delta]
                            nx.func.apply(splice, this._data, diff[1] + diff[3], 0,
                                this._data.splice(diff[1], diff[2]));
                            drops.push([]);
                            joins.push([]);
                    }
                }, this);
                return {
                    diffs: diffs || [],
                    drops: drops,
                    joins: joins
                };
            },
            _counting_register: function() {
                this._counting_num++;
                var map = this._counting_map;
                if (this._counting_num > 0) {
                    if (!this._counting_res) {
                        // refresh counting map
                        map.clear();
                        nx.each(this._data, function(value) {
                            map.increase(value);
                        });
                        // add monitor of counting
                        this._counting_res = this.on("diff", function(sender, evt) {
                            var mapdelta = new nx.Counter();
                            var i, diff, drop, join;
                            var diffs, drops, joins;
                            diffs = evt.diffs, drops = evt.drops, joins = evt.joins;
                            for (i = 0; i < diffs.length; i++) {
                                diff = diffs[i], drop = drops[i], join = joins[i];
                                // consider removement and addition has no cross item
                                nx.each(drop, function(value) {
                                    mapdelta.decrease(value);
                                });
                                nx.each(join, function(value) {
                                    mapdelta.increase(value);
                                });
                            }
                            // apply delta map
                            var change = [];
                            mapdelta.each(function(delta, value) {
                                if (delta > 0 || delta < 0) {
                                    map.increase(value, delta);
                                    change.push({
                                        value: value,
                                        count: map.get(value)
                                    });
                                }
                            });
                            // fire event
                            this.fire("counting", change);
                        }, this);
                    }
                }
                return {
                    release: function() {
                        // FIXME logical fault on multiple release
                        this._counting_num--;
                        if (this._counting_num <= 0) {
                            if (this._counting_res) {
                                this._counting_res.release();
                                this._counting_res = null;
                            }
                        }
                    }.bind(this)
                };
            },
            /**
             * Supplies a whole life-cycle of a monitoring on a list.
             *
             * @method monitorDiff
             * @param handler lambda(diff) handling diff events.
             * @return releaser A Object with release method.
             */
            monitorDiff: function(handler, context) {
                var self = this;
                var data = this._data.slice();
                if (data.length) {
                    handler.call(context, {
                        diffs: Array(["splice", 0, 0, data]),
                        drops: Array([]),
                        joins: [data]
                    });
                }
                var resource = this.on("diff", function(sender, evt) {
                    handler.call(context, evt);
                });
                return {
                    release: function() {
                        if (resource) {
                            var data = self._data.slice();
                            if (data.length) {
                                handler.call(context, {
                                    diffs: Array(["splice", 0, data.length, []]),
                                    drops: [data],
                                    joins: Array([])
                                });
                            }
                            resource.release();
                        }
                    }
                };
            },
            /**
             * Apply a diff watcher, which handles each item in the list, to the list.
             *
             * @method monitorContaining
             * @param handler lambda(item) returning a release method
             * @return releaser A Object with release method.
             */
            monitorContaining: function(handler, context) {
                var counter = this._counting_map;
                var resources = new nx.Map();
                var retain = function(value, resource) {
                    // accept release function or direct resource as releaser
                    if (typeof resource === "function") {
                        resource = {
                            release: resource
                        };
                    }
                    // remember the releaser
                    if (resource && typeof resource.release === "function") {
                        resources.set(value, resource);
                    }
                };
                // increase counting listener
                var res_counting = this._counting_register();
                // watch the further change of the list
                var listener = this.on("counting", function(sender, change) {
                    nx.each(change, function(item) {
                        var release, resource = resources.get(item.value);
                        if (resource) {
                            if (item.count <= 0) {
                                resource.release();
                                resources.remove(item.value);
                            }
                        } else {
                            if (item.count > 0) {
                                release = handler.call(context, item.value);
                                retain(item.value, release);
                            }
                        }
                    });
                }, this);
                // and don't forget the existing items in the list
                nx.each(this._data, function(item) {
                    var resource = handler.call(context, item);
                    retain(item, resource);
                }, this);
                // return unwatcher
                return {
                    release: function() {
                        if (listener) {
                            // clear resources
                            resources.each(function(resource, value) {
                                resource.release();
                            });
                            resources.clear();
                            // clear listener
                            listener.release();
                            listener = null;
                        }
                        if (res_counting) {
                            res_counting.release();
                            res_counting = null;
                        }
                    }
                };
            },
            /**
             * Apply a diff watcher, which handles each item in the list, to the list.
             *
             * @method monitorCounting
             * @param handler lambda(item) returning a release method
             * @return releaser A Object with release method.
             */
            monitorCounting: function(handler, context) {
                var counter = this._counting_map;
                var resources = new nx.Map();
                // increase counting listener
                var res_counting = this._counting_register();
                // watch the further change of the list
                var listener = this.on("counting", function(sender, change) {
                    nx.each(change, function(item) {
                        var resource = resources.get(item.value);
                        if (resource) {
                            resource(item.count);
                            if (item.count <= 0) {
                                resources.remove(item.value);
                            }
                        } else if (item.count > 0) {
                            resource = handler.call(context, item.value, item.count);
                            if (resource) {
                                resources.set(item.value, resource);
                            }
                        }
                    });
                }, this);
                // and don't forget the existing items in the list
                nx.each(counter, function(count, value) {
                    var resource = handler.call(context, value, count);
                    if (resource) {
                        resources.set(value, resource);
                    }
                }, this);
                // return unwatcher
                return {
                    release: function() {
                        if (listener) {
                            // clear resources
                            resources.each(function(resource, value) {
                                resource(0);
                            });
                            resources.clear();
                            // clear listener
                            listener.release();
                            listener = null;
                        }
                        if (res_counting) {
                            res_counting.release();
                            res_counting = null;
                        }
                    }
                };
            }
        },
        statics: {
            /**
             * This util returns a monitor function of ObservableList, which is used to synchronize item existance between 2 lists.
             *
             * @method getListSyncMonitor
             * @param list The target list to be synchronized.
             * @param sync
             *  <ul>
             *  <li>If true, make sure target list will have all items as source list has;</li>
             *  <li>If false, make sure target list will not have any item as source list has.</li>
             *  </ul>
             *  Default true.
             * @return {function&lt;item&gt;}
             *  The monitor function.
             */
            getListSyncMonitor: function(coll, sync) {
                if (sync !== false) {
                    return function(item) {
                        coll.push(item);
                        return function() {
                            coll.remove(item);
                        };
                    };
                } else {
                    return function(item) {
                        coll.remove(item);
                        return function() {
                            coll.push(item);
                        };
                    };
                }
            },
            /**
             * Build a tree of expresson syntax with the expression tokens.
             * e.g. tokens ["A", "|", "B", "&", "(", "C", "&", "D", ")"], which was separated from expression "A | B & (C | D)",
             * will be separated into [|, A, [&, B, [|, C, D]]], because '&' has higher priority than '|',
             * and braced "C | D" has higher priority than &. <br/>
             * <br/>
             * Similar to the priorities in JavaScript:<br/>
             * <table>
             * <tr><th>operator</th><th>functionality</th></tr>
             * <tr><td>()</td><td>braces</td></tr>
             * <tr><td>-</td><td>complement</td></tr>
             * <tr><td>&</td><td>cross</td></tr>
             * <tr><td>^</td><td>symmetric difference</td></tr>
             * <tr><td>|</td><td>union</td></tr>
             * <tr><td>&&</td><td>and (the first empty list or the last list)</td></tr>
             * <tr><td>||</td><td>or (the first non-empty list)</td></tr>
             * </table>
             *
             * @method buildExpressionTree
             * @param {Array of token} tokens
             * @return {Array tree} Parsed syntax tree of the expression tokens.
             * @static
             */
            buildExpressionTree: (function() {
                var PRIORITIES = [
                    ["-"],
                    ["&"],
                    ["^"],
                    ["|"],
                    ["&&"],
                    ["||"]
                ];
                var getPriority = function(opr) {
                    for (var i = 0; i < PRIORITIES.length; i++) {
                        if (PRIORITIES[i].indexOf(opr) >= 0) {
                            return i;
                        }
                    }
                };
                var buildExpressionNode = function(opr, opn1, opn2) {
                    if (Object.prototype.toString.call(opn1) === "[object Array]" && opn1[0] === opr) {
                        opn1.push(opn2);
                        return opn1;
                    }
                    return [opr, opn1, opn2];
                };
                return function(tokens) {
                    if (typeof tokens === "string") {
                        tokens = tokens.match(REGEXP_TOKENS);
                    }
                    tokens = tokens.concat([")"]);
                    var token, opr, oprstack = [];
                    var opn, opnstack = [];
                    var operands = [];
                    while (tokens.length) {
                        token = tokens.shift();
                        if (token === ")") {
                            while ((opr = oprstack.pop())) {
                                if (opr === "(") {
                                    break;
                                }
                                opn = opnstack.pop();
                                opnstack.push(buildExpressionNode(opr, opnstack.pop(), opn));
                            }
                        } else if (token === "(") {
                            oprstack.push(token);
                        } else if (token.match(REGEXP_OPN)) {
                            opnstack.push(token);
                            if (operands.indexOf(token) == -1) {
                                operands.push(token);
                            }
                        } else if (token.match(REGEXP_OPR)) {
                            while (oprstack.length) {
                                opr = oprstack.pop();
                                if (opr === "(" || getPriority(opr) > getPriority(token)) {
                                    oprstack.push(opr);
                                    break;
                                }
                                opn = opnstack.pop();
                                opnstack.push(buildExpressionNode(opr, opnstack.pop(), opn));
                            }
                            oprstack.push(token);
                        }
                    }
                    if (opnstack[0]) {
                        opnstack[0].operands = operands;
                    }
                    return opnstack[0];
                };
            })(),
            /**
             * Apply a inter-list releation to a list.
             * Supported operators:<br/>
             * <table>
             * <tr><th>Operator</th><th>Calculation</th><th>Method</th></tr>
             * <tr><td>&amp;</td><td>Sets cross</td><td>cross</td></tr>
             * <tr><td>|</td><td>Sets union</td><td>union</td></tr>
             * <tr><td>^</td><td>Sets symmetric difference</td><td>delta</td></tr>
             * <tr><td>-</td><td>Sets complement</td><td>complement</td></tr>
             * <tr><td>&amp;&amp;</td><td>Sets logical and</td><td>and</td></tr>
             * <tr><td>||</td><td>Sets logical or</td><td>or</td></tr>
             * </table>
             * Tips:
             * <ul>
             * <li>Logical and means 'first empty list or last list'</li>
             * <li>Logical or means 'first non-empty list or last list'</li>
             * </ul>
             *
             * @method calculate
             * @param target {nx.List} The target list.
             * @param expression {String} The relation expression.
             * @param map {nx.Map} The relation expression.
             * @return An object with release method.
             */
            calculate: function(expression, map) {
                // TODO more validation on the expression
                if (!expression.match(REGEXP_CHECK)) {
                    throw new Error("Bad expression.");
                }
                // initialize map with normal object
                if (!nx.is(map, nx.Map)) {
                    map = new nx.Map(map);
                }
                var tokens = expression.match(REGEXP_TOKENS);
                var requirements = tokens.filter(RegExp.prototype.test.bind(REGEXP_OPN));
                var tree = EXPORT.buildExpressionTree(tokens);
                // sync with the list existence
                var target = new nx.List();
                var reqmgr = {
                    count: 0,
                    map: {},
                    sync: function() {
                        if (reqmgr.count === requirements.length) {
                            var coll;
                            if (typeof tree === "string") {
                                // need not to calculate
                                coll = map.get(tree);
                            } else {
                                target.retain(coll);
                                coll = EXPORT.calculateTree(tree, map);
                            }
                            target.retain(coll.monitorContaining(EXPORT.getListSyncMonitor(target)));
                        }
                    },
                    monitor: function(key, value) {
                        if (requirements.indexOf(key) >= 0) {
                            reqmgr.count += ((!reqmgr.map[key]) * 1 + (!!value) * 1 - 1);
                            reqmgr.map[key] = value;
                            reqmgr.sync();
                        }
                    }
                };
                target.retain(map.monitor(reqmgr.monitor));
                return target;
            },
            calculateTree: function(tree, map) {
                var target, iterate, opr = tree[0];
                // short-circuit for logical operatiors (&& and ||)
                switch (opr) {
                    case "&&":
                        target = new nx.List();
                        iterate = function(idx) {
                            var coll, resource;
                            if (typeof tree[idx] === "string") {
                                coll = map.get(tree[idx]);
                                resource = new nx.Object();
                            } else {
                                resource = coll = EXPORT.calculateTree(tree[idx], map);
                            }
                            if (idx >= tree.length - 1) {
                                resource.retain(coll.monitorContaining(EXPORT.getListSyncMonitor(target)));
                            } else {
                                resource.retain(coll.watch("length", function(n, v) {
                                    if (v) {
                                        return iterate(idx + 1);
                                    }
                                }));
                            }
                            return resource;
                        };
                        target.retain(iterate(1));
                        break;
                    case "||":
                        target = new nx.List();
                        iterate = function(idx) {
                            var coll, resource;
                            if (typeof tree[idx] === "string") {
                                coll = map.get(tree[idx]);
                                resource = new nx.Object();
                            } else {
                                resource = coll = EXPORT.calculateTree(tree[idx], map);
                            }
                            if (idx >= tree.length - 1) {
                                resource.retain(coll.monitorContaining(EXPORT.getListSyncMonitor(target)));
                            } else {
                                resource.retain(coll.watch("length", function(n, v) {
                                    if (!v) {
                                        return iterate(idx + 1);
                                    } else {
                                        return coll.monitorContaining(EXPORT.getListSyncMonitor(target));
                                    }
                                }));
                            }
                            return resource;
                        };
                        target.retain(iterate(1));
                        break;
                    default:
                        target = (function() {
                            var target, calcs = [];
                            var i, coll, colls = [];
                            for (i = 1; i < tree.length; i++) {
                                if (typeof tree[i] === "string") {
                                    coll = map.get(tree[i]);
                                } else {
                                    coll = EXPORT.calculateTree(tree[i], map);
                                    calcs.push(coll);
                                }
                                colls.push(coll);
                            }
                            target = EXPORT[OPERATORNAMES[opr]](colls);
                            nx.each(calcs, function(calc) {
                                target.retain(calc);
                            });
                            return target;
                        })();
                        break;
                }
                return target;
            },
            /**
             * Select a sub-list from a source list.
             * Usage:
             * <pre>
             * // select all items from list with property active==true
             * resource = subList.select(list, "active")
             * // select all items from list with path owner.name=="Knly"
             * resource = subList.select(list, "owner.name", function(name){
             *     return name==="Knly";
             * });
             * // select all string item from list
             * resource = subList.select(list, function(item){
             *     return typeof item === "string";
             * });
             * </pre>
             * 
             * @method select
             * @param {nx.List} source
             * @param {String} conditions (Optional)
             * @param {Function} determinator
             * @return resource for release the binding
             * @static
             */
            select: function(source, conditions, determinator) {
                if (!nx.is(source, EXPORT)) {
                    // TODO select from array
                    return null;
                }
                // FIXME keep the order of items as it was in source
                if (typeof conditions === "function") {
                    determinator = conditions;
                    conditions = null;
                }
                if (!determinator) {
                    determinator = nx.identity;
                }
                var target = new EXPORT();
                target.retain(source.monitorContaining(function(item) {
                    var resource;
                    if (conditions) {
                        if (nx.is(item, nx.Object)) {
                            // monitor the specified conditions
                            resource = nx.Object.cascade(item, conditions, function() {
                                target.toggle(item, determinator.apply(target, arguments));
                            });
                        } else {
                            // determine the specified conditions if unable to monitor
                            target.toggle(item, determinator.call(target, nx.path(item, conditions)));
                        }
                    } else {
                        // no condition specified means determine item itself
                        target.toggle(item, determinator.call(target, item));
                    }
                    return function() {
                        resource && resource.release();
                        target.toggle(item, false);
                    };
                }));
                return target;
            },
            /**
             * Summarize all values of a list and return to a callback function.
             *
             * @method summarize
             * @param {nx.List} source
             * @param {Function} callback
             * @return resource for release the binding
             * @static
             */
            summarize: function(source, callback) {
                sum = 0;
                return source.monitorDiff(function(evt) {
                    nx.each(evt.diffs, function(diff, idx) {
                        var vdrop = evt.drops[idx];
                        var vjoin = evt.joins[idx];
                        var delta = nx.math.plus.apply(this, vjoin) - nx.math.plus.apply(this, vdrop);
                        if (delta) {
                            sum = sum + delta;
                        }
                    });
                    callback(sum);
                });
            },
            sorting: function(list, comparator) {
                // TODO
            },
            /**
             * Affect target to be the cross list of sources lists.
             * Release object could stop the dependencies.
             *
             * @method cross
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            cross: function(sources) {
                var target = new nx.List();
                var counter = new nx.Counter();
                if (nx.is(sources, Array)) {
                    sources = new nx.List(sources);
                }
                target.retain(counter.on("increase", function(o, evt) {
                    if (evt.count == sources.length()) {
                        target.push(evt.item);
                    }
                }));
                target.retain(counter.on("decrease", function(o, evt) {
                    if (evt.count == sources.length() - 1) {
                        target.remove(evt.item);
                    }
                }));
                target.retain(sources.monitorContaining(function(source) {
                    return source.monitorContaining(function(item) {
                        counter.increase(item, 1);
                        return function() {
                            counter.decrease(item, 1);
                        };
                    });
                }));
                return target;
            },
            /**
             * Affect target to be the union list of sources lists.
             * Release object could stop the dependencies.
             *
             * @method union
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            union: function(sources) {
                var target = new nx.List();
                var counter = new nx.Counter();
                if (nx.is(sources, Array)) {
                    sources = new nx.List(sources);
                }
                target.retain(counter.on("increase", function(o, evt) {
                    if (evt.count === 1) {
                        target.push(evt.item);
                    }
                }));
                target.retain(counter.on("decrease", function(o, evt) {
                    if (evt.count === 0) {
                        target.remove(evt.item);
                    }
                }));
                target.retain(sources.monitorContaining(function(source) {
                    return source && source.monitorContaining(function(item) {
                        counter.increase(item, 1);
                        return function() {
                            counter.decrease(item, 1);
                        };
                    });
                }));
                return target;
            },
            /**
             * Affect target to be the complement list of sources lists.
             * Release object could stop the dependencies.
             *
             * @method complement
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            complement: function(sources) {
                var target = new nx.List();
                var counter = new nx.Counter();
                var length = sources.length;
                target.retain(counter.on("count", function(o, evt) {
                    var previous = evt.previousCount,
                        count = evt.count;
                    if (previous < length && count >= length) {
                        target.push(evt.item);
                    }
                    if (previous >= length && count < length) {
                        target.remove(evt.item);
                    }
                }));
                target.retain(sources[0].monitorContaining(function(item) {
                    counter.increase(item, length);
                    return function() {
                        counter.decrease(item, length);
                    };
                }));
                nx.each(sources, function(coll, index) {
                    if (index > 0) {
                        target.retain(coll.monitorContaining(function(item) {
                            counter.decrease(item);
                            return function() {
                                counter.increase(item);
                            };
                        }));
                    }
                });
                return target;
            },
            /**
             * Affect target to be the symmetric difference list of sources lists.
             * Release object could stop the dependencies.
             * The name 'delta' is the symbol of this calculation in mathematics.
             * @reference {http://en.wikipedia.org/wiki/Symmetric_difference}
             * @method delta
             * @param target {List}
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            delta: function(sources) {
                var target = new nx.List();
                nx.each(sources, function(coll) {
                    target.retain(coll.monitorContaining(function(item) {
                        target.toggle(item);
                        return function() {
                            if (!target.__released__) {
                                target.toggle(item);
                            }
                        };
                    }));
                });
                return target;
            },
            /**
             * Affect target to be the equivalent list of the first empty list or the last list.
             * Release object could stop the dependencies.
             *
             * @method and
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            and: function(sources) {
                var target = new nx.List();
                var iterate = function(idx) {
                    var watcher, resource, coll = sources[idx];
                    if (idx === sources.length - 1) {
                        return coll.monitorContaining(function(item) {
                            target.push(item);
                            return function() {
                                if (!target.__released__) {
                                    target.remove(item);
                                }
                            };
                        });
                    }
                    return coll.watch("length", function(n, v) {
                        if (v) {
                            return iterate(idx + 1);
                        }
                    });
                };
                target.retain(iterate(0));
                return target;
            },
            /**
             * Affect target to be the equivalent list of the first non-empty list.
             * Release object could stop the dependencies.
             *
             * @method or
             * @param sources {Array of List}
             * @return an object with release method
             * @static
             */
            or: function(sources) {
                var target = new nx.List();
                var iterate = function(index) {
                    var coll = sources[index];
                    return coll.watch("length", function(name, value) {
                        if (index < sources.length - 1 && !value) {
                            return iterate(index + 1);
                        } else {
                            return coll.monitorContaining(function(item) {
                                target.push(item);
                                return function() {
                                    if (!target.__released__) {
                                        target.remove(item);
                                    }
                                };
                            });
                        }
                    });
                };
                target.retain(iterate(0));
                return target;
            }
        }
    });

})(nx);
