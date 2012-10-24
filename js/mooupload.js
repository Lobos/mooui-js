/**
 * User: lobos841@gmail.com
 * Date: 11-12-30
 * license: MIT License
 * requires: core-1.4.2, Fx.Progress, html5
 */


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
    sendFile: function (form) {
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

var MooUploader = new Class({
    Implements: [Options, Events]
});

MooUploader.Html5 = new Class({
    Extends: MooUploader,

    options: {
        url: '',
        path: '',
        maxFileSize: 1048576
    },

    initialize: function (options) {
        this.setOptions(options);
        this.container = document.id(this.options.container);
        this.handle = document.id(this.options.handle);

        var self = this;
        this.handle.addEvent('change', function () {
            this.hide();
            self.fireEvent('start');
            self.queue = [];
            Array.each(this.files, function (f, index) {
                var el = self.createProgress(f.fileName);
                self.queue[index] = {
                    file: f,
                    element: el,
                    status: false,
                    success: false
                };

                var progress = new Fx.ProgressBar(el.getElement('.progress'));
                progress.start(0);
                if (f.size <= self.options.maxFileSize) {
                    self.setProcessInfo(el);
                    self.upload(el, f, progress, index);
                } else {
                    self.setFailedInfo(el, '超出上传上限 ' + self.options.maxFileSize.toFileSize());
                    self.createCancel(el, self.queue[index]);
                }
            });
        });
    },

    createProgress: function (filename) {
        var el = new Element('div', {
            'class': 'file-upload-item'
        }).inject(this.container);

        var info = new Element('div', {
            'html': filename + ' '
        }).inject(el);

        new Element('span', {
            'class': 'file-upload-info'
        }).inject(info);

        new Element('img', {
            'src': this.options.progress.url,
            'class': 'progress'
        }).inject(el);
        return el;
    },

    setProcessInfo: function (el) {
        el.getElement('.file-upload-info').set('html', '上传中...');
    },

    setCompleteInfo: function (el) {
        el.getElement('.cancel').destroy();
        el.getElement('.file-upload-info').set('html', '完成.');
    },

    setFailedInfo: function (el, msg) {
        el.addClass('error').getElement('.file-upload-info').set('html', msg);
    },

    createCancel: function (el, item, xhr) {
        var self = this;
        var cancel = new Element('a', {
            'html': '取消',
            'href': 'javascript:;',
            'class': 'cancel',
            'events': {
                'click': function () {
                    el.destroy();
                    if (xhr) xhr.abort();
                    self.queue.erase(item);
                    self.allComplete();
                }
            }
        }).inject(el);
    },

    checkQueue: function () {
        var success = true;
        var status = true;
        this.queue.each(function (item) {
            success = success && item.success;
            status = status && item.status;
        });
        return { success:success, status:status };
    },

    complete: function (e, index) {
        var json = JSON.decode(e.target.responseText);
        var item = this.queue[index];
        item.status = true;
        item.success = json.status == 1;
        if (json.status == 1)
            this.setCompleteInfo(item.element);
        else
            this.setFailedInfo(item.element, json.msg);
        this.allComplete();
    },

    allComplete: function () {
        var result = this.checkQueue();
        if (result.success)
            this.fireEvent('allComplete', result);
    },

    upload: function (el, file, progress, index) {
        var self = this;
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {
            var fd = new FormData();
            fd.append('file', file);
            fd.append('path', this.options.path||'');
            xhr.open("POST", this.options.url, true);
            xhr.setRequestHeader("enctype", "multipart/form-data");
            xhr.upload.addEventListener("progress", function (e) {
                progress.start(Math.round(e.loaded * 100 / e.total));
            }, false);
            xhr.addEventListener("load", function (e) {
                self.complete(e, index);
            }, false);
            xhr.send(fd);
            self.createCancel(el, self.queue[index], xhr);
        }
    },

    destroy: function () {
        this.queue.each(function (item) {
            if (item)
                delete item.file;
        });
    }
});