(function (nx) {
    var slice = Array.prototype.slice;
    nx.factory = function (Class, args) {
        args = nx.is(args, "Arguments") ? args : slice.call(arguments, 1);
        var create = function () {
            var instance = new Class(new nx.idle());
            Class.apply(instance, args);
            return instance;
        };
        // called as function
        if (!(this instanceof nx.factory)) {
            var factory = new nx.factory();
            nx.extend(factory, {
                class: Class,
                args: args,
                create: create
            });
            return factory;
        }
        // called as constructor
        if (arguments.length) {
            nx.extend(this, {
                class: Class,
                args: args,
                create: create
            });
        }
    };
})();
