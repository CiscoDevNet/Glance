(function (nx) {
    var EXPORT = nx.define("glance.paging.Page", nx.ui.Element, {
        view: {
            cssclass: "glance-check-page"
        },
	properties: {
	    service: null
	},
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-check-page": {

                }
            })
        }
    });
})(nx);
