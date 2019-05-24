(function (nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("devme.check.Page", nx.ui.Element, {
        view: {
            cssclass: "glance-check-page"
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-check-page": {
                }
            })
        }
    });
})(nx);
