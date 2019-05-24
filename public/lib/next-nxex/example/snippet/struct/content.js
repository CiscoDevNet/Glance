var ContentExample = nx.define(nxex.common.Dialog, {
    struct: {
        // content as array
        content: [{
            // content as HTML string 
            content: "A&nbsp;B" // parse as HTML: get "A B" on the page
        }, {
            // content as HTML string
            content: '<div style="width:10px;height:10px;background:red;"></div>' // parse as HTML
        }, {
            // content as object
            content: {
                type: "SomeClass"
            }
        }]
    }
});
