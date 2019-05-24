var WatcherExample = nx.define(nxex.Observable, {
    properties: {
        goodExperience: {
            // will be notified on init
            watcher: function (propertyName, propertyValue) {
                alert("a changed: " + propertyValue);
            }
        },
        badExperience: null
    },
    methods: {
        init: function () {
            this.inherited();
            this.badExperienceWatchResource = this.watch("b", function (propertyName, propertyValue) {
                alert("b changed: " + propertyValue);
            });
            this.badExperienceWatchResource.affect();
        },
        dispose: function () {
            this.badExperienceWatchResource.release();
        }
    }
});
