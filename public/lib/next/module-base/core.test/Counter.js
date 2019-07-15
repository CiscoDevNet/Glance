module("Counter");

test("operations", function () {
    var counter = new nx.Counter();
    var map = {
        "Null": null,
        "Undefined": undefined,
        "String0": "",
        "String": "hello",
        "Number0": 0,
        "Number": 100,
        "Object": {},
        "Array": [],
        "NXObject": new nx.Object()
    };
    nx.each(map, function (value, key) {
        ok(counter.get(value) === 0, "Initial count correct for " + key);
        counter.set(value, 100);
        ok(counter.get(value) === 100, "Set count correct for " + key);
        counter.set(value, -100);
        ok(counter.get(value) === -100, "Set negative count correct for " + key);
        counter.increase(value);
        ok(counter.get(value) === -99, "Increase count correct for " + key);
        counter.increase(value, 0);
        ok(counter.get(value) === -99, "Increase count 0 correct for " + key);
        counter.increase(value, 100);
        ok(counter.get(value) === 1, "Increase count 100 correct for " + key);
        counter.decrease(value);
        ok(counter.get(value) === 0, "Decrease count correct for " + key);
        counter.decrease(value, 0);
        ok(counter.get(value) === 0, "Decrease count 0 correct for " + key);
        counter.decrease(value, 100);
        ok(counter.get(value) === -100, "Decrease count 100 correct for " + key);
    });
});
