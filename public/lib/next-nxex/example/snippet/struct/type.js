var TypeExample = nx.define(nxex.struct.Element, {
    struct: {
        content: [{
            type: "nxex.graph.Graph",
            content: {
                // default child type of Graph is Node
            }
        }, {
            // default child type of Element is Element
        }]
    }
});
