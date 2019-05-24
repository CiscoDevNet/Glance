module("oop");

test("oop static", function() {
    var instance = nx.define("path.to.MyClass", {
        static: true,
        properties: {
            prop: "prop"
        }
    });
    equal(instance.prop(), "prop", "initialized");
});

test("oop statics", function() {
    var Class = nx.define({
        statics: {
            CONST: "const",
            func: function() {
                ok(true, "static function");
            }
        }
    });
    expect(2);
    Class.func();
    equal(Class.CONST, "const", "static constant");
});

test("oop methods", function() {
    var Class = nx.define({
        methods: {
            func: function(arg) {
                equal(arg, 100, "normal function");
            }
        }
    });
    var instance = new Class(200);
    expect(1);
    instance.func(100);
});

test("oop properties immediate", function() {
    var Class = nx.define({
        properties: {
            propa: "propa",
            propb: {
                value: "propb"
            }
        }
    });
    var instance = new Class();
    equal(instance.propa(), "propa", "property immediate");
    equal(instance.propb(), "propb", "property immediate value");
    instance.propa("pa");
    instance.propb("pb");
    equal(instance.propa(), "pa", "property change");
    equal(instance.propb(), "pb", "property change");
});

test("oop properties get/set", function() {
    var Class = nx.define({
        properties: {
            val: 10,
            sqr: {
                get: function() {
                    return this._val * this._val;
                },
                set: function(sqr) {
                    this._val = Math.sqrt(sqr);
                }
            }
        }
    });
    var instance = new Class();
    equal(instance.sqr(), 100, "property init getter");
    instance.val(20);
    equal(instance.sqr(), 400, "property getter");
    instance.sqr(64);
    equal(instance.val(), 8, "property setter");
    equal(instance.sqr(), 64, "property getter again");
});

test("oop properties factory", function() {
    var Class = nx.define({
        properties: {
            propa: function() {
                return "propa";
            },
            propb: {
                value: function() {
                    return "propb";
                }
            }
        }
    });
    var instance = new Class();
    equal(instance.propa(), "propa", "property factory");
    equal(instance.propb(), "propb", "property factory value");
    instance.propa("pa");
    instance.propb("pb");
    equal(instance.propa(), "pa", "property change");
    equal(instance.propb(), "pb", "property change");
});

test("oop properties dependencies", function() {
    var Class = nx.define({
        properties: {
            prefix: "prop",
            propa: {
                dependencies: ["prefix"],
                value: function(prefix) {
                    return prefix + "a";
                }
            },
            propb: {
                async: true,
                dependencies: "prefix, propa",
                value: function(operator, prefix, propa) {
                    operator.set(prefix + String.fromCharCode(propa.charCodeAt(prefix.length) + 1));
                }
            }
        }
    });
    var instance = new Class();
    equal(instance.propa(), "propa", "property initial binding");
    equal(instance.propb(), "propb", "property value initial binding");
    instance.prefix("p");
    equal(instance.propa(), "pa", "property binding");
    equal(instance.propb(), "pb", "property value binding");
});

test("oop properties binding", function() {
    var Class = nx.define({
        properties: {
            prefix: "prop",
            propa: nx.binding("prefix", function(prefix) {
                return prefix + "a";
            }),
            propb: {
                value: nx.binding("prefix, propa", true, function(operator, prefix, propa) {
                    operator.set(prefix + String.fromCharCode(propa.charCodeAt(prefix.length) + 1));
                })
            }
        }
    });
    var instance = new Class();
    equal(instance.propa(), "propa", "property initial binding");
    equal(instance.propb(), "propb", "property value initial binding");
    instance.prefix("p");
    equal(instance.propa(), "pa", "property binding");
    equal(instance.propb(), "pb", "property value binding");
});

test("oop properties binding recursive", function() {
    var Class = nx.define({
        properties: {
            givename: "Li",
            surname: "Kang",
            name: nx.binding("surname", function(surname) {
                return nx.binding("givename", function(givename) {
                    return [givename, surname].join(" ");
                });
            })
        }
    });
    var instance = new Class();
    equal(instance.name(), "Li Kang", "property initial binding recursive");
    instance.givename("Knly");
    equal(instance.name(), "Knly Kang", "property inner binding");
    instance.surname("Com");
    equal(instance.name(), "Knly Com", "property outer binding");
    instance.givename("Li");
    equal(instance.name(), "Li Com", "property inner binding again");
    instance.surname("Kang");
    equal(instance.name(), "Li Kang", "property outer binding again");
});

test("oop init", function() {
    var Class = nx.define({
        properties: {
            prop: "prop"
        },
        methods: {
            init: function(arg) {
                this.inherited();
                this.prop(arg);
                this.func(100);
            },
            func: function(arg) {
                equal(arg, 100, "normal function");
            }
        }
    });
    expect(2);
    var instance = new Class(200);
    equal(instance.prop(), 200, "init arg");
});

// passing this test is really a great improvement of performance, MUST BE DONE
nx.OPTIMIZED && test("oop optimize by bind order", function() {
    var order = [];
    var Class = nx.define({
        properties: {
            propc: {
                dependencies: "propa, propb",
                value: function(propa, propb) {
                    order.push("propc");
                    return propa + propb;
                }
            },
            propa: nx.binding("propb", function(propb) {
                order.push("propa");
                return propb + "1";
            }),
            propb: function() {
                order.push("propb");
                return "propb";
            }
        }
    });
    var instance = new Class();
    equal(order.join(","), "propb,propa,propc", "init order"); // make initial-order depends on dependencies-order
    order = [];
    instance.propb("trigger");
    equal(order.join(","), "propa,propc", "trigger order"); // do not notify 'propc' twice
});

test("inherit property", function() {
    var Super = nx.define({
        properties: {
            propa: true
        }
    });
    var Class = nx.define(Super, {
        properties: {
            propa: false
        }
    });
    var result, instance = new Class();
    result = instance.propa();
    equal(result, false, "inherited property");
});

test("inherit method", function() {
    var Super = nx.define({
        methods: {
            funca: function(a, b) {
                return a + b;
            },
            funcb: function(a, b) {
                return a * b;
            }
        }
    });
    var Class = nx.define(Super, {
        methods: {
            funca: function(a, b) {
                return "String:" + this.inherited(arguments);
            },
            funcb: function(a, b) {
                return "String:" + this.inherited(a, b);
            }
        }
    });
    var result, instance = new Class();
    result = instance.funca(1, 2);
    equal(result, "String:3", "inherited by arguments");
    result = instance.funcb(3, 4);
    equal(result, "String:12", "inherited by argument list");
});

nx.OPTIMIZED && test("inherit properties", function() {
    // TODO think about property inheritance
    ok(false, "TO BE DEFINED");
});

test("inherit init arg", function() {
    var Base = nx.define({
        methods: {
            init: function(a, b, c) {
                this.inherited();
                equal(a + b + c, "321", "init args");
            }
        }
    });
    var Super = nx.define(Base, {
        methods: {
            init: function(a, b, c) {
                this.inherited(c, b, a);
            }
        }
    });
    var Class = nx.define(Super, {
        methods: {
            init: function() {
                this.inherited(arguments);
            }
        }
    });
    expect(1);
    var instance = new Class("1", "2", "3");
});

test("inherit init order", function() {
    var order = [];
    var Base = nx.define({
        properties: {
            propa: function() {
                order.push("prop-base");
                return "propa";
            }
        },
        methods: {
            init: function() {
                this.inherited();
                order.push("init-base");
            }
        }
    });
    var Super = nx.define(Base, {
        properties: {
            propb: function() {
                order.push("prop-middle");
                return "propb";
            }
        }
    });
    var Class = nx.define(Super, {
        properties: {
            propc: function() {
                order.push("prop-child");
                return "propc";
            }
        },
        methods: {
            init: function() {
                this.inherited();
                order.push("init-child");
            }
        }
    });
    var instance = new Class();
    equal(order.join(","), "prop-base,init-base,prop-middle,prop-child,init-child", "init order");
});

test("inherit mixins properties", function() {
    var Base = nx.define({
        properties: {
            propa: "propa"
        }
    });
    var Super = nx.define(Base, {
        properties: {
            propb: "propb"
        }
    });
    var Class = nx.define({
        mixins: [Base, Super],
        properties: {
            propc: "propc"
        }
    });
    var instance = nx.define({
        static: true,
        mixins: Class
    });
    equal(instance.propa(), "propa", "mixin property");
    equal(instance.propb(), "propb", "mixin property");
    equal(instance.propc(), "propc", "mixin property");
});

test("inherit mixins methods", function() {
    var Base = nx.define({
        methods: {
            funca: function() {
                ok(true, "funca");
            }
        }
    });
    var Super = nx.define(Base, {
        methods: {
            funcb: function() {
                ok(true, "funcb");
            }
        }
    });
    var Class = nx.define({
        mixins: [Base, Super],
        methods: {
            funcc: function() {
                ok(true, "funcc");
            }
        }
    });
    var instance = nx.define({
        static: true,
        mixins: Class
    });
    expect(3);
    instance.funca();
    instance.funcb();
    instance.funcc();
});
