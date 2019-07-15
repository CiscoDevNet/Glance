module("list-tuple");

test("size=3 step=1", function() {
    var list = new nx.List([1, 3, 5, 7, 9]);
    var target = nx.List.tuple(list, 3);
    deepEqual(target.data(), Array([1, 3, 5], [3, 5, 7], [5, 7, 9]), "init correct");
    list.push(11, 13); // 1,3,5,7,9,11,13
    deepEqual(target.data(), Array([1, 3, 5], [3, 5, 7], [5, 7, 9], [7, 9, 11], [9, 11, 13]), "push correct");
    list.splice(2, 0, 4); // 1,3,4,5,7,9,11,13
    deepEqual(target.data(), Array([1, 3, 4], [3, 4, 5], [4, 5, 7], [5, 7, 9], [7, 9, 11], [9, 11, 13]), "insert correct");
    list.splice(4, 1, 8); // 1,3,4,5,8,9,11,13
    deepEqual(target.data(), Array([1, 3, 4], [3, 4, 5], [4, 5, 8], [5, 8, 9], [8, 9, 11], [9, 11, 13]), "replace correct");
    list.unshift(0); // 0,1,3,4,5,8,9,11,13
    deepEqual(target.data(), Array([0, 1, 3], [1, 3, 4], [3, 4, 5], [4, 5, 8], [5, 8, 9], [8, 9, 11], [9, 11, 13]), "unshift correct");
    list.pop(); // 0,1,3,4,5,8,9,11
    deepEqual(target.data(), Array([0, 1, 3], [1, 3, 4], [3, 4, 5], [4, 5, 8], [5, 8, 9], [8, 9, 11]), "pop correct");
    list.shift(); // 1,3,4,5,8,9,11
    deepEqual(target.data(), Array([1, 3, 4], [3, 4, 5], [4, 5, 8], [5, 8, 9], [8, 9, 11]), "shift correct");
    list.remove(4, 5, 8); // 1,3,9,11
    deepEqual(target.data(), Array([1, 3, 9], [3, 9, 11]), "remove correct");
    list.remove(1, 11); // 3,9
    deepEqual(target.data().length, 0, "boundary down correct");
    list.push(12, 13); // 3,9,12,13
    deepEqual(target.data(), Array([3, 9, 12], [9, 12, 13]), "boundary up correct");
    list.move(3, 1, -2); // 3,13,9,12
    deepEqual(target.data(), Array([3, 13, 9], [13, 9, 12]), "move correct");
});

test("size=3 step=2", function() {
    var list = new nx.List([1, 3, 5, 7, 9]);
    var target = nx.List.tuple(list, 3, 2);
    deepEqual(target.data(), Array([1, 3, 5], [5, 7, 9]), "init correct");
    list.push(11, 13); // 1,3,5,7,9,11,13
    deepEqual(target.data(), Array([1, 3, 5], [5, 7, 9], [9, 11, 13]), "push correct");
    list.splice(2, 0, 4); // 1,3,4,5,7,9,11,13
    deepEqual(target.data(), Array([1, 3, 4], [4, 5, 7], [7, 9, 11]), "insert correct");
    list.splice(4, 1, 8); // 1,3,4,5,8,9,11,13
    deepEqual(target.data(), Array([1, 3, 4], [4, 5, 8], [8, 9, 11]), "replace correct");
    list.unshift(0); // 0,1,3,4,5,8,9,11,13
    deepEqual(target.data(), Array([0, 1, 3], [3, 4, 5], [5, 8, 9], [9, 11, 13]), "unshift correct");
    list.pop(); // 0,1,3,4,5,8,9,11
    deepEqual(target.data(), Array([0, 1, 3], [3, 4, 5], [5, 8, 9]), "pop correct");
    list.shift(); // 1,3,4,5,8,9,11
    deepEqual(target.data(), Array([1, 3, 4], [4, 5, 8], [8, 9, 11]), "replace correct");
    list.remove(4, 5, 8); // 1,3,9,11
    deepEqual(target.data(), Array([1, 3, 9]), "remove correct");
    list.remove(1, 11); // 3,9
    deepEqual(target.data().length, 0, "boundary down correct");
    list.push(12); // 3,9,12
    deepEqual(target.data(), Array([3, 9, 12]), "boundary up correct");
});

test("size=2 step=2 update", function() {
    var list = new nx.List([1, 3, 5, 7]);
    var target = nx.List.tuple(list, 2, 2, "index, items", function(resources, index, items) {
        return [index, items.join(",")].join(":");
    });
    deepEqual(target.data(), ["0:1,3", "2:5,7"], "init correct");
    list.push(9, 11, 13); // 1,3,5,7,9,11,13
    deepEqual(target.data(), ["0:1,3", "2:5,7", "4:9,11"], "push correct");
    list.splice(2, 0, 4); // 1,3,4,5,7,9,11,13
    deepEqual(target.data(), ["0:1,3", "2:4,5", "4:7,9", "6:11,13"], "insert correct");
    list.splice(4, 1, 8); // 1,3,4,5,8,9,11,13
    deepEqual(target.data(), ["0:1,3", "2:4,5", "4:8,9", "6:11,13"], "replace correct");
    list.unshift(0); // 0,1,3,4,5,8,9,11,13
    deepEqual(target.data(), ["0:0,1", "2:3,4", "4:5,8", "6:9,11"], "unshift correct");
    list.pop(), list.pop(); // 0,1,3,4,5,8,9
    deepEqual(target.data(), ["0:0,1", "2:3,4", "4:5,8"], "pop correct");
    list.shift(); // 1,3,4,5,8,9
    deepEqual(target.data(), ["0:1,3", "2:4,5", "4:8,9"], "shift correct");
    list.remove(3, 4, 5, 8); // 1,9
    deepEqual(target.data(), ["0:1,9"], "remove correct");
    list.remove(1); // 9
    deepEqual(target.data().length, 0, "boundary down correct");
    list.push(12); // 9,12
    deepEqual(target.data(), ["0:9,12"], "boundary up correct");
});

test("size=2 step=1 update=accumulation", function() {
    var Item = nx.define({
        properties: {
            production: 0,
            consumption: 0,
            carried: 0,
            kept: 0
        },
        methods: {
            init: function(production, consumption) {
                this.inherited();
                this.production(production);
                this.consumption(consumption);
            }
        }
    });
    var item, list = new nx.List([new Item(10, 5), new Item(10, 5), new Item(10, 5)]);
    var target = nx.List.tuple(list, 2, "index, items", function(resources, index, items) {
        var last = resources.retain("calculator");
        if (!last || nx.math.sign(index) !== nx.math.sign(last.index()) || items[0] !== last.item0() || items[1] !== last.item1()) {
            resources.release("calculator");
            resources.retain("calculator", nx.singleton({
                properties: {
                    index: index,
                    item0: {
                        value: items[0]
                    },
                    item1: {
                        value: items[1]
                    },
                    carried0: index === 0 && function() {
                        return items[0].carried(0);
                    },
                    kept0: index === 0 && nx.binding("item0.production, item0.consumption", function(production, consumption) {
                        return items[0].kept(production - consumption);
                    }),
                    carried1: index >= 0 && nx.binding("item0.kept", function(kept) {
                        return items[1].carried(kept);
                    }),
                    kept1: index >= 0 && nx.binding("item0.kept, item1.production, item1.consumption", function(kept, production, consumption) {
                        return items[1].kept(kept + production - consumption);
                    })
                }
            }));
        } else {
            last.index(index);
        }
        return items[0];
    });
    var content = function() {
        return list.data().map(function(item) {
            return [item.production(), item.consumption(), item.carried(), item.kept()].join(",");
        }).join(" ");
    };
    // 10,5 10,5 10,5
    equal(content(), "10,5,0,5 10,5,5,10 10,5,10,15", "init correct");
    item = list.get(1);
    item.production(40);
    item.consumption(20);
    // 10,5 40,20 10,5
    equal(content(), "10,5,0,5 40,20,5,25 10,5,25,30", "init item change correct");
    list.splice(1, 0, new Item(20, 10));
    // 10,5 20,10 40,20 10,5
    equal(content(), "10,5,0,5 20,10,5,15 40,20,15,35 10,5,35,40", "insert correct");
    item = list.get(1);
    item.production(80);
    item.consumption(40);
    // 10,5 80,40 40,20 10,5
    equal(content(), "10,5,0,5 80,40,5,45 40,20,45,65 10,5,65,70", "insert item change correct");
    list.splice(2, 1, new Item(20, 10));
    // 10,5 80,40 20,10 10,5
    equal(content(), "10,5,0,5 80,40,5,45 20,10,45,55 10,5,55,60", "replace change correct");
    // 10,5 80,40 20,10 10,5 2,1
    list.push(new Item(2, 1));
    equal(content(), "10,5,0,5 80,40,5,45 20,10,45,55 10,5,55,60 2,1,60,61", "push correct");
    // 100,0 10,5 80,40 20,10 10,5 2,1
    list.unshift(new Item(100, 0));
    equal(content(), "100,0,0,100 10,5,100,105 80,40,105,145 20,10,145,155 10,5,155,160 2,1,160,161", "unshift correct");
    // 100,0 10,5 80,40 20,10 10,5
    item = list.pop();
    equal(content(), "100,0,0,100 10,5,100,105 80,40,105,145 20,10,145,155 10,5,155,160", "pop correct");
    // 100,100 10,5 80,40 20,10 10,5
    list.get(0).consumption(100);
    equal(content(), "100,100,0,0 10,5,0,5 80,40,5,45 20,10,45,55 10,5,55,60", "unshift item change correct");
    ok(item.carried() === 160 && item.kept() === 161, "off item released");
    // 200,100 10,5 80,40 20,10 10,5
    list.get(0).production(200);
    equal(content(), "200,100,0,100 10,5,100,105 80,40,105,145 20,10,145,155 10,5,155,160", "unshift item change correct again");
    // 10,5 80,40 20,10 10,5
    list.shift();
    equal(content(), "10,5,0,5 80,40,5,45 20,10,45,55 10,5,55,60", "shift correct");
    // 10,5 20,10 10,5 80,40
    list.move(1, 1, 2);
    equal(content(), "10,5,0,5 20,10,5,15 10,5,15,20 80,40,20,60", "move correct");
});
