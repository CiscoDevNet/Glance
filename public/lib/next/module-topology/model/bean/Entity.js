/// require GraphEntity

(function (nx, global) {

    /**
     * Data wrapper class of entity.
     * @class Vertex
     * @namespace nx.topology.model
     */

    nx.define('nx.topology.model.Entity', {
        properties: {
            /**
             * Data of graph entity.
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
            id: null
        }
    });

}(nx, nx.global));
