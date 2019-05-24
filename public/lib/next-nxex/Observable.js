(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Observable
     * @namespace nxex
     */
    var EXPORT = nx.define("nxex.Observable", nx.Observable, {
        properties: {
            global: {
                value: global
            },
            resourceManager: {
                value: function () {
                    return new nxex.ResourceManager();
                }
            }
        },
        methods: {
            init: function (options) {
                this.inherited();
                this.sets(options);
                annotation.apply(this, "watcher,cascade");
            },
            dispose: function () {
                this.resourceManager().release();
            }
        },
        statics: {
            propertyOfCollection: function () {
                return {
                    value: function () {
                        return new nx.data.ObservableCollection();
                    }
                };
            },
            propertyOfCollectionCalculation: function (name, calculation) {
                var sources = nx.data.ObservableCollection.buildExpressionTree(calculation).operands;
                var paths = ["resourceManager"].concat(sources);
                return {
                    value: function () {
                        return new nx.data.ObservableCollection();
                    },
                    cascade: {
                        source: paths,
                        update: function (resm) {
                            if (!resm) {
                                return;
                            }
                            var coll = this.get(name);
                            var map = {};
                            var args = arguments;
                            nx.each(sources, function (source, i) {
                                map[source] = args[i + 1];
                            });
                            // replace the resource
                            resm.replace(name + "_resource_propertyOfCollectionCalculation", function () {
                                return coll.calculate(calculation, map);
                            });
                        }
                    }
                };
            },
            propertyOfCollectionSelect: function (name, target, key, condition) {
                return {
                    value: function () {
                        return new nx.data.ObservableCollection();
                    },
                    cascade: {
                        source: ["resourceManager", target],
                        update: function (resm, target) {
                            if (!resm) {
                                return;
                            }
                            var coll = this.get(name);
                            // replace the resource
                            resm.replace(name + "_resource_propertyOfCollectionSelect", function () {
                                return coll.select(target, key, condition);
                            });
                        }
                    }
                };
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
