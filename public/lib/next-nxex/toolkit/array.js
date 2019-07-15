(function (nx, ui, toolkit, global) {
    var EXPORT = nx.path(toolkit, "array", {
        mapcar: function (f, arr) {
            var i;
            for (i = 0; i < arr.length; i++) {
                f(arr[i]);
            }
            return arr;
        },
        max: function (arr) {
            var i, max = arr[0];
            for (i = 1; i < arr.length; i++) {
                if (max < arr[i]) {
                    max = arr[i];
                }
            }
            return max;
        },
        min: function (arr) {
            var i, min = arr[0];
            for (i = 1; i < arr.length; i++) {
                if (min > arr[i]) {
                    min = arr[i];
                }
            }
            return min;
        },
        keylist: function (arr) {
            var rslt = [];
            for ( var key in arr) {
                rslt.push(key);
            }
            return rslt;
        },
        contain: function (arr, o) {
            return EXPORT.find(arr, o) >= 0;
        },
        find: function (arr, o) {
            for ( var i = 0; i < arr.length; i++) {
                if (o === arr[i]) {
                    return i;
                }
            }
            return -1;
        },
        unit: function (arr, o) {
            if (EXPORT.find(arr, o) == -1) {
                arr.push(o);
                return 1;
            }
            return 0;
        },
        elicit: function (arr, o) {
            var idx, count = 0;
            while ((idx = EXPORT.find(arr, o)) != -1) {
                arr.splice(idx, 1);
                count--;
            }
            return count;
        },
        union: function (a1, a2) {
            var i, rslt = a1.slice();
            for (i = 0; i < a2.length; i++) {
                if (EXPORT.find(rslt, a2[i]) == -1) {
                    rslt.push(a2[i]);
                }
            }
            return rslt;
        },
        diff: function (al, ar) {
            // TODO better result with "move"
            var diff = [], ac = EXPORT.cross(al, ar, "max");
            var il = 0, ic = 0, ir = 0, ll = al.length, lc = ac.length, lr = ar.length, removal, addition;
            for (il = 0, ic = 0, ir = 0, ll = al.length, lc = ac.length, lr = ar.length; il < ll || ic < lc || ir < lr; il++, ic++, ir++) {
                // get removals
                while (il < ll && al[il] !== ac[ic]) {
                    diff.push({
                        action: "remove",
                        position: ir
                    });
                    il++;
                }
                // get additions
                while (ir < lr && ac[ic] !== ar[ir]) {
                    diff.push({
                        action: "add",
                        position: ir,
                        object: ar[ir]
                    });
                    ir++;
                }
            }
            return diff;
        },
        cross: function cross (arr0, arr1, optimize) {
            var eqi, recurse;
            eqi = function (a0, a1) {
                var i0, i1, l0 = a0.length, l1 = a1.length;
                // find the cross
                for (i0 = 0, i1 = 0; i0 < l0; i0++) {
                    for (i1 = 0; i1 < l1; i1++) {
                        if (a0[i0] === a1[i1]) {
                            return {
                                i0: i0,
                                i1: i1,
                                value: a0[i0]
                            };
                        }
                    }
                }
                return null;
            };
            recurse = function (source, target) {
                var eqi0 = eqi(source, target), eqi1 = eqi(target, source), cross = [[]];
                if (eqi0) {
                    cross = EXPORT.mapcar(function (arr) {
                        arr.unshift(eqi0.value);
                    }, recurse(source.slice(eqi0.i0 + 1), target.slice(eqi0.i1 + 1)));
                    if (eqi0.i0 !== eqi1.i1) {
                        cross = cross.concat(EXPORT.mapcar(function (arr) {
                            arr.unshift(eqi1.value);
                        }, recurse(target.slice(eqi1.i0 + 1), source.slice(eqi1.i1 + 1))));
                    }
                }
                switch (optimize) {
                    case "max":
                        cross = [toolkit.query({
                            array: cross,
                            orderby: "length desc"
                        })[0]];
                        break;
                    case "min":
                        cross = [toolkit.query({
                            array: cross,
                            orderby: "length"
                        })[0]];
                        break;
                    default:
                        break;
                }
                return cross;
            };
            var crosses = recurse(arr0, arr1);
            if (optimize == "max" || optimize == "min") {
                return crosses[0];
            }
            return crosses;
        }
    });
})(nx, nx.ui, nxex.toolkit, window);
