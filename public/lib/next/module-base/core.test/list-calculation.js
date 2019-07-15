module("list-calculation");

test("select", function() {
    var source = new nx.List([1, 2, 4, 5]);
    // target tests
    var target = nx.List.select(source, function(n) {
        return n >= 3;
    });
    equalSet(target.data(), [4, 5], "On init, result correct.");
    source.push(3, 10);
    equalSet(target.data(), [3, 4, 5, 10], "On add matched item, result correct.");
    source.push(-10, -20);
    equalSet(target.data(), [3, 4, 5, 10], "On add unmatched item, result correct.");
    source.push(-1, 6);
    equalSet(target.data(), [3, 4, 5, 6, 10], "On add both item, result correct.");
    source.remove(3, 4);
    equalSet(target.data(), [5, 6, 10], "On remove matched item, result correct.");
    source.remove(-10, 1);
    equalSet(target.data(), [5, 6, 10], "On remove unmatched item, result correct.");
    source.remove(2, 10);
    equalSet(target.data(), [5, 6], "On remove both item, result correct.");
    target.release();
    equalSet(target.data(), [], "On release, result empty.");
    source.push(1, 2, 3, 4);
    equalSet(target.data(), [], "On add after release, result not effected correct.");
    source.remove(-20, 5, 6);
    equalSet(target.data(), [], "On remove after release, result not effected correct.");
});

test("cross", function() {
    var a = new nx.List([1, 2, 3, 4]);
    var b = new nx.List([2, 3, 4]);
    var c = new nx.List([1, 3, 6]);
    // target tests
    var target = nx.List.cross([a, b, c]);
    equalSet(target.data(), [3], "On init, result correct.");
    b.push(1);
    equalSet(target.data(), [1, 3], "On add, result correct.");
    a.remove(3);
    equalSet(target.data(), [1], "On remove, result correct.");
    target.release();
    equalSet(target.data(), [1], "On release, result not effected correct.");
    c.push(5);
    equalSet(target.data(), [1], "On add after release, result not effected correct.");
    c.remove(1);
    equalSet(target.data(), [1], "On remove after release, result not effected correct.");
});

test("union", function() {
    var a = new nx.List([1, 2, 3, 4]);
    var b = new nx.List([2, 3, 4]);
    var c = new nx.List([1, 3, 5]);
    // target tests
    var target = nx.List.union([a, b, c]);
    equalSet(target.data(), [1, 2, 3, 4, 5], "On init, result correct.");
    b.push(6);
    equalSet(target.data(), [1, 2, 3, 4, 5, 6], "On add, result correct.");
    a.remove(2);
    equalSet(target.data(), [1, 2, 3, 4, 5, 6], "On remove, result not effected correct.");
    b.remove(2);
    equalSet(target.data(), [1, 3, 4, 5, 6], "On remove, result correct.");
    target.release();
    equalSet(target.data(), [1, 3, 4, 5, 6], "On release, result not effected correct.");
    c.push(7);
    equalSet(target.data(), [1, 3, 4, 5, 6], "On add after release, result not effected correct.");
    b.remove(5, 6);
    equalSet(target.data(), [1, 3, 4, 5, 6], "On remove after release, result not effected correct.");
});
test("complement", function() {
    var a = new nx.List([1, 2, 3, 4]);
    var b = new nx.List([2, 3, 5]);
    var c = new nx.List([4]);
    // target tests
    var target = nx.List.complement([a, b, c]);
    equalSet(target.data(), [1], "On init, result correct.");
    a.push(6, 7, 8);
    equalSet(target.data(), [1, 6, 7, 8], "On add, result correct.");
    a.remove(2);
    equalSet(target.data(), [1, 6, 7, 8], "On remove, result not effected correct.");
    b.push(6);
    equalSet(target.data(), [1, 7, 8], "On remove, result not effected correct.");
    c.push(8);
    equalSet(target.data(), [1, 7], "On remove, result not effected correct.");
    a.remove(1);
    equalSet(target.data(), [7], "On remove, result correct.");
    target.release();
    equalSet(target.data(), [7], "On release, result not effected correct.");
    a.push(9);
    equalSet(target.data(), [7], "On add after release, result not effected correct.");
    b.remove(5, 6);
    equalSet(target.data(), [7], "On remove after release, result not effected correct.");
});
test("symmetric difference", function() {
    var a = new nx.List([1, 2, 10, 11, 12]);
    var b = new nx.List([2, 3, 10, 11]);
    var c = new nx.List([3, 1, 10]);
    // target tests
    var target = nx.List.delta([a, b, c]);
    equalSet(target.data(), [10, 12], "On init, result correct.");
    a.remove(10);
    equalSet(target.data(), [12], "On remove, result correct.");
    b.remove(10);
    equalSet(target.data(), [10, 12], "On remove again, result correct.");
    c.remove(10);
    equalSet(target.data(), [12], "On remove third-time, result correct.");
    c.push(21);
    equalSet(target.data(), [12, 21], "On add, result correct.");
    b.push(21);
    equalSet(target.data(), [12], "On add again, result correct.");
    a.push(21);
    equalSet(target.data(), [12, 21], "On add third-time, result correct.");
    target.release();
    equalSet(target.data(), [12, 21], "On release, result not effected correct.");
    a.push(9);
    equalSet(target.data(), [12, 21], "On add after release, result not effected correct.");
    b.remove(2, 10);
    equalSet(target.data(), [12, 21], "On remove after release, result not effected correct.");
});
test("and", function() {
    var a = new nx.List([]);
    var b = new nx.List([1, 2]);
    var c = new nx.List([11, 12]);
    // target tests
    var target = nx.List.and([a, b, c]);
    equalSet(target.data(), [], "On init, result correct.");
    a.push(100);
    equalSet(target.data(), [11, 12], "On add to short-circuit collection, result correct.");
    c.push(13);
    equalSet(target.data(), [11, 12, 13], "On add to hit collection, result correct.");
    b.remove(1, 2);
    equalSet(target.data(), [], "On remove to short-circuit collection, result correct.");
    b.push(1);
    equalSet(target.data(), [11, 12, 13], "On add to second short-circuit collection, result correct.");
    c.remove(11);
    equalSet(target.data(), [12, 13], "On remove to hit collection, result correct.");
    a.remove(100);
    equalSet(target.data(), [], "On remove to first short-circuit collection, result of correct.");
    target.release();
    equalSet(target.data(), [], "On release, result not effected correct.");
    a.push(201);
    equalSet(target.data(), [], "On add after release, result not effected correct.");
    c.remove(11, 12, 13);
    equalSet(target.data(), [], "On remove after release, result not effected correct.");
});
test("or", function() {
    var a = new nx.List([]);
    var b = new nx.List([1, 2]);
    var c = new nx.List([11, 12]);
    // target tests
    var target = nx.List.or([a, b, c]);
    equalSet(target.data(), [1, 2], "On init, result correct.");
    a.push(100);
    equalSet(target.data(), [100], "On add to short-circuit collection, result of correct.");
    a.remove(100);
    equalSet(target.data(), [1, 2], "On remove to short-circuit collection, result of correct.");
    b.push(3);
    equalSet(target.data(), [1, 2, 3], "On add to hit collection, result correct.");
    b.remove(1, 3);
    equalSet(target.data(), [2], "On remove to hit collection, result correct.");
    b.remove(2);
    equalSet(target.data(), [11, 12], "On remove last one to hit collection, result correct.");
    c.push(13);
    equalSet(target.data(), [11, 12, 13], "On add to last hit collection, result correct.");
    c.remove(11);
    equalSet(target.data(), [12, 13], "On remove to last hit collection, result correct.");
    a.push(200);
    equalSet(target.data(), [200], "On add to short-circuit again, result correct.");
    target.release();
    equalSet(target.data(), [200], "On release, result not effected correct.");
    a.push(201);
    equalSet(target.data(), [200], "On add after release, result not effected correct.");
    c.remove(11, 12, 13);
    equalSet(target.data(), [200], "On remove after release, result not effected correct.");
});
