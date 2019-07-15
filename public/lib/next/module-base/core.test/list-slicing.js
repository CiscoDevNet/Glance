module("list-slicing");

test("slicing", function() {
    var list = new nx.List([1, 2, 3, 4, 5, 6]);
    var target = nx.List.slicing(list, 2, 5);
    deepEqual(target.data(), [3, 4, 5], "init correct");
    // 1,2,5,6
    list.remove(3, 4);
    deepEqual(target.data(), [5, 6], "remove correct");
    // 1,2,5,7,8,9
    list.splice(3, 1, 7, 8, 9);
    deepEqual(target.data(), [5, 7, 8], "splice correct");
    // 0,1,2,5,7,8,9
    list.unshift(0);
    deepEqual(target.data(), [2, 5, 7], "unshift correct");
    // 0
    list.splice(1, 6);
    deepEqual(target.data(), [], "empty correct");
});
