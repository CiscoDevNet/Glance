(function (nx) {
    var EXPORT = nx.define("glance.common.Expert", glance.common.Movable, {
        properties: {
            title: null,
            skills: null,
            email: null,
            phoneNumber: null,
            lastNotified: null,
            online: false,
            locating: false,
            avatarVersion: Date.now()
        }
    });
})(nx);
