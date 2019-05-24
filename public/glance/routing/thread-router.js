importScripts('astar.js');

var instance = {
    map: null,
    grid: null,
    postponedMessages: [],
    init: function(map) {
        instance.map = map;
        instance.width = map[0].length;
        instance.height = map.length;
        instance.grid = (function() {
	    var map = instance.map;
            var width = instance.width;
            var height = instance.height;
            var grid = new Grid(width, height);
            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    grid.setWalkableAt(j, i, map[i][j] === 1);
                }
            }
            return grid;
        })();
        instance.astar = new AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true,
            heuristic: Heuristic.octile,
            weight: 1
        });
        if (map) {
            var message;
            while (instance.postponedMessages.length) {
                message = instance.postponedMessages.shift();
                instance.onmessage(message);
            }
        }
    },
    limited: function(point) {
        return [
            Math.max(0, Math.min(instance.width - 1, point[0])),
            Math.max(0, Math.min(instance.height - 1, point[1]))
        ];
    },
    settle: function(point) {
        var map = instance.map;
        var point = instance.limited(point);
        if (map[point[1]][point[0]] != 0) {
            return point;
        } else {
            var row = map.length;
            var interval = 5;
            var lastStep = 5;
            while (lastStep < row) {
                var startX = point[0] - lastStep;
                var endX = point[0] + lastStep;
                while (startX <= endX) {
                    var baseP = Math.round(Math.sqrt(lastStep * lastStep - (startX - point[0]) * (startX - point[0])));
                    var startY1 = point[1] + baseP;
                    var testPoint = instance.limited([startX, startY1]);
                    try {
                        if (map[testPoint[1]][testPoint[0]] != 0)
                            return testPoint;
                    } catch (ex) {
                        console.warn("point is (" + testPoint[0] + "," + testPoint[1] + ")");
                    }
                    var startY2 = point[1] - baseP;
                    var testPoint2 = instance.limited([startX, startY2]);
                    try {
                        if (map[testPoint2[1]][testPoint2[0]] != 0)
                            return testPoint2;
                    } catch (ex) {
                        console.warn("point is (" + testPoint2[0] + "," + testPoint2[1] + ")");
                    }
                    startX += 1;
                }
                lastStep = lastStep + interval;
            }
            return null;
        }
    },
    onmessage: function(message) {
        if (message.type === "init") {
            instance.init(message.map);
        } else if (!instance.map) {
            instance.postponedMessages = instance.postponedMessages || [];
            instance.postponedMessages.push(message);
        } else {
            var result, source, target;
            switch (message.type) {
                case "settle":
                    result = instance.settle(message.point);
                    postMessage({
                        id: message.id,
                        point: result || [0, 0]
                    });
                    break;
                case "route":
                    source = instance.settle(message.source);
                    target = instance.settle(message.target);
                    result = instance.astar.findPath(source[0], source[1], target[0], target[1], instance.grid.clone());
                    postMessage({
                        id: message.id,
                        route: result
                    });
                    break;
            }
        }
    }
};

onmessage = function(evt) {//
    instance.onmessage(evt.data);
};
