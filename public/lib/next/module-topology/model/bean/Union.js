(function (nx, global) {

    /**
     * A union which contains entities, and supplies collapsing&expanding.
     *
     * @class Union
     * @extends nx.topology.model.Entity
     * @namespace nx.topology.model
     */

    nx.define('nx.topology.model.Union', nx.topology.model.Entity, {
        properties: {
            /**
             * Collapse status of the node set.
             * @type Boolean
             * @property collapse
             */
            collapse: false,
            /**
             * A node set can have a root vertex and collapse to it.
             *
             * @type nx.topology.model.Vertex
             * @property vertexRoot
             */
            vertexRoot: null,
            /**
             * Directly contained entities of current union.
             *
             * @type nx.List
             * @property entities
             */
            entities: {
                value: function () {
                    return new nx.topology.common.FilterUniqueList();
                }
            },
            /**
             * All non-set vertex in the union, including entities in sub-union.
             *
             * @type nx.topology.common.FilterUniqueList
             * @property vertices
             * @readOnly
             */
            vertices: {
                value: function () {
                    return new nx.topology.common.FilterUniqueList();
                }
            },
            /**
             * All visible entities inside when the vertex is expanded.
             *
             * @type nx.topology.common.FilterUniqueList
             * @property entitiesVisible
             * @readOnly
             */
            entitiesVisible: {
                value: function () {
                    return new nx.topology.common.FilterUniqueList();
                }
            },
            /**
             * All edges launched from this union.
             *
             * @type nx.topology.model.edges
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
