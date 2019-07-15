/// require util
/// require bean

(function (nx, global) {

    var Util = nx.path(global, "nx.topology.common.Util");

    /**
     * Basic graph class, supporting vertex/edge model.
     *
     * @class TopologyModel
     * @namespace nx.topology.model
     * @constructor
     * @param data Initialize data of graph.
     */
    var EXPORT = nx.define('nx.topology.model.TopologyModel', nx.topology.model.CollapsibleGraph, {
        methods: {
            init: function (config) {
		// TODO vertify mappings
                this.inherited(config.data);
                // initialize entities and edges
                if (config && config.mapping) {
		    // TODO initialize mapping
                }
                if (config && config.list) {
                    nx.each(config.list, function (value, key) {
                        this.statusDefinitionMap().set(key, value);
                    }, this);
                }
            }
        }
    });

}(nx, nx.global));
