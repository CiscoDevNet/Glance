module("list-unique");

test("unique", function () {
    var list = new nx.UniqueList([1, 2, 3, 1, 2, 3, 3, 4]);
    deepEqual(list.data(), [1, 2, 3, 4], "init");
    list.push(1, 2, 3, 4, 5);
    deepEqual(list.data(), [1, 2, 3, 4, 5], "add");
    list.remove(2);
    deepEqual(list.data(), [1, 3, 4, 5], "remove");
});
