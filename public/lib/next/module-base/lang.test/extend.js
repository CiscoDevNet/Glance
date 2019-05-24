test("nx.extend", function () {
    var target = {}
    var arg = new Object;
    arg.x = 1;
    arg.y = 2;
    arg.func = function () {
        console.log("test")
    }
    var arg2 = new Object;
    arg2.x = 5;
    arg2.z = 2;
    var arg3 = {
        a: {
            b: 1,
            c: 2
        },
        d: [1, 2, 3]
    }

    var result = nx.extend(target, arg, arg2, arg3)
    equal(5, target.x, "property override")
    deepEqual(target.func, arg.func, "extend function")
    deepEqual(target.d, arg3.d, "array function")
    deepEqual(target.a, arg3.a, "object function")
    target = {}
    result = nx.extend(target, {})
    deepEqual(target, {}, "empty object")
    target = {}
    result = nx.extend(target)
    deepEqual(target, {}, "empty object")
});
