/**
 * Create a random UUID.
 *
 * @method uuid
 * @return {String} A UUID.
 */
nx.uuid = (function () {
    var last;
    var uuid = function (serial) {
        var i = 12;
        // check if it's asked to serialize
        if (serial && last) {
            var i, p = last.length - 1;
            for (i = 0; i < 12; i++) {
                last[p - i]++;
                if (last[p - i] < 16) {
                    break;
                }
                last[p - i] = 0;
            }
        }
        // check if not asked to serial or serial fail
        if (i < 12) {
            i = 0;
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                return last[i++].toString(16);
            }).toUpperCase();
        } else {
            last = [];
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                last.push(v);
                return v.toString(16);
            }).toUpperCase();
        }
    };
    uuid.serial = function () {
        return uuid(true);
    };
    return uuid;
})();
