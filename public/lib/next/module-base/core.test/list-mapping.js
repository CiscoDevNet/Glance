module("list-mapping");

test("mapping", function() {
    var source = new nx.List([1, 2, 4]);
    // target tests
    var target = nx.List.mapping(source, function(n) {
        return n + 100;
    });
    deepEqual(target.data(), [101, 102, 104], "On init, result correct.");
    source.splice(0, 0, 3);
    deepEqual(target.data(), [103, 101, 102, 104], "On add matched item, result correct.");
    source.remove(1, 4);
    deepEqual(target.data(), [103, 102], "On remove item, result correct.");
    source.move(1, 1, -1);
    deepEqual(target.data(), [102, 103], "On move item, result correct.");
    target.release();
    deepEqual(target.data(), [102, 103], "On release, result not effected correct.");
    source.push(1, 3, 5);
    deepEqual(target.data(), [102, 103], "On add after release, result not effected correct.");
    source.remove(2, 5);
    deepEqual(target.data(), [102, 103], "On remove after release, result not effected correct.");
});

test("mapping key", function() {
    var Item = nx.define({
        properties: {
            x: 0
        },
        statics: {
            create: function(v) {
                var item = new Item();
                item.x(v);
                return item;
            }
        }
    });
    var i1 = Item.create(0);
    var i2 = Item.create(1);
    var i3 = Item.create(2);
    var source = new nx.List([i1, i2]);
    // target tests
    var target = nx.List.mapping(source, "x");
    deepEqual(target.data(), [0, 1], "On init, result correct.");
    i2.x(10);
    deepEqual(target.data(), [0, 10], "On change init item, result correct.");
    source.splice(0, 0, i3);
    deepEqual(target.data(), [2, 0, 10], "On add matched item, result correct.");
    i3.x(20);
    deepEqual(target.data(), [20, 0, 10], "On change added item, result correct.");
    source.remove(i1);
    deepEqual(target.data(), [20, 10], "On remove item, result correct.");
    source.move(0, 1, 1);
    deepEqual(target.data(), [10, 20], "On move item, result correct.");
    i1.x(100);
    deepEqual(target.data(), [10, 20], "On change removed item, result correct.");
    target.release();
    deepEqual(target.data(), [10, 20], "On release, result not effected correct.");
    i3.x(2);
    deepEqual(target.data(), [10, 20], "On change item after release, result not effected correct.");
    source.push(i1);
    deepEqual(target.data(), [10, 20], "On add after release, result not effected correct.");
    source.remove(i2);
    deepEqual(target.data(), [10, 20], "On remove after release, result not effected correct.");
});

test("mapping binding", function() {
    var Item = nx.define({
        properties: {
            x: 0
        },
        statics: {
            create: function(v) {
                var item = new Item();
                item.x(v);
                return item;
            }
        }
    });
    var i1 = Item.create(1);
    var i2 = Item.create(2);
    var i3 = Item.create(3);
    var source = new nx.List([i1, i2]);
    // target tests
    var target = nx.List.mapping(source, "x", true, function(opr, x) {
        opr.set(x * x);
    });
    deepEqual(target.data(), [1, 4], "On init, result correct.");
    i2.x(10);
    deepEqual(target.data(), [1, 100], "On change init item, result correct.");
    source.splice(0, 0, i3);
    deepEqual(target.data(), [9, 1, 100], "On add matched item, result correct.");
    i3.x(-10);
    deepEqual(target.data(), [100, 1, 100], "On change added item, result correct.");
    source.remove(i2);
    deepEqual(target.data(), [100, 1], "On remove item, result correct.");
    i2.x(100);
    deepEqual(target.data(), [100, 1], "On change removed item, result correct.");
    source.move(0, 1, 1);
    deepEqual(target.data(), [1, 100], "On remove item, result correct.");
    i3.x(9);
    deepEqual(target.data(), [1, 81], "On change moved item, result correct.");
    target.release();
    deepEqual(target.data(), [1, 81], "On release, result not effected correct.");
    i3.x(2);
    deepEqual(target.data(), [1, 81], "On change item after release, result not effected correct.");
    source.push(i2);
    deepEqual(target.data(), [1, 81], "On add after release, result not effected correct.");
    source.remove(i1);
    deepEqual(target.data(), [1, 81], "On remove after release, result not effected correct.");
});

test("mapping release each", function() {
    var tlist = [];
    var source = new nx.List([1, 2, 3]);
    var target = nx.List.mapping(source, true, function(async, n) {
        tlist.push(-n);
        return {
            release: function() {
                tlist.splice(tlist.indexOf(-n), 1);
            }
        };
    });
    deepEqual(tlist, [-1, -2, -3], "On init, result correct.");
    source.push(4);
    deepEqual(tlist, [-1, -2, -3, -4], "On add, result correct.");
    source.remove(2);
    deepEqual(tlist, [-1, -3, -4], "On remove, result correct.");
    source.splice(1, 0, 2);
    deepEqual(tlist, [-1, -3, -4, -2], "On splice add, result correct.");
    source.splice(1, 2, 5);
    deepEqual(tlist, [-1, -4, -5], "On splice, result correct.");
    source.move(1, 1, 1);
    source.remove(5);
    deepEqual(tlist, [-1, -4], "On remove after move, result correct.");
});
