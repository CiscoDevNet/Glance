var BindingExample = nx.define(nxex.struct.Element, {
    struct: {
        properties: {
            "some-attr": binding("someAttrValue")
            class: ["static-css-class", binding("dynamicCssClass")],
            style: {
                display: binding("styleDisplay")
            }
        },
        content: binding("text")
    },
    properties: {
        someAttrValue: "lalala",
        dynamicCssClass: "dynamic-css-class",
        styleDisplay: "block",
        text: "Hello"
    }
});
