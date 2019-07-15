module("list-concatenate");

test("concatenate", function() {
    var a = new nx.List([1, 3, 5]);
    var b = new nx.List([2, 4, 6]);
    var list = new nx.List([a]);
    // target tests
    var target = nx.List.concatenate(list);
    deepEqual(target.data(), [1, 3, 5], "On init, result correct.");
    list.push(b);
    deepEqual(target.data(), [1, 3, 5, 2, 4, 6], "On add list, result correct.");
    a.push(7);
    deepEqual(target.data(), [1, 3, 5, 7, 2, 4, 6], "On add to front list, result correct.");
    b.unshift(0);
    deepEqual(target.data(), [1, 3, 5, 7, 0, 2, 4, 6], "On add to back list, result correct.");
    a.remove(5);
    deepEqual(target.data(), [1, 3, 7, 0, 2, 4, 6], "On remove from front list, result correct.");
    b.remove(2);
    deepEqual(target.data(), [1, 3, 7, 0, 4, 6], "On remove back from list, result correct.");
    a.splice(1, 1, 1.1, 1.2, 1.3);
    deepEqual(target.data(), [1, 1.1, 1.2, 1.3, 7, 0, 4, 6], "On splice front list, result correct.");
    b.splice(2, 1, 8, 10, 12);
    deepEqual(target.data(), [1, 1.1, 1.2, 1.3, 7, 0, 4, 8, 10, 12], "On splice back list, result correct.");
    list.move(0, 1, 1);
    deepEqual(target.data(), [0, 4, 8, 10, 12, 1, 1.1, 1.2, 1.3, 7], "On move list, result correct.");
    b.move(0, 1, 4);
    deepEqual(target.data(), [4, 8, 10, 12, 0, 1, 1.1, 1.2, 1.3, 7], "On move item backward, result correct.");
    a.move(4, 1, -4);
    deepEqual(target.data(), [4, 8, 10, 12, 0, 7, 1, 1.1, 1.2, 1.3], "On move item forward, result correct.");
    list.remove(a);
    deepEqual(target.data(), [4, 8, 10, 12, 0], "On remove list, result correct.");
});
