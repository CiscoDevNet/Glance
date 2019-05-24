module("list-formula");

test("Expression syntax", function () {
    var err;
    var a = new nx.List();
    var b = new nx.List();
    var c = new nx.List();
    var d = new nx.List();
    var target;
    try {
        target = nx.List.calculate("a && c + b", {
            a: a,
            b: b,
            c: c,
            d: d
        });
    } catch (e) {
        err = e;
    }
    ok(err, "Unsupported operation of collection causes error.");
    // TODO more syntax check
});

test("Expression priority", function () {
    var expression = "A && B || C && DA ^ DB | DC & ( DC1 & DC2 & DC3)";
    var tree = nx.List.buildExpressionTree(expression.match(/&&|\|\||&|\||\^|-|\(|\)|\w+/g));
    deepEqual(tree, ["||", ["&&", "A", "B"],
        ["&&", "C", ["|", ["^", "DA", "DB"],
            ["&", "DC", ["&", "DC1", "DC2", "DC3"]]
        ]]
    ]);
});

test("Expression calculation", function () {
    var a = new nx.List();
    var b = new nx.List([100]);
    var c = new nx.List([1, 2, 3]);
    var d = new nx.List([2, 3, 4]);
    var e = new nx.List([3, 4, 5, 6]);
    var f = new nx.List([3, 4, 6, 7, 8, 9]);
    var g = new nx.List([7, 8, 10]);
    var target = nx.List.calculate("a || b && c | d ^ e & f - g", {
        a: a,
        b: b,
        c: c,
        d: d,
        e: e,
        f: f,
        g: g
    });
    equalSet(target.data(), [1, 2, 3, 6], "Expression initialize correct.");
    g.push(6);
    equalSet(target.data(), [1, 2, 3], "Expression cascade correct.");
});
