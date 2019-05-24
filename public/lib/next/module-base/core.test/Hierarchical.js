module("Hierarchical");

test("type via binding", function() {
    var ClassA = nx.define({});
    var ClassB = nx.define({});
    var Class = nx.define(nx.Hierarchical, {
        hierarchy: {
            content: {
                name: "child",
                type: "{childType}"
            }
        },
        properties: {
            childType: function() {
                return ClassA;
            }
        },
        methods: {
            init: function() {
                this.inherited();
                this.initHierarchy();
            },
            initHierarchy: function() {
                var instance = this;
                var clazz = instance.constructor;
                // get hierarchies' definitions of the whole inheritance
                instance.retain(instance.hierarchicalUpdate(clazz.__meta__.hierarchy, instance));
            }
        }
    });
    var object = new Class();
    ok(nx.is(object.child(), ClassA), "init correct");
    object.childType(ClassB);
    ok(nx.is(object.child(), ClassB), "binding correct");
});
