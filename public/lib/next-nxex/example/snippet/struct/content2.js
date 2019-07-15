var ContentExampleBase = nx.define(nxex.struct.Element, {
    struct: {
        content: "1"
    }
});

var ContentExampleChild = nx.define(ContentExampleBase, {
    struct: {
        content: ["2", {
            content: "3"
        }]
    }
});

/*
result:
<div>12<div>3</div></div>
*/
