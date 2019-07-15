if (!Function.prototype.bind) {
    Function.prototype.bind = function (context) {
        var f = this;
        return function () {
            return f.apply(context, arguments);
        };
    };
}

(function () {
    return;
    // FIXME socket.io cannot work with it
    Function.prototype.apply = (function () {
        var apply = Function.prototype.apply; // the native one
        return function apply(context, args) {
            if (!args) {
                return this.call(context);
            }
            switch (args.length) {
            case 0:
                return this.call(context);
            case 1:
                return this.call(context, args[0]);
            case 2:
                return this.call(context, args[0], args[1]);
            case 3:
                return this.call(context, args[0], args[1], args[2]);
            case 4:
                return this.call(context, args[0], args[1], args[2], args[3]);
            case 5:
                return this.call(context, args[0], args[1], args[2], args[3], args[4]);
            case 6:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5]);
            case 7:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            case 8:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
            case 9:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
            case 10:
                return this.call(context, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
            default:
                return apply.call(this, args);
            }
        };
    })();
})();

(function (nx) {
    var global = nx.global;
    var slice = Array.prototype.slice;
    nx.func = {
        apply: function (fn, ctx) {
            var len = arguments.length;
            var args = arguments[len - 1];
            if (!nx.is(args, "Array")) {
                if (args && args.length >= 0) {
                    args = slice.call(args);
                } else {
                    args = [];
                }
            }
            if (len > 3) {
                args = slice.call(arguments, 2, len - 1).concat(args);
            }
            return fn.apply(ctx, args);
        }
    };
})(nx);
