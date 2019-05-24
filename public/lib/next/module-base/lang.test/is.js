test("nx.is", function () {
    var count = 0;
    testfunc = function () {
        count += 1
    }
    var func = {};
    func.__is__ = testfunc;
    nx.is(func, "String")
    equal(1, count, "object with is func")
});

test("nx.is", function () {
    var target = {};
    result = nx.is(target, "Object");
    ok(result, "check object");
    result = nx.is(target, Object);
    ok(result, "check object type");
    target = "";
    result = nx.is(target, "String");
    ok(result, "check string");
    result = nx.is(target, String);
    ok(result, "check string type");
    target = [];
    result = nx.is(target, "Array");
    ok(result, "check array");
    result = nx.is(target, Array);
    ok(result, "check array type");
    target = null;
    result = nx.is(target, "Null");
    ok(result, "check null");
    result = nx.is(target, null);
    ok(result, "check null value");
    target = undefined;
    result = nx.is(target, "Undefined");
    ok(result, "check Undefined");
    result = nx.is(target, undefined);
    ok(result, "check undefined value");
    target = 1;
    result = nx.is(target, "Number");
    ok(result, "check Number");
    result = nx.is(target, Number);
    ok(result, "check Number type");
    target = true;
    result = nx.is(target, "Boolean");
    ok(result, "check Boolean");
    result = nx.is(target, Boolean);
    ok(result, "check Boolean type");
    target = function () {
        console.log("1")
    };
    result = nx.is(target, "Function");
    ok(result, "check Function");

    target = document.createElement("div");
    result = nx.is(target, HTMLElement);
    ok(result, "other object");
    ok(!nx.is("", HTMLElement), "other object");
});

test("nx.is on mixin", function () {
    var C0 = nx.define({});
    var C1 = nx.define(C0, {});
    var C2 = nx.define({
        mixins: [C1]
    });
    var C3 = nx.define(C2, {});
    var target = new C3;
    ok(nx.is(target, C2), "success to parent class");
    ok(nx.is(target, C0), "success to mixin parent class");
});
