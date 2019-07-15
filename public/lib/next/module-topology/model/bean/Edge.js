(function (nx, global) {

    /**
     * Data wrapper class of edge.
     * @class Edge
     * @extends nx.topology.model.GraphEntity
     * @namespace nx.topology.model
     */

    nx.define('nx.topology.model.Edge', {
        properties: {
            /**
             * Data of graph edge.
             *
             * @type Object
             * @property originalData
             */
            originalData: null,
            /**
             * Identity of the edge
             * @type Number
             * @property id
             */
            id: null,
            /**
             * Source of the edge
             * @type nx.topology.model.Vertex
             * @property source
             */
            source: null,
            /**
             * Target of the edge
             * @type nx.topology.model.Vertex
             * @property target
             */
            target: null
        }
    });

}(nx, nx.global));
