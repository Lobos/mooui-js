/**
 * User: lobos841@gmail.com
 * Date: 11-5-30
 */

(function() {
if (!this.MooUI) this.MooUI = {};
MooUI.Openbox = new Class({
    Implements: [Options, Events],

    options: {
        id: null,
        title: '',
        content: '',
        icon: '',
        pad: 100,
        width: 'auto',
        height: 'auto',
        opacity: 1,
        overlayOpacity: 0.1,
        closeOnOverlayClick: true,
        arise: false,
        fixed: true,
        maskAll: false,
        destroyOnClose: true,
        showTitle: true,
        showClose: true,
        dragAble: false,
        resizeAble: false,
        showLock: false,
        minimizeAble: false,
        resizeOnOpen: true,
        resetOnScroll: true,
        position: null,
        buttons: [],
        fadeDelay: 400,
        fadeDuration: 200,
        css: {
            openbox:    'openbox',
            inner:      'openbox-inner',
            title:      'openbox-title',
            drag:       'openbox-drag',
            resize:     'openbox-resize',
            close:      'openbox-close m-icon-close m-icon-huge',
            body:       'openbox-body',
            content:    'openbox-content',
            buttons:    'openbox-buttons'
        }
    },

    initialize: function (options) {
        this.id = options.id = options.id || String.uniqueID();
        this.setOptions(options);
        this.css = this.options.css;
        this.createBox();
        this.tween = new Fx.Tween(this.box, {
            duration: this.options.fadeDuration,
            link: 'cancel',
            property: 'opacity',
            onStart: function () {
                this.box.setStyle('visibility', 'visible');
            }.bind(this),
            onComplete: function () {
                if (this.box.getStyle('opacity') == 0)
                    this.box.setStyle('visibility', 'hidden');
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

        var self = this;
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
                        self.close();
                    }
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
                this.addButton(button.title, button.event, button.color);
            }, this);
        }
    },

    createTitle: function () {
        var titleBar = this.titleBar = new Element('div', {
            'class': this.css.title
        }).inject(this.innerBox);

        new Element('h3', {
            'html': this.options.title || ''
        }).inject(titleBar);

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

    addButton: function (title, clickEvent, color) {
        this.footer.show();
        this.buttons[title] = (new Element('button', {
            'class': 'btn btn-' + color,
            html: title,
            events: {
                click: (clickEvent || this.close).bind(this)
            }
        }).inject(this.footer));
        return this;
    },
    showButton: function (title) {
        if (this.buttons[title]) this.buttons[title].removeClass('hiddenButton');
        return this.buttons[title];
    },
    hideButton: function (title) {
        if (this.buttons[title]) this.buttons[title].addClass('hiddenButton');
        return this.buttons[title];
    },

    lock: function () {
        if (this.isLocked) return this;
        this.boxDrag.detach();
        if (this.contentResize) this.contentResize.detach();
        this.fireEvent('lock', this);
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
    },

    open: function (opacity) {
        if (this.isOpen) return this;
        if (this.overlay) this.overlay.open();
        if (this.options.resizeOnOpen) this._resize();
        this.arise();
        opacity = opacity || 1;
        this.tween.start(opacity);
        this.isOpen = true;

        return this;
    },

    close: function (data) {
        if (!this.isOpen) return this;

        this.isOpen = false;
        this.tween.start(0);
        if (this.overlay) this.overlay.close();

        if (this.options.destroyOnClose)
            this.destroy();

        this.fireEvent('close', data);
        return this;
    },

    set: function (property, content) {
        switch (property) {
            case 'title':
                this.titleBar.getElement('h3').set('html', content);
                break;
            case 'content':
                this.contentBox.empty();
                switch (typeOf(content)) {
                    case 'element':
                        this.contentBox.grab(this.options.content);
                        break;
                    case 'string':
                    case 'number':
                        new Element('div', {
                            'class': this.css.content,
                            html: this.options.content
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

        if (this.overlay) this.overlay.destroy();
    },

    mask: function (opts) {
        if (this.options.maskAll)
            this.innerBox.mask(opts);
        else
            this.contentBox.mask(opts);
        this.fireEvent('fade');
        return this;
    },

    unmask: function () {
        if (this.options.maskAll)
            this.innerBox.unmask();
        else
            this.contentBox.unmask();
        this.fireEvent('unfade');
        return this;
    },

    _resize: function () {
        var height = this.options.height;
        if (height == 'auto') {
            //get the height of the content box
            var max = window.getSize().y - this.options.pad;
            if (this.contentBox.getSize().y > max) height = max;
            this.contentBox.setStyle('height', height);
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
        resizeOnOpen: true,
        maskAll: true,
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
        this.contentBox.addClass('loading');
        this.mask({ 'class': 'mask-loading' });
        this._position();

        var opts = {
            update: this.contentBox,
            onSuccess: function () {
                this.unmask();
                this.contentBox.removeClass('loading').fade('hide').fade('in');
                this._resize();
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
        images: [],
        showTitle: -1,
        resizeOnOpen: false,
        destroyOnClose: false
    },

    initialize: function(options) {
		this.parent(options);
		this.url = '';
		this.resizeOnOpen = false;
		if(this.options.url) this.load();
	},
	_resize: function() {
		//get the largest possible height
		var maxHeight = window.getSize().y - this.options.pad;

		//get the image size
		var imageDimensions = document.id(this.image).retrieve('dimensions');

		//if image is taller than window...
		if(imageDimensions.y > maxHeight) {
			this.image.height = maxHeight;
			this.image.width = (imageDimensions.x * (maxHeight / imageDimensions.y));
			this.image.setStyles({
				height: maxHeight,
				width: (imageDimensions.x * (maxHeight / imageDimensions.y)).toInt()
			});
		}

		//get rid of styles
		this.contentBox.setStyles({ height: '', width: '' });

		//position the box
		this._position();
	},
	load: function(url,title) {
		//keep current height/width
		var currentDimensions = { x: '', y: '' };
		if(this.image) currentDimensions = this.image.getSize();
		///empty the content, show the indicator
		this.contentBox.set('html','').addClass('openbox-content-img').setStyles({
			width: currentDimensions.x,
			height: currentDimensions.y
		});
		this._position();
		this.mask();
		this.image = new Element('img',{
			events: {
				load: function() {
					(function() {
						var setSize = function() { this.image.inject(this.contentBox).store('dimensions',this.image.getSize()); }.bind(this);
                        this.open();
						setSize();
						this._resize();
						setSize(); //stupid ie
						this.unmask();
						this.fireEvent('complete');
					}).bind(this).delay(10);
				}.bind(this),
				error: function() {
					this.fireEvent('error');
					this.image.destroy();
					delete this.image;
					this.contentBox.set('html',this.options.errorMessage).removeClass('openbox-content-img');
				}.bind(this),
				click: function() {
					this.close();
				}.bind(this)
			},
			styles: {
				width: 'auto',
				height: 'auto'
			}
		});
		this.image.src = url || this.options.url;
		if(title && this.titleBar) this.titleBar.getElement('span').set('html',title);
		return this;
	}
});

MooUI.Openbox.IFrame = new Class({
    Extends: MooUI.Openbox,

    options: {
        url: '',
        domain: '*',
        resizeOnOpen: true/*,
        initData: null,
        callback: null,
        onReceive: null*/
    },

    initialize: function (options) {
        this.parent(options);
        this.createIFrame();
        if (this.options.url) this.load();
    },

    createIFrame: function () {
        var self = this;
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
                    if (!self.iframe) return;

                    self.unfade();
                    self.fireEvent('complete');

                    Function.attempt(function () {
                        self.iframe.contentWindow.initialize(self.options.initData, self.options.callback);
                    });
                }
            },
            frameborder: 0
        }).inject(this.contentBox);
        this.contentBox.setStyles({ padding: 0, overflow: 'hidden' });
    },

    load: function (url, title) {
        this.fade();
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

MooUI.Openbox.Alert = new Class({
    Extends: MooUI.Openbox,

    options: {
        title: 'Warning',
        opacity: 1,
        overlayOpacity: 0.1,
        dragAble: false,
        resizeAble: false,
        resizeOnOpen: true,
        showTitle: 1
    },

    initialize: function (content) {
        var contentElement = new Element('div', {
            'html': content,
            'class': 'warning'
        });
        var options = {
            content: contentElement,
            buttons: [
                { 'title': '确定', event: function() { this.close(); } }
            ]
        };
		this.parent(options);
        this.open();
    }
});

MooUI.Openbox.Confirm = new Class({
    Extends: MooUI.Openbox,

    options: {
        overlayOpacity: 0.1,
        title: 'Confirm'
	},

	initialize: function(content, fn) {
        var contentElement = new Element('div', {
            'html': content,
            'class': 'question'
        });
        var options = {
            content: contentElement,
            buttons: [
                { 'title': '确定', event: fn.bind(this), color:'blue' },
                { 'title': '取消', event: function() { this.close(); } }
            ]
        };
		this.parent(options);
        this.open();
	}
    
});

MooUI.Openbox.Wait = new Class({
    Extends: MooUI.Openbox,

    options: {
        showTitle: -1
    },

    initialize: function (content) {
        var contentElement = new Element('div', {
            'html': content,
            'class': 'wait'
        });
        var options = {
            content: contentElement
        };
        this.parent(options);
        this.open();
    }
});

})();
