(function(nx) {

    nx.path(nx.global, "sanvy.benchmark", (function() {
        var framesize = 5000;
        var intervals = [];
        var free = 0;
        var wasted = 0;
        var ellapsed = 0;
        var count = 0;
        var archieves = new nx.Map();
        var benchmark = function(procedure) {
            var archieve, interval = {};
            interval.start = nx.date.now();
            procedure(function(mark) {
                interval.mark = mark;
            });
            !Object.hasOwnProperty.call(interval, "mark") && (interval.mark = undefined);
            interval.end = nx.date.now();
            // archieve
            while (intervals.length > 1 && interval.end - intervals[0].end > framesize) {
                archieve = archieves.get(intervals[0].mark) || archieves.set(intervals[0].mark, {});
                archieve.count = (archieve.count || 0) + 1;
                archieve.ellapsed = (archieve.ellapsed || 0) + (intervals[0].end - intervals[0].start);
                ellapsed += archieve.ellapsed;
                free += intervals[1].start - intervals[0].end - intervals[0].wasted;
                wasted += intervals[0].wasted;
                count += 1;
                intervals.shift();
            }
            interval.wasted = nx.date.now() - interval.end;
            intervals.push(interval);
        };
        benchmark.log = function(showTotal, withWasted) {
            var logellapsed = showTotal ? ellapsed : 0;
            var logfree = showTotal ? free : 0;
            var logwasted = showTotal ? wasted : 0;
            var logcount = intervals.length + (showTotal ? count : 0);
            var i, interval, archieve, logarchieves;
            logarchieves = new nx.Map();
            // copy archieves
            if (showTotal) {
                nx.each(archieves, function(value, key) {
                    var archieve = {};
                    archieve.count = value.count;
                    archieve.ellapsed = value.ellapsed;
                    logarchieves.set(key, archieve);
                });
            }
            // archieve frame
            for (i = 0; i < intervals.length; i++) {
                interval = intervals[i];
                // archieve frame
                archieve = logarchieves.get(interval.mark) || logarchieves.set(interval.mark, {});
                archieve.count = (archieve.count || 0) + 1;
                archieve.ellapsed = (archieve.ellapsed || 0) + (interval.end - interval.start);
                // wasted and free
                logellapsed += archieve.ellapsed;
                logwasted += interval.wasted;
                if (intervals[i + 1]) {
                    logfree += intervals[i + 1].start - interval.end - interval.wasted;
                }
            }
            if (withWasted) {
                logfree += logwasted;
            }
            // show log
            console.log("Total:", logcount, ";", "Usage: ", Math.floor(logellapsed * 1000 / (logellapsed + logfree)) / 10 + "%");
            nx.each(logarchieves, function(value, key) {
                console.log("[", Math.floor(value.ellapsed * 1000 / (logellapsed + logfree)) / 10 + "%", "][", value.count, "/", logcount, "]", key)
            });
        };
        return benchmark;
    })());

})(nx);
