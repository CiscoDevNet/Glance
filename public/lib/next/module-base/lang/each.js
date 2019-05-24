/**
 * Iterate over target and execute the callback with context.
 * @method each
 * @param target {Object|Array|Iterable} The target object to be iterate over.
 * @param callback {Function} The callback function to execute.
 * @param context {Object} The context object which act as 'this'.
 */
nx.each = function (target, callback, context) {
    /* jshint -W014 */
    var broken = false;
    if (target && callback) {
        if (target.__class__ && target.__each__) {
            broken = (false === target.__each__(callback, context));
        } else {
            // FIXME maybe some other array-like things missed here
            if (nx.is(target, "Array") // normal Array
                || Object.prototype.toString.call(target) === "[object Arguments]" // array-like: arguments
                || nx.global.NodeList && target instanceof NodeList // array-like: NodeList
                || nx.global.HTMLCollection && target instanceof HTMLCollection // array-like: HTMLCollection
            ) {
                for (var i = 0, length = target.length; i < length; i++) {
                    if (callback.call(context, target[i], i) === false) {
                        broken = true;
                        break;
                    }
                }
            } else {
                for (var key in target) {
                    if (target.hasOwnProperty(key)) {
                        if (callback.call(context, target[key], key) === false) {
                            broken = true;
                            break;
                        }
                    }
                }
            }
        }
    }
    return !broken;
};
