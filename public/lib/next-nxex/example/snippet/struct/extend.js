var ExtendExampleBase = nx.define(nxex.common.Dialog, {
    struct: {
        properties: {
            class: "my-dialog" // class name of my dialog
        },
        extend: {
            body: {
                // parts of my dialog
                content: [{
                    name: "header"
                }, {
                    name: "body",
                    type: "nxex.common.Scroller",
                    extend: {
                        inner: {
                            content: "LOOOOOOOOOOOOOOOOOOOOOOOONG Content..."
                        }
                    }
                }, {
                    name: "footer"
                }]
            }
        }
    },
    statics: {
        CSS: toolkit.css({
            ".my-dialog": {
                // style sheet of my dialog
            },
            ".my-dialog ...": {
                // style sheet of my dialog parts
            }
        })
    }
});

var ExtendExampleChild = nx.define(ExtendExampleBase, {
    struct: {
        extend: {
            header: {
                content: "Hello!"
            },
            body: {
                properties: {
                    axis: "y",
                    style: {
                        height: "400px"
                    }
                },
                extend: {
                    inner: {
                        content: "More LOOOOOOOONG Content..."
                    }
                }
            }
        }
    }
});
