var template = nxex.struct.Template.template;
var plusOne = function (n) {
    return n + 1;
};
var BindingAdvanceExample = nx.define(nxex.struct.tag.Table, {
    struct: {
        // default child type of Table is TableRow(<tr>)
        content: template({
            source: "nodes",
            template: {
                // default child type of TableRow is TableCell
                content: [{
                    content: binding("template.index", plusOne)
                }, {
                    content: binding("template.model.key")
                }, {
                    content: binding("template.model.value")
                }]
            }
        })
    },
    properties: {
        nodes: {
            value: function () {
                return new nx.data.ObservableCollection([{
                    key: "a",
                    value: "A"
                }, {
                    key: "b",
                    value: "B"
                }]);
            }
        }
    }
});

/*
result: 
<table>
<tr><td>1</td><td>a</td><td>A</td></tr>
<tr><td>2</td><td>b</td><td>B</td></tr>
</table>
*/
