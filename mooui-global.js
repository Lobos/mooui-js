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


Element.implement({
    toFormData: function () {
        var fd = new FormData();
        this.getElements('input, select, textarea', true).each(function(el){
            if (!el.name || el.disabled || el.type == 'submit' || el.type == 'reset') return;
            if (el.type == 'file') {
                if (el.files.length > 0)
                    fd.append(el.name, el.files[0]);
            } else {
                var value = (el.tagName.toLowerCase() == 'select') ? Element.getSelected(el).map(function(opt){
                    return opt.value;
                }) : ((el.type == 'radio' || el.type == 'checkbox') && !el.checked) ? null : el.value;

                Array.from(value).each(function(val){
                    if (typeof val != 'undefined') {
                        fd.append(el.name, val);
                    }
                });
            }
        });
        return fd;
    }
});


Request.implement({
    sendWithFile: function (form) {
        var fd = document.id(form).toFormData();

        this.options.isSuccess = this.options.isSuccess || this.isSuccess;
        this.running = true;

        var xhr = this.xhr;
        if ('onprogress' in new Browser.Request){
            xhr.onloadstart = this.loadstart.bind(this);
            xhr.onprogress = this.progress.bind(this);
        }

        xhr.open('POST', this.options.url, this.options.async, this.options.user, this.options.password);
        if (this.options.user && 'withCredentials' in xhr) xhr.withCredentials = true;

        xhr.onreadystatechange = this.onStateChange.bind(this);

        xhr.setRequestHeader("enctype", "multipart/form-data");

        this.fireEvent('request');
        xhr.send(fd);
        if (!this.options.async) this.onStateChange();
        else if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
        return this;
    }
});


MooUI.Global = new Class({
    Implements: [Options],

    options: {
        body: document.body
    },

    initialize: function (options) {
        this.setOptions(options);
        this.body = document.id(this.options.body);
        this.items = {};
    },

    // dependent on MooUI.Openbox
    alert: function (message, type, options) {
        options = Object.merge({
            width: 420,
            overlayOpacity: 0,
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
            event.preventDefault ? event.preventDefault() : event.returnValue = false;
            if(options.init) options.init();
            var suc = true;
            if (fv) suc = fv.validate();
            if (!suc) return false;
            if (btn) btn.set('disabled', 'disabled');
            if (form.get('enctype') == "multipart/form-data")
                new Request.JSON(options).sendWithFile(form);
            else
                new Request.JSON(options).send(form);

            return false;
        });
    }

});
})();