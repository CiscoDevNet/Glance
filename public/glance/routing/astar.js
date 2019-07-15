/**
 * Created by tingxin on 5/19/15.
 */
/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed. Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths,
 *     in order to speed up the search.
 */
function AStarFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
    this.diagonalMovement = opt.diagonalMovement;

    if (!this.diagonalMovement) {
        if (!this.allowDiagonal) {
            this.diagonalMovement = DiagonalMovement.Never;
        } else {
            if (this.dontCrossCorners) {
                this.diagonalMovement = DiagonalMovement.OnlyWhenNoObstacles;
            } else {
                this.diagonalMovement = DiagonalMovement.IfAtMostOneObstacle;
            }
        }
    }

    //When diagonal movement is allowed the manhattan heuristic is not admissible
    //It should be octile instead
    if (this.diagonalMovement === DiagonalMovement.Never) {
        this.heuristic = opt.heuristic || Heuristic.manhattan;
    } else {
        this.heuristic = opt.heuristic || Heuristic.octile;
    }
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
AStarFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var openList = new Heap(function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        }),
        startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        heuristic = this.heuristic,
        diagonalMovement = this.diagonalMovement,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, ng;

    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        node = openList.pop();
        node.closed = true;

        // if reached the end position, construct the path and return it
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        // get neigbours of the current node
        neighbors = grid.getNeighbors(node, diagonalMovement);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endX), abs(y - endY));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    openList.push(neighbor);
                    neighbor.opened = true;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    openList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

//----------------------------------------------------------------------------------------------------------------------
var DiagonalMovement = {
    Always: 1,
    Never: 2,
    IfAtMostOneObstacle: 3,
    OnlyWhenNoObstacles: 4
};

//----------------------------------------------------------------------------------------------------------------------
function Node(x, y, walkable) {
    /**
     * The x coordinate of the node on the grid.
     * @type number
     */
    this.x = x;
    /**
     * The y coordinate of the node on the grid.
     * @type number
     */
    this.y = y;
    /**
     * Whether this node can be walked through.
     * @type boolean
     */
    this.walkable = (walkable === undefined ? true : walkable);
}
//----------------------------------------------------------------------------------------------------------------------
var Util={

    /**
     * Backtrace according to the parent records and return the path.
     * (including both start and end nodes)
     * @param {Node} node End node
     * @return {Array.<Array.<number>>} the path
     */
    backtrace:function (node) {
        var path = [[node.x, node.y]];
        while (node.parent) {
            node = node.parent;
            path.push([node.x, node.y]);
        }
        return path.reverse();
    },

    /**
     * Backtrace from start and end node, and return the path.
     * (including both start and end nodes)
     * @param {Node}
     * @param {Node}
     */
    biBacktrace:function (nodeA, nodeB) {
        var pathA = backtrace(nodeA),
            pathB = backtrace(nodeB);
        return pathA.concat(pathB.reverse());
    },

    /**
     * Compute the length of the path.
     * @param {Array.<Array.<number>>} path The path
     * @return {number} The length of the path
     */
    pathLength:function (path) {
        var i, sum = 0, a, b, dx, dy;
        for (i = 1; i < path.length; ++i) {
            a = path[i - 1];
            b = path[i];
            dx = a[0] - b[0];
            dy = a[1] - b[1];
            sum += Math.sqrt(dx * dx + dy * dy);
        }
        return sum;
    },


    /**
     * Given the start and end coordinates, return all the coordinates lying
     * on the line formed by these coordinates, based on Bresenham's algorithm.
     * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm#Simplification
     * @param {number} x0 Start x coordinate
     * @param {number} y0 Start y coordinate
     * @param {number} x1 End x coordinate
     * @param {number} y1 End y coordinate
     * @return {Array.<Array.<number>>} The coordinates on the line
     */
    interpolate:function (x0, y0, x1, y1) {
        var abs = Math.abs,
            line = [],
            sx, sy, dx, dy, err, e2;

        dx = abs(x1 - x0);
        dy = abs(y1 - y0);

        sx = (x0 < x1) ? 1 : -1;
        sy = (y0 < y1) ? 1 : -1;

        err = dx - dy;

        while (true) {
            line.push([x0, y0]);

            if (x0 === x1 && y0 === y1) {
                break;
            }

            e2 = 2 * err;
            if (e2 > -dy) {
                err = err - dy;
                x0 = x0 + sx;
            }
            if (e2 < dx) {
                err = err + dx;
                y0 = y0 + sy;
            }
        }

        return line;
    },

    /**
     * Given a compressed path, return a new path that has all the segments
     * in it interpolated.
     * @param {Array.<Array.<number>>} path The path
     * @return {Array.<Array.<number>>} expanded path
     */
    expandPath:function (path) {
        var expanded = [],
            len = path.length,
            coord0, coord1,
            interpolated,
            interpolatedLen,
            i, j;

        if (len < 2) {
            return expanded;
        }

        for (i = 0; i < len - 1; ++i) {
            coord0 = path[i];
            coord1 = path[i + 1];

            interpolated = interpolate(coord0[0], coord0[1], coord1[0], coord1[1]);
            interpolatedLen = interpolated.length;
            for (j = 0; j < interpolatedLen - 1; ++j) {
                expanded.push(interpolated[j]);
            }
        }
        expanded.push(path[len - 1]);

        return expanded;
    },


    /**
     * Smoothen the give path.
     * The original path will not be modified; a new path will be returned.
     * @param {PF.Grid} grid
     * @param {Array.<Array.<number>>} path The path
     */
    smoothenPath:function(grid, path) {
        var len = path.length,
            x0 = path[0][0],        // path start x
            y0 = path[0][1],        // path start y
            x1 = path[len - 1][0],  // path end x
            y1 = path[len - 1][1],  // path end y
            sx, sy,                 // current start coordinate
            ex, ey,                 // current end coordinate
            newPath,
            i, j, coord, line, testCoord, blocked;

        sx = x0;
        sy = y0;
        newPath = [[sx, sy]];

        for (i = 2; i < len; ++i) {
            coord = path[i];
            ex = coord[0];
            ey = coord[1];
            line = interpolate(sx, sy, ex, ey);

            blocked = false;
            for (j = 1; j < line.length; ++j) {
                testCoord = line[j];

                if (!grid.isWalkableAt(testCoord[0], testCoord[1])) {
                    blocked = true;
                    break;
                }
            }
            if (blocked) {
                lastValidCoord = path[i - 1];
                newPath.push(lastValidCoord);
                sx = lastValidCoord[0];
                sy = lastValidCoord[1];
            }
        }
        newPath.push([x1, y1]);

        return newPath;
    },

    /**
     * Compress a path, remove redundant nodes without altering the shape
     * The original path is not modified
     * @param {Array.<Array.<number>>} path The path
     * @return {Array.<Array.<number>>} The compressed path
     */
    compressPathF:function (path) {

        // nothing to compress
        if(path.length < 3) {
            return path;
        }

        var compressed = [],
            sx = path[0][0], // start x
            sy = path[0][1], // start y
            px = path[1][0], // second point x
            py = path[1][1], // second point y
            dx = px - sx, // direction between the two points
            dy = py - sy, // direction between the two points
            lx, ly,
            ldx, ldy,
            sq, i;

        // normalize the direction
        sq = Math.sqrt(dx*dx + dy*dy);
        dx /= sq;
        dy /= sq;

        // start the new path
        compressed.push([sx,sy]);

        for(i = 2; i < path.length; i++) {

            // store the last point
            lx = px;
            ly = py;

            // store the last direction
            ldx = dx;
            ldy = dy;

            // next point
            px = path[i][0];
            py = path[i][1];

            // next direction
            dx = px - lx;
            dy = py - ly;

            // normalize
            sq = Math.sqrt(dx*dx + dy*dy);
            dx /= sq;
            dy /= sq;

            // if the direction has changed, store the point
            if ( dx !== ldx || dy !== ldy ) {
                compressed.push([lx,ly]);
            }
        }

        // store the last point
        compressed.push([px,py]);

        return compressed;
    }
};


//----------------------------------------------------------------------------------------------------------------------
/**
 * @namespace PF.Heuristic
 * @description A collection of heuristic functions.
 */
var Heuristic = {

    /**
     * Manhattan distance.
     * @param {number} dx - Difference in x.
     * @param {number} dy - Difference in y.
     * @return {number} dx + dy
     */
    manhattan: function(dx, dy) {
        return dx + dy;
    },

    /**
     * Euclidean distance.
     * @param {number} dx - Difference in x.
     * @param {number} dy - Difference in y.
     * @return {number} sqrt(dx * dx + dy * dy)
     */
    euclidean: function(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Octile distance.
     * @param {number} dx - Difference in x.
     * @param {number} dy - Difference in y.
     * @return {number} sqrt(dx * dx + dy * dy) for grids
     */
    octile: function(dx, dy) {
        var F = Math.SQRT2 - 1;
        return (dx < dy) ? F * dx + dy : F * dy + dx;
    },

    /**
     * Chebyshev distance.
     * @param {number} dx - Difference in x.
     * @param {number} dy - Difference in y.
     * @return {number} max(dx, dy)
     */
    chebyshev: function(dx, dy) {
        return Math.max(dx, dy);
    }

};
//----------------------------------------------------------------------------------------------------------------------
// Generated by CoffeeScript 1.8.0
var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

floor = Math.floor, min = Math.min;


/*
 Default comparison function to be used
 */

defaultCmp = function(x, y) {
    if (x < y) {
        return -1;
    }
    if (x > y) {
        return 1;
    }
    return 0;
};


/*
 Insert item x in list a, and keep it sorted assuming a is sorted.

 If x is already in a, insert it to the right of the rightmost x.

 Optional args lo (default 0) and hi (default a.length) bound the slice
 of a to be searched.
 */

insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
        lo = 0;
    }
    if (cmp == null) {
        cmp = defaultCmp;
    }
    if (lo < 0) {
        throw new Error('lo must be non-negative');
    }
    if (hi == null) {
        hi = a.length;
    }
    while (lo < hi) {
        mid = floor((lo + hi) / 2);
        if (cmp(x, a[mid]) < 0) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
};


/*
 Push item onto heap, maintaining the heap invariant.
 */

heappush = function(array, item, cmp) {
    if (cmp == null) {
        cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
};


/*
 Pop the smallest item off the heap, maintaining the heap invariant.
 */

heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
        returnitem = array[0];
        array[0] = lastelt;
        _siftup(array, 0, cmp);
    } else {
        returnitem = lastelt;
    }
    return returnitem;
};


/*
 Pop and return the current smallest value, and add the new item.

 This is more efficient than heappop() followed by heappush(), and can be
 more appropriate when using a fixed size heap. Note that the value
 returned may be larger than item! That constrains reasonable use of
 this routine unless written as part of a conditional replacement:
 if item > array[0]
 item = heapreplace(array, item)
 */

heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
};


/*
 Fast version of a heappush followed by a heappop.
 */

heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
        _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
        _siftup(array, 0, cmp);
    }
    return item;
};


/*
 Transform list into a heap, in-place, in O(array.length) time.
 */

heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    _ref1 = (function() {
        _results1 = [];
        for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
        return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        i = _ref1[_i];
        _results.push(_siftup(array, i, cmp));
    }
    return _results;
};


/*
 Update the position of the given item in the heap.
 This function should be called every time the item is being modified.
 */

updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
        return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
};


/*
 Find the n largest elements in a dataset.
 */

nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
        return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
};


/*
 Find the n smallest elements in a dataset.
 */

nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
        result = array.slice(0, n).sort(cmp);
        if (!result.length) {
            return result;
        }
        los = result[result.length - 1];
        _ref = array.slice(n);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elem = _ref[_i];
            if (cmp(elem, los) < 0) {
                insort(result, elem, 0, null, cmp);
                result.pop();
                los = result[result.length - 1];
            }
        }
        return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
        _results.push(heappop(array, cmp));
    }
    return _results;
};

_siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
        parentpos = (pos - 1) >> 1;
        parent = array[parentpos];
        if (cmp(newitem, parent) < 0) {
            array[pos] = parent;
            pos = parentpos;
            continue;
        }
        break;
    }
    return array[pos] = newitem;
};

_siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
        cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
        rightpos = childpos + 1;
        if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
            childpos = rightpos;
        }
        array[pos] = array[childpos];
        pos = childpos;
        childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
};

Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
        this.cmp = cmp != null ? cmp : defaultCmp;
        this.nodes = [];
    }

    Heap.prototype.push = function(x) {
        return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
        return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
        return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
        return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
        return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
        return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
        return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
        return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
        return this.nodes = [];
    };

    Heap.prototype.empty = function() {
        return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
        return this.nodes.length;
    };

    Heap.prototype.clone = function() {
        var heap;
        heap = new Heap();
        heap.nodes = this.nodes.slice(0);
        return heap;
    };

    Heap.prototype.toArray = function() {
        return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

})();



//----------------------------------------------------------------------------------------------------------------------
/**
 * The Grid class, which serves as the encapsulation of the layout of the nodes.
 * @constructor
 * @param {number|Array.<Array.<(number|boolean)>>} width_or_matrix Number of columns of the grid, or matrix
 * @param {number} height Number of rows of the grid.
 * @param {Array.<Array.<(number|boolean)>>} [matrix] - A 0-1 matrix
 *     representing the walkable status of the nodes(0 or false for walkable).
 *     If the matrix is not supplied, all the nodes will be walkable.  */
function Grid(width_or_matrix, height, matrix) {
    var width;

    if (typeof width_or_matrix !== 'object') {
        width = width_or_matrix;
    } else {
        height = width_or_matrix.length;
        width = width_or_matrix[0].length;
        matrix = width_or_matrix;
    }

    /**
     * The number of columns of the grid.
     * @type number
     */
    this.width = width;
    /**
     * The number of rows of the grid.
     * @type number
     */
    this.height = height;

    /**
     * A 2D array of nodes.
     */
    this.nodes = this._buildNodes(width, height, matrix);
}

/**
 * Build and return the nodes.
 * @private
 * @param {number} width
 * @param {number} height
 * @param {Array.<Array.<number|boolean>>} [matrix] - A 0-1 matrix representing
 *     the walkable status of the nodes.
 * @see Grid
 */
Grid.prototype._buildNodes = function(width, height, matrix) {
    var i, j,
        nodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        nodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            nodes[i][j] = new Node(j, i);
        }
    }


    if (matrix === undefined) {
        return nodes;
    }

    if (matrix.length !== height || matrix[0].length !== width) {
        throw new Error('Matrix size does not fit');
    }

    for (i = 0; i < height; ++i) {
        for (j = 0; j < width; ++j) {
            if (matrix[i][j]) {
                // 0, false, null will be walkable
                // while others will be un-walkable
                nodes[i][j].walkable = false;
            }
        }
    }

    return nodes;
};


Grid.prototype.getNodeAt = function(x, y) {
    return this.nodes[y][x];
};


/**
 * Determine whether the node at the given position is walkable.
 * (Also returns false if the position is outside the grid.)
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @return {boolean} - The walkability of the node.
 */
Grid.prototype.isWalkableAt = function(x, y) {
    return this.isInside(x, y) && this.nodes[y][x].walkable;
};


/**
 * Determine whether the position is inside the grid.
 * XXX: `grid.isInside(x, y)` is wierd to read.
 * It should be `(x, y) is inside grid`, but I failed to find a better
 * name for this method.
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
Grid.prototype.isInside = function(x, y) {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
};


/**
 * Set whether the node on the given position is walkable.
 * NOTE: throws exception if the coordinate is not inside the grid.
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @param {boolean} walkable - Whether the position is walkable.
 */
Grid.prototype.setWalkableAt = function(x, y, walkable) {
    this.nodes[y][x].walkable = walkable;
};


/**
 * Get the neighbors of the given node.
 *
 *     offsets      diagonalOffsets:
 *  +---+---+---+    +---+---+---+
 *  |   | 0 |   |    | 0 |   | 1 |
 *  +---+---+---+    +---+---+---+
 *  | 3 |   | 1 |    |   |   |   |
 *  +---+---+---+    +---+---+---+
 *  |   | 2 |   |    | 3 |   | 2 |
 *  +---+---+---+    +---+---+---+
 *
 *  When allowDiagonal is true, if offsets[i] is valid, then
 *  diagonalOffsets[i] and
 *  diagonalOffsets[(i + 1) % 4] is valid.
 * @param {Node} node
 * @param {DiagonalMovement} diagonalMovement
 */
Grid.prototype.getNeighbors = function(node, diagonalMovement) {
    var x = node.x,
        y = node.y,
        neighbors = [],
        s0 = false, d0 = false,
        s1 = false, d1 = false,
        s2 = false, d2 = false,
        s3 = false, d3 = false,
        nodes = this.nodes;

    // ↑
    if (this.isWalkableAt(x, y - 1)) {
        neighbors.push(nodes[y - 1][x]);
        s0 = true;
    }
    // →
    if (this.isWalkableAt(x + 1, y)) {
        neighbors.push(nodes[y][x + 1]);
        s1 = true;
    }
    // ↓
    if (this.isWalkableAt(x, y + 1)) {
        neighbors.push(nodes[y + 1][x]);
        s2 = true;
    }
    // ←
    if (this.isWalkableAt(x - 1, y)) {
        neighbors.push(nodes[y][x - 1]);
        s3 = true;
    }

    if (diagonalMovement === DiagonalMovement.Never) {
        return neighbors;
    }

    if (diagonalMovement === DiagonalMovement.OnlyWhenNoObstacles) {
        d0 = s3 && s0;
        d1 = s0 && s1;
        d2 = s1 && s2;
        d3 = s2 && s3;
    } else if (diagonalMovement === DiagonalMovement.IfAtMostOneObstacle) {
        d0 = s3 || s0;
        d1 = s0 || s1;
        d2 = s1 || s2;
        d3 = s2 || s3;
    } else if (diagonalMovement === DiagonalMovement.Always) {
        d0 = true;
        d1 = true;
        d2 = true;
        d3 = true;
    } else {
        throw new Error('Incorrect value of diagonalMovement');
    }

    // ↖
    if (d0 && this.isWalkableAt(x - 1, y - 1)) {
        neighbors.push(nodes[y - 1][x - 1]);
    }
    // ↗
    if (d1 && this.isWalkableAt(x + 1, y - 1)) {
        neighbors.push(nodes[y - 1][x + 1]);
    }
    // ↘
    if (d2 && this.isWalkableAt(x + 1, y + 1)) {
        neighbors.push(nodes[y + 1][x + 1]);
    }
    // ↙
    if (d3 && this.isWalkableAt(x - 1, y + 1)) {
        neighbors.push(nodes[y + 1][x - 1]);
    }

    return neighbors;
};


/**
 * Get a clone of this grid.
 * @return {Grid} Cloned grid.
 */
Grid.prototype.clone = function() {
    var i, j,

        width = this.width,
        height = this.height,
        thisNodes = this.nodes,

        newGrid = new Grid(width, height),
        newNodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        newNodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            newNodes[i][j] = new Node(j, i, thisNodes[i][j].walkable);
        }
    }

    newGrid.nodes = newNodes;

    return newGrid;
};
