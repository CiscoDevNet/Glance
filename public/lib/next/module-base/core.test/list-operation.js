module("list-operation");

test("push", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.push(5, 6);
    deepEqual(list._data, [1, 2, 3, 4, 5, 6], "effect correct");
    equal(result, 6, "result correct");
});

test("pushAll", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.pushAll([5, 6]);
    deepEqual(list._data, [1, 2, 3, 4, 5, 6], "effect correct");
    equal(result, 6, "result correct");
});

test("pop", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.pop();
    equal(result, 4, "result correct");
    equal(list.length(), 3, "result correct");
});

test("unshift", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.unshift(5, 6);
    deepEqual(list._data, [5, 6, 1, 2, 3, 4], "effect correct");
    equal(result, 6, "result correct");
});

test("unshiftAll", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.unshiftAll([5, 6]);
    deepEqual(list._data, [5, 6, 1, 2, 3, 4], "effect correct");
    equal(result, 6, "result correct");
});

test("shift", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.shift();
    equal(list.length(), 3, "effect correct");
    equal(result, 1, "result correct");
});

test("splice", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.splice(1, 2, 5, 6, 7);
    deepEqual(list.data(), [1, 5, 6, 7, 4], "effect correct");
    deepEqual(result, [2, 3], "result correct");
});

test("splice transboundary", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result;
    // count transboundary
    result = list.splice(3, 2, 5, 6, 7);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 7], "count transboundary, effect correct");
    deepEqual(result, [4], "count transboundary, result correct");
    // nagative from
    result = list.splice(-1, 1, 8, 9);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 8, 9], "nagative from, effect correct");
    deepEqual(result, [7], "nagative from, result correct");
    // from transboundary
    result = list.splice(7, 2, 10, 11);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 8, 9, 10, 11], "from transboundary, effect correct");
    deepEqual(result, [], "from transboundary, result correct");
    // nagative count
    result = list.splice(5, -2, 7);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 7, 8, 9, 10, 11], "nagative count, effect correct");
    deepEqual(result, [], "nagative count, result correct");
});

test("spliceAll", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.spliceAll(1, 2, [5, 6, 7]);
    deepEqual(list.data(), [1, 5, 6, 7, 4], "effect correct");
    deepEqual(result, [2, 3], "result correct");
});

test("spliceAll transboundary", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result;
    // count transboundary
    result = list.spliceAll(3, 2, [5, 6, 7]);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 7], "count transboundary, effect correct");
    deepEqual(result, [4], "count transboundary, result correct");
    // nagative from
    result = list.spliceAll(-1, 1, [8, 9]);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 8, 9], "nagative from, effect correct");
    deepEqual(result, [7], "nagative from, result correct");
    // from transboundary
    result = list.spliceAll(7, 2, [10, 11]);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 8, 9, 10, 11], "from transboundary, effect correct");
    deepEqual(result, [], "from transboundary, result correct");
    // nagative count
    result = list.spliceAll(5, -2, [7]);
    deepEqual(list.data(), [1, 2, 3, 5, 6, 7, 8, 9, 10, 11], "nagative count, effect correct");
    deepEqual(result, [], "nagative count, result correct");
});

test("remove", function () {
    var list = new nx.List([1, 2, 3, 4, 1, 2, 3, 4]);
    var result = list.remove(1, 2);
    deepEqual(list.data(), [3, 4, 3, 4], "effect correct");
    deepEqual(result, 4, "result correct");
});

test("removeAll", function () {
    var list = new nx.List([1, 2, 3, 4, 1, 2, 3, 4]);
    var result = list.removeAll([1, 2]);
    deepEqual(list.data(), [3, 4, 3, 4], "effect correct");
    deepEqual(result, 4, "result correct");
});

test("removeAll as clear", function () {
    var list = new nx.List([1, 2, 3, 4, 1, 2, 3, 4]);
    var result = list.removeAll();
    deepEqual(list.length(), 0, "effect correct");
    deepEqual(result, 8, "result correct");
});

test("clear", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result = list.clear();
    equal(list.length(), 0, "effect correct");
    deepEqual(result, [1, 2, 3, 4], "result correct");
});

test("toggle", function () {
    var list = new nx.List([1, 2, 3, 4]);
    list.toggle(1);
    deepEqual(list.data(), [2, 3, 4], "effect correct remove");
    list.toggle(1);
    deepEqual(list.data(), [2, 3, 4, 1], "effect correct add");
    list.toggle(5);
    deepEqual(list.data(), [2, 3, 4, 1, 5], "effect correct add new");
});

test("toggle with existence", function () {
    var list = new nx.List([1, 2, 3, 4]);
    list.toggle(1, true);
    deepEqual(list.data(), [1, 2, 3, 4], "effect correct add exist");
    list.toggle(1, false);
    deepEqual(list.data(), [2, 3, 4], "effect correct remove exist");
    list.toggle(1, false);
    deepEqual(list.data(), [2, 3, 4], "effect correct remove non-exist");
    list.toggle(1, true);
    deepEqual(list.data(), [2, 3, 4, 1], "effect correct add non-exist");
});

test("setIndex", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result;
    result = list.setIndex(3, 0);
    deepEqual(list.data(), [3, 1, 2, 4], "effect correct backward");
    equal(result, 0, "result correct backward");
    result = list.setIndex(2, 3);
    deepEqual(list.data(), [3, 1, 4, 2], "effect correct forward");
    equal(result, 3, "result correct forward");
});

test("setIndexAt", function () {
    var list = new nx.List([1, 2, 3, 4]);
    var result;
    result = list.setIndexAt(2, 0);
    deepEqual(list.data(), [3, 1, 2, 4], "effect correct backward");
    equal(result, 0, "result correct backward");
    result = list.setIndexAt(1, 3);
    deepEqual(list.data(), [3, 2, 4, 1], "effect correct forward");
    equal(result, 3, "result correct forward");
});

test("move", function () {
    var list = new nx.List([1, 2, 3, 4, 5, 6, 7]);
    var result;
    result = list.move(4, 2, -2);
    deepEqual(list.data(), [1, 2, 5, 6, 3, 4, 7], "effect correct backward");
    equal(result, -2, "result correct backward");
    result = list.move(0, 2, 2);
    deepEqual(list.data(), [5, 6, 1, 2, 3, 4, 7], "effect correct forward");
    equal(result, 2, "result correct forward");
});

test("move transboundary", function () {
    var list = new nx.List([1, 2, 3, 4, 5, 6, 7]);
    var result;
    // nagative from
    result = list.move(-1, 1, -1);
    deepEqual(list.data(), [1, 2, 3, 4, 5, 7, 6], "nagative from, effect correct");
    deepEqual(result, -1, "nagative from, result correct");
    // from transboundary
    result = list.move(7, 1, -3);
    deepEqual(list.data(), [1, 2, 3, 4, 5, 7, 6], "from transboundary, effect correct");
    deepEqual(result, 0, "from transboundary, result correct");
    // from transboundary nagative
    result = list.move(-8, 1, -3);
    deepEqual(list.data(), [1, 2, 3, 4, 5, 7, 6], "from transboundary nagative, effect correct");
    deepEqual(result, 0, "from transboundary nagative, result correct");
    // zero count
    result = list.move(1, 0, 1);
    deepEqual(list.data(), [1, 2, 3, 4, 5, 7, 6], "zero count, effect correct");
    deepEqual(result, 0, "zero count, result correct");
    // nagative count
    result = list.move(2, -1, 2);
    deepEqual(list.data(), [1, 3, 4, 2, 5, 7, 6], "nagative count, effect correct");
    deepEqual(result, 2, "nagative count, result correct");
    // count transboundary
    result = list.move(5, 10, -2);
    deepEqual(list.data(), [1, 3, 4, 7, 6, 2, 5], "count transboundary, effect correct");
    deepEqual(result, -2, "count transboundary, result correct");
    // count transboundary nagative
    result = list.move(2, -10, 1);
    deepEqual(list.data(), [4, 1, 3, 7, 6, 2, 5], "count transboundary nagative, effect correct");
    deepEqual(result, 1, "count transboundary nagative, result correct");
    // zero delta
    result = list.move(1, 1, 0);
    deepEqual(list.data(), [4, 1, 3, 7, 6, 2, 5], "zero delta, effect correct");
    deepEqual(result, 0, "zero delta, result correct");
    // delta transboundary
    result = list.move(4, 2, 2);
    deepEqual(list.data(), [4, 1, 3, 7, 5, 6, 2], "delta transboundary, effect correct");
    deepEqual(result, 1, "delta transboundary, result correct");
    // delta transboundary
    result = list.move(5, 2, 2);
    deepEqual(list.data(), [4, 1, 3, 7, 5, 6, 2], "delta transboundary no move, effect correct");
    deepEqual(result, 0, "delta transboundary no move, result correct");
    // delta transboundary nagative
    result = list.move(1, 1, -10);
    deepEqual(list.data(), [1, 4, 3, 7, 5, 6, 2], "delta transboundary nagative, effect correct");
    deepEqual(result, -1, "delta transboundary nagative, result correct");
    // delta transboundary nagative
    result = list.move(0, 1, -10);
    deepEqual(list.data(), [1, 4, 3, 7, 5, 6, 2], "delta transboundary nagative no move, effect correct");
    deepEqual(result, 0, "delta transboundary nagative no move, result correct");
});
