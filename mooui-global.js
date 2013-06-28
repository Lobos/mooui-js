/**
 * user: lobos841@gmail.com
 * date: 12-12-5 下午2:38
 * license: MIT-style
 */

(function () {
if (!this.MooUI) this.MooUI = {};

Locale.define('zh-CHS', 'MooUI', {
    btn_ok: '确定',
    btn_cancel: '取消'
});

MooUI.Global = new Class({
    Implements: [Options],

    initialize: function (options) {
        this.setOptions(options);
        this.items = {};
    },

    // dependent on MooUI.Openbox
    alert: function (message, type, options) {
        options = Object.merge({
            width: 420,
            overlayOpacity: 0,
            opacity: 0.95,
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
                    help.set('html', options.successHtml);
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
        }, { successHtml: '<i class="icon-ok"></i>' }, options);

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
            event.preventDefault ? event.preventDefault() : event.returnValue = false;
            if(options.init) options.init();
            var suc = true;
            if (fv) suc = fv.validate();
            if (!suc) return false;
            if (btn) btn.set('disabled', 'disabled');
            new Request.JSON(options).send(form);

            return false;
        });
    }

});
})();