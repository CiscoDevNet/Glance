var BindingAdvanceExample = nx.define(nxex.struct.Element, {
    struct: {
        properties: {
            style: {
                display: binding("visible", function (value) {
                    return value ? "block" : "none";
                })
            }
        }
    },
    properties: {
        visible: true
    }
});
