module("list-sorting");

test("sorting values", function() {
    var list = new nx.List([3, 1, 2]);
    var target = nx.List.sorting(list);
    deepEqual(target.data(), [1, 2, 3], "init correct");
    list.unshift(6); // 6,3,1,2
    deepEqual(target.data(), [1, 2, 3, 6], "unshift correct");
    list.remove(3); // 6,1,2
    deepEqual(target.data(), [1, 2, 6], "remove correct");
    list.push(5); // 6,1,2,5
    deepEqual(target.data(), [1, 2, 5, 6], "push correct");
    list.splice(2, 1, 0, 4); // 6,1,0,4,5
    deepEqual(target.data(), [0, 1, 4, 5, 6], "splice correct");
    list.shift(); // 1,0,4,5
    deepEqual(target.data(), [0, 1, 4, 5], "shift correct");
});

test("sorting duplicated values with comparator", function() {
    var list = new nx.List([3, 1, 1, 2]);
    var target = nx.List.sorting(list, function(a, b) {
        return b - a;
    });
    deepEqual(target.data(), [3, 2, 1, 1], "init correct");
    list.unshift(6); // 6,3,1,1,2
    deepEqual(target.data(), [6, 3, 2, 1, 1], "unshift correct");
    list.remove(1); // 6,3,2
    deepEqual(target.data(), [6, 3, 2], "remove correct");
    list.push(5, 5); // 6,3,2,5,5
    deepEqual(target.data(), [6, 5, 5, 3, 2], "push correct");
    list.splice(2, 1, 4, 0, 4); // 6,3,4,0,4,5,5
    deepEqual(target.data(), [6, 5, 5, 4, 4, 3, 0], "splice correct");
    list.shift(); // 3,4,0,4,5,5
    deepEqual(target.data(), [5, 5, 4, 4, 3, 0], "shift correct");
});

test("sorting plain-objects with paths and comparator", function() {
    var list = new nx.List(Array([3, 3], [1, 1], [2, 2]));
    var target = nx.List.sorting(list, "0,1", function(a0, a1, b0, b1) {
        return a0 + a1 - b0 - b1;
    });
    deepEqual(target.data(), Array([1, 1], [2, 2], [3, 3]), "init correct");
    list.unshift([6, 6]); // 6,3,1,2
    deepEqual(target.data(), Array([1, 1], [2, 2], [3, 3], [6, 6]), "unshift correct");
    list.splice(1, 1); // 6,1,2
    deepEqual(target.data(), Array([1, 1], [2, 2], [6, 6]), "removeAt correct");
    list.push([5, 5]); // 6,1,2,5
    deepEqual(target.data(), Array([1, 1], [2, 2], [5, 5], [6, 6]), "push correct");
    list.splice(2, 1, [0, 0], [4, 4]); // 6,1,0,4,5
    deepEqual(target.data(), Array([0, 0], [1, 1], [4, 4], [5, 5], [6, 6]), "splice correct");
    list.shift(); // 1,0,4,5
    deepEqual(target.data(), Array([0, 0], [1, 1], [4, 4], [5, 5]), "shift correct");
});

test("sorting objects with paths and comparator", function() {
    var Item = nx.define({
        properties: {
            income: 0,
            cost: 0
        },
        methods: {
            init: function(income, cost) {
                this.inherited();
                this.income(income || 0);
                this.cost(cost || 0);
            }
        }
    });
    var list = new nx.List([new Item(3, 0), new Item(1, 0), new Item(2, 0)]);
    var target = nx.List.sorting(list, "income, cost", function(ai, ac, bi, bc) {
        return (ai - ac) - (bi - bc);
    });
    var values = function() {
        return target.data().map(function(item) {
            return [item.income(), item.cost()].join("-");
        }).join(",");
    };
    // 3-0,1-0,2-0
    deepEqual(values(), "1-0,2-0,3-0", "init correct");
    // 3-0,4-0,2-0
    list.get(1).income(4);
    deepEqual(values(), "2-0,3-0,4-0", "value change correct");
    // 3-0,4-3,2-0
    list.get(1).cost(3);
    deepEqual(values(), "4-3,2-0,3-0", "value change again correct");
    // 3-0,4-3,2-0,3-0
    list.push(list.get(0));
    deepEqual(values(), "4-3,2-0,3-0,3-0", "value change again correct");
    // 3-0,4-3,7-0,8-0,9-0,3-0
    list.splice(2, 1, new Item(7, 0), new Item(8, 0), new Item(9, 0));
    deepEqual(values(), "4-3,3-0,3-0,7-0,8-0,9-0", "splice correct");
    // 3-0,4-3,7-0,8-0,9-7,3-0
    list.get(4).cost(7);
    deepEqual(values(), "4-3,9-7,3-0,3-0,7-0,8-0", "new value change correct");
    // 4-3,7-0,8-0,9-7
    list.remove(list.get(0));
    deepEqual(values(), "4-3,9-7,7-0,8-0", "remove correct");
    
});
