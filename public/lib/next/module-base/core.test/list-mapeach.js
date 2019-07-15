module("list-mapeach");

test("mapeach", function() {
    var Class = nx.define({
        properties: {
            index: 0,
            earned: 0,
            spent: 0,
            earnedBefore: 0,
            spentTotal: 0
        },
        methods: {
            init: function(data) {
                this.inherited();
                nx.sets(this, data);
            }
        }
    });
    var s1, s2, s3;
    var list = new nx.List([
        s1 = new Class({
            earned: 100,
            spent: 50
        }),
        s2 = new Class({
            earned: 200,
            spent: 30
        })
    ]);
    s3 = new Class({
        earned: 300,
        spent: 20
    });
    // get data
    var data = function() {
        keys = ["index", "earnedBefore", "spentTotal"];
        return target._data.map(function(item) {
            var rslt = [nx.is(item, Class)];
            nx.each(keys, function(key) {
                rslt.push(item[key].call(item));
            });
            return rslt;
        });
    };
    // target tests
    target = nx.List.mapeach(list, {
        "index+": nx.math.one,
        "+earnedBefore": "earned",
        "spentTotal+": "spent"
    });
    deepEqual(data(), Array([true, 1, 0, 50], [true, 2, 100, 80]), "on init, result correct");
    list.unshift(s3);
    deepEqual(data(), Array([true, 1, 0, 20], [true, 2, 300, 70], [true, 3, 400, 100]), "on add, result correct");
    s1.spent(70);
    deepEqual(data(), Array([true, 1, 0, 20], [true, 2, 300, 90], [true, 3, 400, 120]), "on change 'key+', result correct");
    s3.earned(400);
    deepEqual(data(), Array([true, 1, 0, 20], [true, 2, 400, 90], [true, 3, 500, 120]), "on change '+key', result correct");
    list.remove(s1);
    deepEqual(data(), Array([true, 1, 0, 20], [true, 2, 400, 50]), "on remove, result correct");
    list.move(0, 1, 1);
    deepEqual(data(), Array([true, 1, 0, 30], [true, 2, 200, 50]), "on move, result correct");
    target.release();
    deepEqual(data(), [], "on release, target cleared");
});

test("mapeach as", function() {
    var Class = nx.define({
        properties: {
            index: 0,
            earned: 0,
            spent: 0,
            earnedBefore: 0,
            spentTotal: 0
        },
        methods: {
            init: function(data) {
                this.inherited();
                nx.sets(this, data);
            }
        }
    });
    var s1, s2, s3;
    var list = new nx.List([
        s1 = new Class({
            earned: 100,
            spent: 50
        }),
        s2 = new Class({
            earned: 200,
            spent: 30
        })
    ]);
    s3 = new Class({
        earned: 300,
        spent: 20
    });
    // get data
    var data = function() {
        keys = ["index", "earnedBefore", "spentTotal"];
        return target._data.map(function(item) {
            var rslt = [nx.is(item.o(), Class)];
            nx.each(keys, function(key) {
                rslt.push(item[key].call(item));
            });
            return rslt;
        });
    };
    // target tests
    target = nx.List.mapeach(list, "o", {
        "+earnedBefore": "o.earned",
        "spentTotal+": "o.spent"
    });
    deepEqual(data(), Array([true, 0, 0, 50], [true, 1, 100, 80]), "on init, result correct");
    list.unshift(s3);
    deepEqual(data(), Array([true, 0, 0, 20], [true, 1, 300, 70], [true, 2, 400, 100]), "on add, result correct");
    s1.spent(70);
    deepEqual(data(), Array([true, 0, 0, 20], [true, 1, 300, 90], [true, 2, 400, 120]), "on change 'key+', result correct");
    s3.earned(400);
    deepEqual(data(), Array([true, 0, 0, 20], [true, 1, 400, 90], [true, 2, 500, 120]), "on change '+key', result correct");
    list.remove(s1);
    deepEqual(data(), Array([true, 0, 0, 20], [true, 1, 400, 50]), "on remove, result correct");
    list.move(0, 1, 1);
    deepEqual(data(), Array([true, 0, 0, 30], [true, 1, 200, 50]), "on move, result correct");
    target.release();
    deepEqual(data(), [], "on release, target cleared");
});
