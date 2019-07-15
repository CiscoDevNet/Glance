function TestCollapsibleGraphCollapseRemoveUnion(CLASS) {
    test("Collapse/Remove union", function () {
        var graph = new CLASS({
            vertices: vertices,
            edges: edges,
            unions: [{
                id: 5,
                collapse: true,
                entities: [1],
                root: 1
            }]
        });
        var vertex, vertex0, vertex1, vertex2, vertex3, vertex4;
        vertex0 = graph.entitiesMap().get(0);
        vertex1 = graph.entitiesMap().get(1);
        vertex2 = graph.entitiesMap().get(2);
        vertex3 = graph.entitiesMap().get(3);
        vertex4 = graph.entitiesMap().get(4);
        var list, vlist, tlist, union5, union6, exception;
        list = graph.unions();
        vlist = graph.entitiesVisible();
        tlist = graph.entitiesTopLevel();
        union5 = graph.entitiesMap().get(5);
        ok(checkContainment(tlist, [vertex0, vertex2, vertex3, vertex4, union5]), "Initial graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex2, vertex3, vertex4, union5]), "Initial graph visible union correct.");
        ok(checkContainment(union5.entitiesVisible(), vertex1), "Initial union visible union correct.");
        union5.collapse(false);
        ok(checkContainment(tlist, [vertex0, vertex2, vertex3, vertex4, union5]), "On expanding, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5]), "On expanding, graph visible union correct.");
        union5.collapse(true);
        ok(checkContainment(tlist, [vertex0, vertex2, vertex3, vertex4, union5]), "On collapsing, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex2, vertex3, vertex4, union5]), "On collapsing, graph visible union correct.");
        union5.entities().push(vertex3);
        ok(checkContainment(tlist, [vertex0, vertex2, vertex4, union5]), "On adding vertex to collapsed, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex2, vertex4, union5]), "On adding vertex to collapsed, graph visible union correct.");
        ok(checkContainment(union5.entitiesVisible(), [vertex1, vertex3]), "On adding vertex to collapsed, union visible union correct.");
        union5.collapse(false);
        ok(checkContainment(tlist, [vertex0, vertex2, vertex4, union5]), "On expanding after adding, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5]), "On expanding after adding, graph visible union correct.");
        union5.entities().push(vertex4);
        ok(checkContainment(tlist, [vertex0, vertex2, union5]), "On adding vertex to expanded, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5]), "On adding vertex to expanded, graph visible union correct.");
        union5.collapse(true);
        ok(checkContainment(vlist, [vertex0, vertex2, union5]), "On collapsing after adding, graph visible union correct.");
        ok(checkContainment(union5.entitiesVisible(), [vertex1, vertex3, vertex4]), "On collapsing after adding, union visible union correct.");
        union5.entities().remove(vertex3);
        ok(checkContainment(tlist, [vertex0, vertex2, vertex3, union5]), "On removing from collapsed, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex2, vertex3, union5]), "On removing from collapsed, graph visible union correct.");
        ok(checkContainment(union5.entitiesVisible(), [vertex1, vertex4]), "On removing from collapsed, union visible union correct.");
        union5.collapse(false);
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5]), "On expanding after removing, graph visible union correct.");
        union5.collapse(true);
        ok(checkContainment(vlist, [vertex0, vertex2, vertex3, union5]), "On collapsing after removing, graph visible union correct.");
        union5.entities().push(vertex0, vertex3);
        ok(checkContainment(tlist, [vertex2, union5]), "On adding range to collapsed, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex2, union5]), "On adding range to collapsed, graph visible union correct.");
        ok(checkContainment(union5.entitiesVisible(), [vertex0, vertex1, vertex3, vertex4]), "On adding range to collapsed, union visible union correct.");
        union6 = graph.createUnion({
            id: 6,
            entities: [0, 2],
            root: 0
        });
        ok(checkContainment(list, [union5]), "On creating, graph union list correct.");
        ok(checkContainment(vlist, [vertex2, union5]), "On creating, graph visible union correct.");
        ok(checkContainment(union5.entitiesVisible(), [vertex0, vertex1, vertex3, vertex4]), "On creating, old union with same vertex will not be taken.");
        try {
            list.push(union6);
        } catch (e) {
            exception = e;
        }
        ok(exception && !list.contains(union6) && checkContainment(union5.entitiesVisible(), [vertex0, vertex1, vertex3, vertex4]), "On adding union, fail when child vertex conflict.");
        union6.entities().remove(vertex0);
        list.push(union6);
        union6.entities().push(vertex0);
        ok(checkContainment(union5.entitiesVisible(), [vertex1, vertex3, vertex4]), "On adding vertex blongs to other union, source union lost the vertex.");
        ok(checkContainment(union6.entitiesVisible(), [vertex0, vertex2]), "On adding vertex blongs to other union, target union gets the vertex.");
        ok(checkContainment(tlist, [union5, union6]), "On adding union, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex2, union5, union6]), "On adding union, graph visible union correct.");
        union6.entities().push(union5);
        ok(checkContainment(union6.entitiesVisible(), [vertex0, vertex2, union5]), "On adding union to union, union visible union correct.");
        ok(checkContainment(tlist, [union6]), "On adding union to union, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex2, union5, union6]), "On adding union to union, graph visible union correct.");
        union5.collapse(false);
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5, union6]), "On expanding inner union, graph visible union correct.");
        union5.collapse(true);
        ok(checkContainment(vlist, [vertex0, vertex2, union5, union6]), "On collapsing inner union, graph visible union correct.");
        union6.collapse(true);
        ok(checkContainment(vlist, [union6]), "On collapsing outer union, graph visible union correct.");
        union5.collapse(false);
        ok(checkContainment(vlist, [union6]), "On expanding invisible inner union, graph visible union correct.");
        ok(checkContainment(union6.entitiesVisible(), [vertex0, vertex1, vertex2, vertex3, vertex4, union5]), "On expanding invisible inner union, union visible union correct.");
        union6.collapse(false);
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5, union6]), "On expanding outer union after expanding inner union, graph visible union correct.");
        list.remove(union6);
        ok(checkContainment(tlist, [vertex0, vertex2, union5]), "On removing outer union, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5]), "On removing outerunion, graph visible union correct.");
        union6.collapse(true);
        ok(checkContainment(vlist, [vertex0, vertex1, vertex2, vertex3, vertex4, union5]), "On collapsing removed union, graph visible union correct.");
        list.push(union6);
        ok(checkContainment(tlist, [union6]), "On adding union after collapsing outside, graph top-level union correct.");
        ok(checkContainment(vlist, [union6]), "On adding union after collapsing outside, graph visible union correct.");
        list.remove(union5);
        ok(checkContainment(tlist, [vertex1, vertex3, vertex4, union6]), "On removing inner union, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex1, vertex3, vertex4, union6]), "On removing inner union, graph visible union correct.");
        ok(checkContainment(union6.entities(), [vertex0, vertex2]), "On removing inner union, outer union cascaded.");
        list.push(union5);
        ok(checkContainment(tlist, [union5, union6]), "On adding back inner union, graph top-level union correct.");
        ok(checkContainment(vlist, [vertex1, vertex3, vertex4, union5, union6]), "On adding back inner union, graph visible union correct.");
    });
}
