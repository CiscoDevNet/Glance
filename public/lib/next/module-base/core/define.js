(function(nx) {

    var global = nx.global;

    var apply_meta = function(Class, meta) {
        // resolve mixins if given by Class
        var mixins = meta.mixins;
        if (!nx.is(mixins, "Array")) {
            mixins = (typeof mixins === "function" ? [mixins] : []);
        }
        // apply each mixins
        var prototype = Class.prototype;
        nx.each(mixins, function(mixin) {
            if (prototype.__mixins__.indexOf(mixin) === -1) {
                prototype.__mixins__.push(mixin);
                apply_meta(Class, mixin.__meta__);
            }
        });
        // methods on prototype
        nx.each(meta.methods, function(method, name) {
            if (name !== "init") {
                // TODO forbid final methods, e.g. retain, release, on, fire, watch, notify, etc.
                nx.Object.extendMethod(prototype, name, method);
            }
        });
        // TODO order properties' initializers by dependencies
        nx.each(meta.properties, function(property, name) {
            var initializer = nx.Object.extendProperty(prototype, name, property);
            Class.__initializers__.push(initializer);
        });
    };

    /**
     * Define a class.
     * @method define
     * @param pathname {String}
     *  The target package name. Optional, default no package name.
     * @param parent {Function}
     *  The super class. Optional, default nx.Object.
     * @param meta {Object}
     *  The definition of the class
     * @return {Function|Object}
     *  The defined class or instance (if static).
     */
    function define(pathname, parent, meta) {
        var Class, classname;

        // optinalize arguments
        if (!meta) {
            if (!parent) {
                meta = pathname || {};
                parent = nx.Object;
                pathname = null;
            } else if (typeof pathname !== "string") {
                meta = parent;
                parent = pathname;
                pathname = null;
            } else {
                meta = parent;
                parent = nx.Object;
            }
        } else if (!parent) {
            // TODO report an error for undefined parent class
            parent = nx.Object;
        }

        // FIXME for capability
        if (meta && meta.static) {
            meta = nx.extend({}, meta);
            delete meta.static;
            return singleton(pathname, parent, meta);
        }

        // create class
        Class = function NXObject(sign) {
            // make sure it's "newing"
            if (!this instanceof arguments.callee) {
                return nx.factory(arguments.callee, arguments);
            }
            // ignore initialization if marked as idle
            if (sign instanceof nx.idle) {
                return;
            }
            // get the real arguments
            var args = arguments[0];
            if (Object.prototype.toString.call(args) !== "[object Arguments]") {
                args = arguments;
            }

            this.__initializing__ = true;

            // to prevent duplicated initialization, make a map of initialized types
            this.__type_initialized__ = {};
            this.__ctor__.apply(this, args);
            delete this.__type_initialized__;

            this.__initializing__ = false;
        };

        // if textual class name is asked, make Class to use correct class name, instead of unified NXObject
        if (nx.TEXTUAL) {
            classname = pathname ? pathname.split(".").pop() : "Anonymous";
            nx.define.cutpoint = nx.define.cutpoint || (function NXObject() {}).toString().indexOf("(");
            Class = eval(["(function ", classname, Class.toString().substring(nx.define.cutpoint), ")"].join(""));
        }

        var prototype, mixins, initializers, init, init_meta, init_super;
        mixins = (parent.__ctor_idle__ ? parent.__mixins__.slice() : []);
        mixins = nx.is(meta.mixins, "Array") ?
            mixins.concat(meta.mixins) :
            mixins.concat(typeof meta.mixins === "function" ? [meta.mixins] : []);
        initializers = parent.__ctor_idle__ ? parent.__initializers__.slice() : [];
        init_super = (parent.__ctor__ && parent.__ctor_idle__) ? parent.__ctor__.__super__ : parent.__ctor__;
        init_meta = init = meta.methods && meta.methods.init;
        // create init method if not exists
        if (!init) {
            init = function init() {
                this.inherited(arguments);
            };
        }
        // markup the init methods
        nx.extend(init, {
            __type__: "method",
            __name__: "init",
            __class__: Class,
            __super__: init_super
        });
        // makeup the prototype
        prototype = (function() {
            var Super = function() {};
            Super.prototype = parent.prototype;
            return new Super();
        })();
        nx.extend(prototype, {
            constructor: Class,
            __nx__: true,
            __class__: Class,
            __super__: parent,
            __ctor__: init,
            __properties__: nx.extend({}, prototype.__properties__),
            __methods__: nx.extend({}, prototype.__methods__),
            __mixins__: prototype.__mixins__.slice()
        });
        // markup the class
        nx.extend(Class, meta.statics);
        nx.extend(Class, {
            prototype: prototype,
            __nx__: true,
            __id__: nx.serial(),
            __meta__: meta,
            __super__: prototype.__super__,
            __ctor__: init,
            __ctor_idle__: !init_meta,
            __mixins__: mixins,
            __initializers__: initializers
        });
        // apply meta
        apply_meta(Class, meta);
        // update namespace
        if (pathname) {
            Class.__namespace__ = pathname;
            prototype.__namespace__ = pathname;
            nx.path(nx.global, pathname, Class);
        }
        // return the class
        return Class;
    }

    function singleton(pathname, parent, meta) {
        if (pathname && typeof pathname !== "string") {
            meta = parent;
            parent = pathname;
            pathname = null;
        }
        if (typeof parent !== "function") {
            meta = parent;
            parent = nx.Object;
        }
        var Class = define(parent, meta);
        var instance = new Class();
        if (pathname) {
            nx.path(nx.global, pathname, instance);
        }
        return instance;
    }

    nx.define = define;
    nx.singleton = singleton;

})(nx);
