module("list-basic");

function equalSet(arr1, arr2, message) {
    deepEqual(arr1.sort(), arr2.sort(), message);
}

test("init", function () {
    var lista = new nx.List();
    var listb = new nx.List([1, 2, 3, 4]);
    var listc = new nx.List(listb);
    equal(lista.length(), 0, "init empty list");
    equal(listb.length(), 4, "init list with array");
    equal(listc.length(), 4, "init list with list");
});

test("data", function () {
    expect(2);
    var list = new nx.List([1, 2, 3, 4]);
    deepEqual(list.data(), [1, 2, 3, 4], "correct");
    try {
        list.data([4, 5, 6, 7]);
    } catch (e) {
        ok(true, "exception");
    }
});

test("length", function () {
    expect(2);
    var list = new nx.List([1, 2, 3, 4]);
    equal(list.length(), 4, "correct");
    try {
        list.length(100);
    } catch (e) {
        ok(true, "exception");
    }
});

test("toArray", function () {
    var list = new nx.List(Array([1], [2]));
    var a = list.toArray();
    ok(a.length === 2 && a[0][0] === 1 && a[1][0] === 2, "correct");
    list.push([3]);
    ok(a.length === 2 && a[0][0] === 1 && a[1][0] === 2, "not follow origin list correct");
    list.get(0)[0] = 0;
    ok(a.length === 2 && a[0][0] === 0 && a[1][0] === 2, "value follow origin list correct");
});

test("slice", function () {
    var list = new nx.List(Array([1], [2]));
    var a = list.slice(1, 2);
    ok(a.length() === 1 && a.get(0)[0] === 2, "correct");
    list.push([3]);
    ok(a.length() === 1 && a.get(0)[0] === 2, "not follow origin list correct");
    list.get(1)[0] = 0;
    ok(a.length() === 1 && a.get(0)[0] === 0, "value follow origin list correct");
});

test("get", function () {
    var list = new nx.List([1, 2, 3, 4]);
    equal(list.get(0), 1, "init correct");
});

test("each", function () {
    expect(4);
    var list = new nx.List([1, 2, 3, 4]);
    list.each(function (n, index) {
        equal(n, index + 1, "correct: " + index);
    });
});

test("each by nx", function () {
    expect(4);
    var list = new nx.List([1, 2, 3, 4]);
    nx.each(list, function (n, index) {
        equal(n, index + 1, "correct: " + index);
    });
});

test("contains", function () {
    var list = new nx.List([1, 2, 3, 4]);
    ok(list.contains(1), "init correct: number");
    ok(!list.contains(undefined), "init correct: undefined");
    list.push(undefined);
    ok(list.contains(undefined), "correct after push: undefined");
});

test("indexOf", function () {
    var list = new nx.List([1, 2, 3, 4, 3]);
    equal(list.indexOf(3), 2, "correct");
    equal(list.indexOf(3, 3), 4, "correct since");
    equal(list.indexOf(null), -1, "correct null");
});

test("lastIndexOf", function () {
    var list = new nx.List([1, 2, 3, 4, 3]);
    equal(list.lastIndexOf(3), 4, "correct");
    equal(list.lastIndexOf(3, 3), 2, "correct since");
    equal(list.lastIndexOf(null), -1, "correct null");
});

test("find", function () {
    var list = new nx.List([1, 2, 3, 4, 3]);
    var value;
    value = list.find(function (v) {
        return v > 2;
    });
    equal(value, 3, "correct");
    value = list.find(function (v) {
        return v < 0;
    });
    equal(value, undefined, "not found correct");
});

test("index", function () {
    var list = new nx.List([1, 2, 3, 4, 3]);
    var value;
    value = list.findIndex(function (v) {
        return v > 2;
    });
    equal(value, 2, "correct");
    value = list.findIndex(function (v) {
        return v < 0;
    });
    equal(value, -1, "not found correct");
});
