/**
 * user: lobos841@gmail.com
 * date: 12-10-30 下午3:00
 * license: MIT-style
 */

(function () {
    this.MooUI = this.MooUI || {
        version: 1.0
    };

    MooUI.Global = new new Class({
        initialize: function () {
            this.pages = {};
        },

        // 依赖 MooUI.Openbox
        alert: function (message) {
            new MooUI.Openbox({

            }).open();
        }
    });
})();
