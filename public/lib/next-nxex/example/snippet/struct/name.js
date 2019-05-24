var NameExample = nx.define(nxex.struct.Element, {
    struct: {
        content: [{
            name: "partHeader"
        }, {
            content: [{
                name: "partBodyLeft"
            }, {
                name: "partBodyContent"
            }]
        }, {
            name: "partFooter"
        }]
    },
    methods: {
        init: function () {
            this.inherited();
            this.partFooter(); // vs. this.view("partFooter")
        }
    }
});
