(function (nx, global) {

    /**
     * Data wrapper class of vertex
     * @class Vertex
     * @extends nx.topology.model.Entity
     * @namespace nx.topology.model
     */

    nx.define('nx.topology.model.Vertex', nx.topology.model.Entity, {
        properties: {
            /**
             * All edges launched from this vertex.
             *
             * @type nx.topology.common.FilterUniqueList
             * @property edges
             * @readOnly
             */
            edges: {
                value: function () {
                    return new nx.topology.common.FilterUniqueList();
                }
            }
        }
    });

}(nx, nx.global));
