var EventExample = nx.define(nxex.struct.Element, {
    struct: {
        content: {
            name: "child",
            events: {
                dblclick: "__child_ondblclick",
                click: function (sender, evt) {
                    console.log(this.child().get("value"));
                }
            }
        },
        events: {
            click: "__onclick",
            dblclick: function (sender, evt) {
                console.log(this.get("value"));
            }
        }
    },
    methods: {
        __onclick: function (sender, evt) {
            console.log(this.get("value"));
        },
        __child_ondblclick: function (sender, evt) {
            console.log(this.child().get("value"));
        }
    }
});
