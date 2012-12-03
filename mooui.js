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
    },

    getFV: function (form, options) {
        options = Object.merge({
            evaluateOnBlur: false,
            stopOnFailure: false,
            onSuccess: function (el) {
                var parent = el.getParent('.control-group');
                parent.removeClass('error');
                var help = parent.getElement('[class^=help-]');
                if (help) {
                    help.set('html', '<i class="icon-ok"></i>');
                }
            },
            onFailure: function (el, msg) {
                var parent = el.getParent('.control-group');
                parent.addClass('error');
                var help = parent.getElement('[class^=help-]');
                if (help) {
                    help.set('html', msg);
                }
            }
        }, options);

        return new MooUI.Validator(form, options);
    },

    form: function (form, fv, options) {
        form = document.id(form);
        var btn = form.getElement('[type="submit"]');
        options = Object.merge({
            url: form.get('action'),
            method: form.get('method'),
            onComplete: function () {
                if (btn) btn.removeProperty('disabled');
            }
        }, options);
        form.addEvent('submit', function (event) {
            event.preventDefault();
            var suc = true;
            if (fv) fv.validate();
            if (!suc) return false;
            if (btn) btn.set('disabled', 'disabled');
            new Request.JSON(options).send(form);
        });
    }

});

})();
