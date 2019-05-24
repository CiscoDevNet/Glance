/**
 * Created by tingxin on 5/19/15.
 */
onmessage = function (param) {
    importScripts('astar.js');
    var start = param.data.startPoint;
    var end = param.data.endPoint;
    var map = param.data.map;
    var width = map[0].length;
    var height = map.length;

    var grid = new Grid(width, height);

    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            if (map[i][j] == 1) {
                grid.setWalkableAt(j, i, true);
            } else {
                grid.setWalkableAt(j, i, false);
            }
        }
    }


    var finder = new AStarFinder({
        allowDiagonal: true,
        dontCrossCorners: true,
        heuristic: Heuristic.octile,
        weight: 1
    });

    var result = finder.findPath(start[0], start[1], end[0], end[1], grid);
    postMessage(result);
};
