/**
 * User: lobos841@gmail.com
 * Date: 11-5-30
 */

(function() {
if (!this.MooUI) this.MooUI = {};
Locale.define('zh-CHS', 'MooUI_Openbox', {
    ajaxError: '内容获取失败。',
    imageError: '图片加载失败'
});

MooUI.Openbox = new Class({
    Implements: [Options, Events],

    options: {
        id: null,
        container: null,
        title: '',
        content: '',
        pad: 100,
        width: 'auto',
        height: 'auto',
        opacity: 1,
        overlayOpacity: 0.1,
        closeOnOverlayClick: true,
        destroyOnClose: false,
        arise: false,
        fixed: true,
        maskAll: true,
        showTitle: true,
        showClose: true,
        dragAble: false,
        resizeAble: false,
        position: null,
        duration: 400,
        buttons: [],
        css: {
            openbox:    'openbox',
            inner:      'openbox-inner',
            title:      'openbox-title',
            drag:       'openbox-drag',
            resize:     'openbox-resize',
            close:      'close',
            body:       'openbox-body',
            content:    'openbox-content',
            buttons:    'openbox-buttons'
        }/*,
        onClose: function () {}
        */
    },

    initialize: function (options) {
        this.setOptions(options);
        this.id = this.options.id || String.uniqueID();
        this.css = this.options.css;
        this.createBox();
        this.tween = new Fx.Tween(this.box, {
            duration: this.options.duration,
            link: 'cancel',
            property: 'opacity',
            onStart: function () {
                this.box.setStyle('visibility', 'visible');
            }.bind(this),
            onComplete: function () {
                if (this.box.getStyle('opacity') == 0) {
                    this.box.setStyles({
                        left: 9999,
                        top: -9999,
                        visibility: 'hidden'
                    });
                }
            }.bind(this)
        });
    },

    createBox: function () {
        //create overlay
        if (this.options.overlayOpacity > 0) {
            this.overlay = new Overlay(document.body, {
                zIndex: Object.topZIndex(),
                opacity: this.options.overlayOpacity,
                onClick: function () {
                    if (this.options.closeOnOverlayClick) this.close();
                }.bind(this)
            });
        }

        var container = document.id(this.options.container) || document.body;

        this.box = new Element('div', {
            'class': this.css.openbox,
            styles: {
                'opacity': 0,
                'left': -9999,
                'top': -9999
            }
        }).inject(container);

        this.innerBox = new Element('div', {
            'class': this.css.inner
        }).inject(this.box);

        if (this.options.fixed)
            this.box.setStyle('position', 'fixed');

        if (this.options.arise)
            this.box.addEvent('mousedown', this.arise.bind(this));

        //title bar
        if (this.options.showTitle)
            this.createTitle();

        //content
        this.contentBox = new Element('div', {
            'class': this.css.body,
            'styles': {
                'width': this.options.width,
                'height': this.options.height
            }
        }).inject(this.innerBox);
        this.contentBox.store('openbox', this);

        if (this.options.resizeAble) {
            this.resizeHandle = new Element('div', {
                'class': this.css.resize
            }).inject(this.innerBox);
            this.contentResize = this.contentBox.makeResizable({
                handle: this.resizeHandle
            });
        }

        this.set('content', this.options.content);

        //close button
        if (this.options.showClose) {
            new Element('a', {
                'class': this.css.close,
                'href': 'javascript:;',
                'events': {
                    'click': function () {
                        this.close();
                    }.bind(this)
                }
            }).inject(this.innerBox);
        }

        //create footer buttons
        this.buttons = [];
        if (this.options.buttons.length) {
            this.footer = new Element('div', {
                'class': this.css.buttons
            }).inject(this.innerBox);

            this.options.buttons.each(function (button) {
                this.addButton(button.text, button.events, button.type);
            }, this);
        }
    },

    createTitle: function () {
        var titleBar = this.titleBar = new Element('div', {
            'class': this.css.title
        }).inject(this.innerBox);

        this.set('title', this.options.title || '');

        //drag
        if (this.options.dragAble) {
            var windowSize = window.getSize();
            titleBar.addClass(this.css.drag);
            this.boxDrag = new Drag(this.box, {
                handle: titleBar,
                limit: { x: [0, windowSize.x - 50], y: [0, windowSize.y - 80] }
            });
        }
    },

    toElement: function () {
        return this.box;
    },

    addButton: function (text, events, type) {
        this.footer.show();

        if (!events)
            events = { click: this.close.bind(this) };
        else if (typeOf(events) == 'function')
            events = { click: events.bind(this) };

        this.buttons[text] = (new Element('button', {
            'class': 'btn btn-' + (type || ''),
            html: text,
            events: events
        }).inject(this.footer));
        return this;
    },
    showButton: function (text) {
        if (this.buttons[text]) this.buttons[text].show();
        return this.buttons[text];
    },
    hideButton: function (text) {
        if (this.buttons[text]) this.buttons[text].hide();
        return this.buttons[text];
    },

    lock: function () {
        if (this.isLocked) return this;
        this.boxDrag.detach();
        if (this.contentResize) this.contentResize.detach();
        this.titleBar.removeClass(this.css.drag);
        this.resizeHandle.hide();
        this.isLocked = true;

        return this;
    },

    unlock: function () {
        if (!this.isLocked) return this;
        this.boxDrag.attach();
        if (this.contentResize) this.contentResize.attach();
        if (this.options.dragAble) this.titleBar.addClass(this.css.drag);
        this.resizeHandle.show();
        this.isLocked = false;

        return this;
    },

    arise: function () {
        this.box.setStyle('z-index', Object.topZIndex());
        return this;
    },

    open: function (opacity) {
        if (this.isOpen) return this;
        if (this.overlay) this.overlay.open();
        opacity = opacity || this.options.opacity;
        this.tween.start(opacity);
        this._resize();
        this.arise();
        this.isOpen = true;

        return this;
    },

    close: function (data) {
        if (!this.isOpen) return this;

        this.isOpen = false;
        this.tween.start(0).chain(function () {
            if (this.options.destroyOnClose) this.destroy();
        }.bind(this));

        if (this.overlay)
            this.overlay.close(this.options.destroyOnClose);

        this.fireEvent('close', data);
        return this;
    },

    set: function (property, content) {
        switch (property) {
            case 'title':
                if (typeOf(content) == 'element')
                    this.titleBar.empty().grab(content);
                else
                    this.titleBar.empty().grab(new Element('h3', {'html': content }));
                break;
            case 'content':
                this.contentBox.empty();
                switch (typeOf(content)) {
                    case 'element':
                        this.contentBox.grab(content);
                        break;
                    case 'string':
                    case 'number':
                        new Element('div', {
                            'class': this.css.content,
                            html: content
                        }).inject(this.contentBox);
                        break;
                }
                break;
        }

        return this;
    },

    destroy: function () {
        this.box.dispose();
        this.box.destroy();

        Function.attempt(function () {
            this.overlay.destroy();
        });
    },

    mask: function (loading) {
        if (loading === undefined) loading = true;

        if (loading)
            this.contentBox.addClass('loading');

        var opts = loading ? { 'class': 'mask-loading' } : {};
        if (this.options.maskAll)
            this.innerBox.mask(opts);
        else
            this.contentBox.mask(opts);

        return this;
    },

    unmask: function () {
        if (this.options.maskAll)
            this.innerBox.unmask();
        else
            this.contentBox.unmask();
        this.contentBox.removeClass('loading');
        return this;
    },

    _resize: function () {
        var height = this.options.height;
        if (height == 'auto') {
            //get the height of the content box
            var max = window.getSize().y - this.options.pad;
            if (this.contentBox.getSize().y > max) height = max;
            this.contentBox.setStyles({
                'height': height,
                'overflow': 'auto',
                'max-height': max
            });
        }
        this._position();

        return this;
    },

    _position: function () {
        if (this.options.position) {
            this.box.setStyles(this.options.position);
        } else {
            var left,
                top,
                windowSize = window.getSize(),
                scrollSize = window.getScroll(),
                boxSize = this.box.getSize();

            left = ((windowSize.x - boxSize.x) / 2);
            top = ((windowSize.y - boxSize.y) / 2);
            if (!this.options.fixed) {
                left += scrollSize.x;
                top += scrollSize.y;
            }

            this.box.setStyles({ left: left, top: top });
        }

        return this;
    }

});

MooUI.Openbox.Request = new Class({
    Extends: MooUI.Openbox,

    options: {
        maskAll: true,
        destroyOnClose: true,
        request: {}
    },

    initialize: function (options) {
        this.parent(options);
        this.isLoaded = false;
    },

    open: function () {
        this.parent();
        if (!this.isLoaded)
            this.load();
    },

    load: function (options) {
        this.mask();
        this._position();

        var opts = {
            update: this.contentBox,
            method: 'get',
            onSuccess: function () {
                this.contentBox.removeClass('loading').fade('hide').fade('in');
                this._resize();
            }.bind(this),
            onFailure: function () {
                this.contentBox.removeClass('loading').fade('hide').fade('in');
                this.set('content', Locale.get('MooUI_Openbox.ajaxError'));
                this._resize();
            }.bind(this),
            onComplete: function () {
                this.unmask();
            }.bind(this)
        };
        options = Object.merge(this.options.request || {}, options);
        Object.merge(opts, options);
        new Request.HTML(opts).send();

        this.isLoaded = true;
        return this;
    }
});

MooUI.Openbox.Image = new Class({
    Extends: MooUI.Openbox,
    options: {
        destroyOnClose: false,
        showTitle: false,
        showClose: false,
        key: 'href',
        opacity: 1,
        css: {
            openbox: 'openbox openbox-image',
            bottom: 'openbox-bottom',
            next: 'icon-metro-right icon-huge',
            previous: 'icon-metro-left icon-huge',
            close: 'image-close icon-metro-close icon-huge',
            tip: 'openbox-tip'
        }
    },

    initialize: function(elements, options) {
		this.parent(options);
        this.images = [];
        this.index = 0;
        this.stack = new Element('div', {
            styles: {
                position: 'absolute',
                visibility: 'hidden',
                left: 9999,
                top: -9999
            }
        }).inject(document.body);
        $$(elements).each(function (el) {
            this.addImage(el);
        }.bind(this));

        this.createBottom();
	},

    open: function (opacity) {
        if (this.isOpen) return this;
        if (this.overlay) this.overlay.open();
        this.box.setStyles({
            opacity: opacity || this.options.opacity,
            zIndex: Object.topZIndex(),
            visibility: 'visible'
        });
        if (this.currentImage) this.currentImage.inject(this.stack);
        this.contentBox.setStyles({ 'width': '', 'height': '' });
        this.isOpen = true;

        return this;
    },

    createBottom: function () {
        var bottom = this.bottomBox = new Element('div', {
            'class': this.css.bottom
        }).inject(this.innerBox);
        this.previousBtn = new Element('a', {
            'href': 'javascript:;',
            'class': this.css.previous,
            'events': {
                'click': this.previous.bind(this)
            }
        }).inject(bottom);
        this.nextBtn = new Element('a', {
            'href': 'javascript:;',
            'class': this.css.next,
            'events': {
                'click': this.next.bind(this)
            }
        }).inject(bottom);

        new Element('a', {
            'class': this.css.close,
            'href': 'javascript:;',
            'events': {
                'click': function () {
                    this.close();
                }.bind(this)
            }
        }).inject(bottom);
    },

    addImage: function (el) {
        var uid = String.uniqueID();
        var img = {
            uid: uid,
            el: el,
            title: el.get('title'),
            url: el.get(this.options.key)
        };
        this.images.push(img);
        el.addEvent('click', function (event) {
            event.preventDefault();
            this.change(uid);
        }.bind(this));
    },

    getImage: function (uid) {
        var img = null;
        this.images.each(function (item) {
            if (item.uid == uid) img = item;
        });
        return img;
    },

    next: function () {
        if (this.index >= this.images.length - 1) return this;
        this.change(this.images[this.index + 1]);
        return this;
    },

    previous: function () {
        if (this.index <= 0) return this;
        this.change(this.images[this.index - 1]);
        return this;
    },

    change: function (image) {
        this.open();
        this.mask();
        this._position();

        var self = this;
        if (typeOf(image) == 'string')
            image = this.getImage(image);
        var _load = function (img, title) {
            self.unmask();
            if (self.currentImage) self.currentImage.inject(self.stack);
            self.currentImage = img;
            self.set('content', img);
            if (title)
                new Element('div', {
                    html: '<p>' + title + '</p>',
                    title: 'close',
                    'class': self.css.tip,
                    events: {
                        click: function () {
                            this.fade('out');
                        }
                    }
                }).inject(self.contentBox);

            self._resize();
            img.fade('hide').fade('in');
        };

        this.mask();
        if (image.img) {
            _load(image.img, image.title);
        } else {
            image.img = new Element('img', {
                events: {
                    load: function() {
                        this.inject(self.stack).store('size', this.getSize());
                        _load(this, image.title);
                    },
                    error: function() {
                        this.fireEvent('error');
                        this.contentBox.set('html',Locale.get('MooUI_Openbox.imageError'));
                    }.bind(this)
                },
                styles: {
                    width: 'auto',
                    height: 'auto'
                }
            });

            //src必须在单独写，不能加在new Element中，否则IE浏览器load事件不会执行。
            image.img.src = image.url;
        }

        this.index = this.images.indexOf(image);

        if (this.index <= 0)
            this.previousBtn.addClass('disabled');
        else
            this.previousBtn.removeClass('disabled');

        if (this.index >= this.images.length - 1)
            this.nextBtn.addClass('disabled');
        else
            this.nextBtn.removeClass('disabled');

        return this;
    },

	_resize: function() {
        if (!this.currentImage) {
            this.parent();
            return this;
        }

		var maxHeight = window.getSize().y - this.options.pad - this.bottomBox.getSize().y,
            img = this.currentImage,
		    imageDimensions = img.retrieve('size'),
            width = imageDimensions.x,
            maxWidth = (imageDimensions.x * (maxHeight / imageDimensions.y)).toInt();

        if (maxWidth > window.getSize().x - this.options.pad) {
            maxWidth = window.getSize().x - this.options.pad;
            maxHeight = (imageDimensions.y * (maxWidth / imageDimensions.x)).toInt();
        }

		if (imageDimensions.y > maxHeight || imageDimensions.x > maxWidth) {
			img.setStyles({
				height: maxHeight,
				width: maxWidth
			});
            width = maxWidth;
		}

        //IE 下需要设置宽度
        this.contentBox.setStyles({ width: width });

		this._position();
		//在chrome的某个版本下面，第一次_position()之后不居中。原因是第一次取到的offsetWidth值(getSize方法)不对。
        if (maxWidth < this.box.getSize().x)
            this._position();

        return this;
	},

    destroy: function () {
        this.stack.destroy();
        this.parent();
    }

});

/* 性能比较差，不建议使用
MooUI.Openbox.IFrame = new Class({
    Extends: MooUI.Openbox,

    options: {
        url: '',
        domain: '*'
        //initData: null,
        //callback: null,
        //onReceive: null
    },

    initialize: function (options) {
        this.parent(options);
        this.createIFrame();
        if (this.options.url) this.load();
    },

    createIFrame: function () {
        this.contentBox.empty();

        this.iframeName = String.uniqueID();
        this.iframe = new IFrame({
            name: this.iframeName,
            styles: {
                width: '100%',
                height: '100%',
                backgroundColor: '#fff',
                border: 0
            },
            events: {
                load: function () {
                    //first load is empty
                    if (!this.iframe) return;

                    this.unmask();
                    this.fireEvent('complete');

                    Function.attempt(function () {
                        this.iframe.contentWindow.initialize(this.options.initData, this.options.callback);
                    }.bind(this));
                }.bind(this)
            },
            frameborder: 0
        }).inject(this.contentBox);
        this.contentBox.setStyles({ padding: 0, overflow: 'hidden' });
    },

    load: function (url, title) {
        this.mask();
        this.iframe.src = url || this.options.url;

        return this;
    },

    close: function () {
        this.parent();
    },

    destroy: function () {
        //I hate ie
        this.iframe.contentWindow.document.write('');
        this.iframe.contentWindow.document.clear();
        this.iframe.contentWindow.close();
        this.iframe.src = "about:blank";
        this.iframe.destroy();
        delete this.iframe;
        if (Browser.ie) CollectGarbage();

        this.parent();
    },

    _resize: function (width, height) {
        width = width || this.options.width;
        height = height || this.options.height;
        var windowSize = window.getSize();
        var maxh = windowSize.y - this.options.pad;
        height = height > maxh ? maxh : height;
        var maxw = windowSize.x - this.options.pad;
        width = width > maxw ? maxw : width;

        this.contentBox.setStyles({ 'height': height, 'width': width });
        this._position();
    }

});
*/
})();
