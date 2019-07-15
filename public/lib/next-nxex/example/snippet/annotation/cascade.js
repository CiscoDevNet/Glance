var CascadeExample = nx.define(nxex.Observable, {
    properties: {
        id: "lkang2",
        firstName: "Knly",
        lastName: "Kang",
        fullName: {
            cascade: {
                source: "firstName, lastName",
                output: function (fn, ln) {
                    return [fn, ln].join(" ");
                }
            }
        },
        profile: {
            cascade: {
                source: "id",
                /*
                 * update: buggy version 
                 */
                update: function (id) {
                    $.ajax({
                        url: "http://server/of/profile/" + id,
                        success: function (data) {
                            this.profile(data);
                        }.bind(this)
                    });
                },
                /*
                 * update: complete version 
                 */
                update: function (id) {
                    var self = this;
                    // clear profile when id changed
                    self.profile(null);
                    // abort previous ajax
                    var ajax = this._profile_ajax;
                    ajax && ajax.abort();
                    // start new ajax
                    if (id) {
                        ajax = this._profile_ajax = $.ajax({
                            url: "http://server/of/profile/" + id,
                            success: function (data) {
                                self.profile(data);
                            },
                            complete: function () {
                                if (ajax === self._profile_ajax) {
                                    self._profile_ajax = null;
                                }
                            }
                        });
                    }
                }
            }
        }
    }
});
