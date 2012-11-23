/**
 * user: lobos841@gmail.com
 * date: 12-10-30 下午3:00
 * license: MIT-style
 */

(function () {

this.MooUI = this.MooUI || {
    version: 1.0
};

Locale.define('zh-CHS', 'MooUI', {
    btn_ok: '确定',
    btn_cancel: '取消'
});

MooUI.Global = new new Class({
    initialize: function () {
        this.pages = {};
    },

    // dependent on MooUI.Openbox
    alert: function (message, type, options) {
        options = Object.merge({
            width: 420,
            overlayOpacity: 0,
            opacity: 0.92,
            showTitle: false,
            showClose: false,
            destroyOnClose: true,
            content: message,
            css: {
                openbox: 'openbox openbox-alert ' + (type || '')
            },
            buttons: [
                { text: Locale.get('MooUI.btn_ok') }
            ]
        }, options);

        new MooUI.Openbox(options).open();
    },

    confirm: function (message, fn, options) {
        if (typeOf(fn) != 'function') {
            options = fn;
            fn = null;
        }

        options = Object.merge({
            width: 420,
            overlayOpacity: 0,
            showTitle: false,
            showClose: false,
            destroyOnClose: true,
            content: message,
            css: {
                openbox: 'openbox openbox-confirm'
            },
            buttons: [
                { text: Locale.get('MooUI.btn_ok'), type: 'primary', events: function () {
                    if (fn) fn();
                    this.close();
                } },
                { text: Locale.get('MooUI.btn_cancel') }
            ]
        }, options);

        new MooUI.Openbox(options).open();
    }
});

})();
