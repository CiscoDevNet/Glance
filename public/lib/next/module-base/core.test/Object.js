module("object");

test("init", function() {
    var o = new nx.Object();
    ok(o, "init");
    equal(o, o.self, "property self");
    equal(nx.global, o.global, "property global");
});
