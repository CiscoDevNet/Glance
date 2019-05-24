(function (nx, global) {

    /**
     * List of edge.
     * @class Connection
     * @extends nx.topology.model.Edge
     * @namespace nx.topology.model
     */

    nx.define('nx.topology.model.Connection', nx.topology.model.Edge, {
        properties: {
            /**
             * List of edge
             * @type nx.List
             * @property edges
             */
            edges: {
                value: function () {
                    return new nx.topology.common.FilterUniqueList();
                }
            }
        }
    });

}(nx, nx.global));
