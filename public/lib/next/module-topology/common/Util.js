(function (nx, global) {

    /**
     * Supplies some util functions for Graph.
     *
     * @class Util
     * @namespace nx.topology.common
     * @static
     */
    var EXPORT = nx.define('nx.topology.common.Util', {
        statics: {
            /**
             * Create filter function to test if the item is already in the given map.
             *
             * @method getIdFilter
             * @param map The map to check ID conflict.
             * @return {function&lt;value&gt;}
             *  The filter function.
             */
            getIdFilter: function (map) {
                return function (value) {
                    var id = nx.path(value, "id");
                    var exist = map.get(id);
                    return !exist || exist === value;
                };
            },
            /**
             * Create filter function which will test value's type.
             *
             * @method getTypeFilter
             * @param type The expected type of value.
             * @return {function&lt;value&gt;}
             *  The filter function.
             */
            getTypeFilter: function (type) {
                return function (value) {
                    return nx.is(value, type);
                };
            },
            /**
             * This util method in order to resolve this problem:<br/>
             * Consider we attempt have a target X, with property P.
             * <ul>
             * <li>
             * When X.P is false or null or undefined etc.,
             * <ul><li>It's necessary to monitor a list with monitor MF;</li></ul>
             * </li>
             * <li>
             * When X.P is true,
             * <ul><li>It's necessary to monitor a list with monitor MT;</li></ul>
             * </li>
             * </ul>
             * So let's resolve this problem with syntax:<br/>
             * <pre>
             * monitorOnCondition(list, {
             *     target: X
             *     property: P,
             *     monitorByTrue: MT,
             *     monitorByFalse: MF
             * });
             * </pre>
             *
             * @method monitorOnCondition
             * @param list The list to be monitored.
             * @param condition
             * @return nx.topology.common.Edge
             */
            monitorOnCondition: function (list, cond) {
                if (!cond.target || !cond.property || !cond.monitorByTrue && !cond.monitorByFalse) {
                    return;
                }
                return cond.target.watch(cond.property, function (pn, pv) {
                    var w = pv ? cond.monitorByTrue : cond.monitorByFalse;
                    return w && list.monitorContaining(w);
                });
            },
            /**
             * This util returns a monitor function of List, which is used to synchronize item existance between 2 lists.
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
            getListSyncMonitor: function (list, sync) {
                if (sync !== false) {
                    return function (item) {
                        list.push(item);
                        return function () {
                            list.remove(item);
                        };
                    };
                } else {
                    return function (item) {
                        list.remove(item);
                        return function () {
                            list.push(item);
                        };
                    };
                }
            },
            /**
             * This util returns a monitor function of List, which is used to synchronize a map of item and its id with a list.
             *
             * @method getIdMappingMonitor
             * @param map The target map
             * @return {function&lt;item&gt;}
             *  The monitor function.
             */
            getIdMappingMonitor: function (map) {
                return function (item) {
                    map.set(item.id(), item);
                    return function () {
                        map.remove(item.id());
                    };
                };
            },
            /**
             * This util get a value-array in a map with an id-array.
             *
             * @method getValuesByIds
             * @param map The target map
             * @param ids The id array
             * @return {Array}
             *  The values.
             */
            getValuesByIds: function (map, ids) {
                var value, values = [];
                var i, id, len = ids ? ids.length : 0;
                for (i = 0; i < len; i++) {
                    id = ids[i];
                    value = map.get(id);
                    if (value) {
                        values.push(value);
                    } else {
                        return null;
                    }
                }
                return values;
            },
            createMapping: function (inList, inOptions) {
                var sourcePaths = inOptions.sources,
                    targetPaths = inOptions.targets;
                //support ',' separator:
                sourcePaths = typeof sourcePaths === 'string' ? sourcePaths.split(',') : sourcePaths;
                targetPaths = typeof targetPaths === 'string' ? targetPaths.split(',') : targetPaths;
                var unchanged = function (inValue) {
                    return [inValue];
                };
                //monitor release
                return inList.monitorContaining(function (item) {
                    var srcValues = sourcePaths.map(function (path) {
                        return nx.path(item.originalData(), path.trim());
                    });
                    if (inOptions.input) {
                        var tarValues = inOptions.input.apply(item, srcValues);
                        nx.each(targetPaths, function (path, index) {
                            nx.path(item, path.trim(), tarValues[index]);
                        });
                    }
                    if (inOptions.output) {
                        var resource = nx.Object.cascade(item, targetPaths, function () {
                            srcValues = inOptions.output.apply(item, arguments);
                            //console.log(srcValues);
                            nx.each(sourcePaths, function (path, index) {
                                nx.path(item.originalData(), path.trim(), srcValues[index]);
                            });
                        });
                    }
                    return function () {
                        resource && resource.release();
                    };
                });
            },
            buildDirectMappings: function () {
                var mappings = [];
                var unchanged = function (inValue) {
                    return [inValue];
                };
                nx.each(arguments, function (arg) {
                    mappings.push({
                        sources: arg,
                        targets: arg,
                        input: unchanged,
                        output: unchanged
                    });
                });
                return mappings;
            },
            buildDirectMapping: function () {
                var unchanged = function (inValue) {
                    return [inValue];
                };
                return {
                    sources: arguments[0],
                    targets: arguments[1],
                    input: unchanged,
                    output: unchanged
                };
            }
        }
    });

}(nx, nx.global));
