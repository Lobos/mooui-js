/**
 * User: lobos841@gmail.com
 * Date: 11-5-30
 */

(function() {
var OpenBox = window.OpenBox = new Class({
    Implements: [Options, Events],

    options: {
        id: null,
        baseClass: 'openbox',
        title: '',
        content: '',
        tableBox: false,
        icon: '',
        pad: 100,
        width: 'auto',
        height: 'auto',
        opacity: 1,
        overlayOpacity: 0.5,
        closeOnOverlayClick: true,
        destroyOnClose: true,
        constrain: false,
        showTitle: 1, // 1:show 0:hide -1:none
        showClose: true,
        dragAble: false,
        resizeAble: false,
        showLock: false,
        minimizeAble: false,
        resizeOnOpen: true,
        resetOnScroll: true,
        position: null,
        buttons: [],
        offsetTop: 10,
        fadeDelay: 400,
        fadeDuration: 200/*,
        onLock: null
        */
    },

    initialize: function (options) {
        this.id = options.id = options.id || String.uniqueID();
        this.setOptions(options);
        this.createBox();
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
        if (this.options.tableBox) {
            this.box = new Element('table', {
                'class': this.options.baseClass,
                cellSpacing: 0,
                cellPadding: 0,
                styles: {
                    'position': 'absolute',
                    'container': 'main',
                    'display': 'none',
                    'left': -9999,
                    'top': -9999
                }
            }).inject(container);

            var verts = ['top', 'center', 'bottom'], hors = ['left', 'center', 'right'], len = verts.length;
            verts.each(function (vert, v) {
                var row = new Element('tr').inject(self.box);
                hors.each(function (hor, h) {
                    var cell = new Element('td', {
                        'class': vert + '-' + hor
                    }).inject(row);
                    if (vert == 'center' && hor == 'center') {
                        self.centerBox = new Element('div', {
                            'class': self.options.baseClass + '-center',
                            styles: {
                                width: self.options.width
                            }
                        }).inject(cell);
                    } else {
                        cell.setStyle('opacity', 0.4);
                    }
                });
            });
        } else {
            this.box = new Element('div', {
                'class': this.options.baseClass,
                styles: {
                    'position': 'absolute',
                    'display': 'none',
                    'width': this.options.width,
                    'left': -9999,
                    'top': -9999
                }
            }).inject(container);

            /*this.centerBox = new Element('div', {
                'class': this.options.baseClass + '-center',
                styles: {
                    width: this.options.width
                }
            }).inject(this.box);*/
            this.centerBox = this.box;
        }

        this.box.addEvent('mousedown', this.arise.bind(this));

        //titlebar
        this.titleBar = new Element('div', {
            'class': 'title-bar'
        }).inject(this.centerBox);

        new Element('span', {
            'html': this.options.title || ''
        }).inject(this.titleBar);

        //close button
        if (this.options.showClose) {
            new Element('a', {
                'class': 'button close',
                'html': '',
                'events': {
                    'click': function () {
                        self.close();
                    }
                }
            }).inject(this.titleBar);
        }

        //lock button
        if (this.options.dragAble || this.options.resizeAble) {
            var windowSize = window.getSize();
            var handle = new Element('div', {
                'class': 'handle'
            }).inject(this.centerBox);
            this.boxDrag = new Drag(this.box, {
                handle: handle,
                limit: { x: [0, windowSize.x - 50], y: [0, windowSize.y - 80] }
            });

            if (this.options.showLock) {
                this.isLocked = true;
                this.boxDrag.detach();
                var lock_button = new Element('a', {
                    'class': this.options.baseClass + '-lock',
                    'events': {
                        'click': function () {
                            if (this.isLocked) {
                                this.unlock();
                                lock_button.addClass('unlock');
                            } else {
                                this.lock();
                                lock_button.removeClass('unlock');
                            }
                        }.bind(this)
                    }
                }).inject(this.titleBar);
            }
        }

        if (this.options.showTitle == 0) {
            this.titleBar.addClass('hidden');
            this.centerBox.addEvents({
                mouseover: function () {
                    this.titleBar.removeClass('hidden');
                }.bind(this),
                mouseout: function () {
                    this.titleBar.addClass('hidden');
                }.bind(this)
            });
        } else if (this.options.showTitle == -1) {
            this.titleBar.setStyle('display', 'none');
        }

        //minimize button

        //content
        this.contentBox = new Element('div', {
            'class': this.options.baseClass + '-content'
        }).inject(this.centerBox);
        this.contentBox.store('openbox', this);

        if (this.options.resizeAble) {
            this.contentResize = this.contentBox.makeResizable();
            this.centerResize = this.centerBox.makeResizable({
                handle: this.contentBox
            });
        }

        switch (typeOf(this.options.content)) {
            case 'element':
                this.contentBox.grab(this.options.content);
                break;
            case 'string':
            case 'number':
                this.contentBox.set('html', this.options.content);
                break;
        }

        //create footer buttons
        this.buttons = [];
        if (this.options.buttons.length) {
            this.footer = new Element('div', {
                'class': this.options.baseClass + '-footer'
            }).inject(this.centerBox);

            this.options.buttons.each(function (button) {
                this.addButton(button.title, button.event, button.color);
            }, this);
        }
    },

    toElement: function () {
        return this.box;
    },

    addButton: function (title, clickEvent, color) {
        this.footer.setStyle('display', 'block');
        var focusClass = 'focus-' + color;
        var label = new Element('label', {
            'class': color || '',
            events: {
                mousedown: function () {
                    if (color) {
                        label.addClass(focusClass);
                        var ev = function () {
                            label.removeClass(focusClass);
                            document.id(document.body).removeEvent('mouseup', ev);
                        };
                        document.id(document.body).addEvent('mouseup', ev);
                    }
                }
            }
        });
        this.buttons[title] = (new Element('input', {
            type: 'button',
            value: title,
            events: {
                click: (clickEvent || this.close).bind(this)
            }
        }).inject(label));
        label.inject(this.footer);
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

    createResizeHandle: function (v, h) {
        var handle = new Element('div', {
            'class': 'resize-handle'
        });
        return handle;
    },

    lock: function () {
        if (this.isLocked) return this;
        this.boxDrag.detach();
        if (this.contentResize) this.contentResize.detach();
        if (this.centerResize) this.centerResize.detach();
        this.fireEvent('lock', this);
        this.titleBar.removeClass('move');
        this.contentBox.removeClass('resize');
        this.isLocked = true;
    },

    unlock: function () {
        if (!this.isLocked) return this;
        this.boxDrag.attach();
        if (this.contentResize) this.contentResize.attach();
        if (this.centerResize) this.centerResize.attach();
        if (this.options.dragAble) this.titleBar.addClass('move');
        if (this.options.resizeAble) this.contentBox.addClass('resize');
        this.isLocked = false;
    },

    arise: function () {
        this.box.setStyle('z-index', Object.topZIndex());
    },

    open: function (fast) {
        if (this.isOpen) return this;
        if (this.overlay) this.overlay.open();
        this.box.setStyles({
            'z-index': Object.topZIndex(),
            'display': 'block'
        });

        if (this.options.resizeOnOpen) this._resize();
        this.isOpen = true;

        return this;
    },

    close: function (data) {
        if (!this.isOpen) return this;

        this.isOpen = false;
        this.box.setStyle('display', 'none');
        if (this.overlay) this.overlay.close();

        if (this.options.destroyOnClose)
            this.destroy();

        this.fireEvent('close', data);
        return this;
    },

    destroy: function () {
        this.box.dispose();
        this.box.destroy();
        delete this.box;
        if (Browser.ie) CollectGarbage();

        if (this.overlay) this.overlay.destroy();
    },

    fade: function (opts) {
        if (this.options.overlayAll)
            this.centerBox.mask(opts);
        else
            this.contentBox.mask(opts);
        this.fireEvent('fade');
        return this;
    },

    unfade: function () {
        if (this.options.overlayAll)
            this.centerBox.unmask();
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
        var left, top;
        if (this.options.position) {
            left = this.options.position.left;
            top = this.options.position.top;
        } else {
            var windowSize = window.getSize(),
                scrollSize = window.getScroll(),
                boxSize = this.box.getSize();
            left = scrollSize.x + ((windowSize.x - boxSize.x) / 2);
            top = scrollSize.y + ((windowSize.y - boxSize.y) / 2) - this.options.offsetTop;
        }

        this.box.setStyles({
            left: left,
            top: top
        });

        return this;
    }

});

OpenBox.Request = new Class({
    Extends: OpenBox,

    options: {
        resizeOnOpen: true,
        request: {}
    },

    initialize: function (options) {
        this.parent(options);
        if (this.options.request) {
            this.contentBox.addClass('loading');
            this._position();
            var opts = {
                update: this.contentBox,
                onSuccess: function () {
                    this.contentBox.removeClass('loading');
                    this._position();
                }.bind(this)
            };
            Object.merge(opts, this.options.request);
            new Request.HTML(opts).send();
        }
    },

    loading: function () {
        this.fade({'class': 'mask-loading'});
        return this;
    }
});

OpenBox.Image = new Class({
    Extends: OpenBox,
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
		this.fade();
		this.image = new Element('img',{
			events: {
				load: function() {
					(function() {
						var setSize = function() { this.image.inject(this.contentBox).store('dimensions',this.image.getSize()); }.bind(this);
                        this.open();
						setSize();
						this._resize();
						setSize(); //stupid ie
						this.unfade();
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

OpenBox.IFrame = new Class({
    Extends: OpenBox,

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

OpenBox.Alert = new Class({
    Extends: OpenBox,

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

OpenBox.Confirm = new Class({
    Extends: OpenBox,

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

OpenBox.Wait = new Class({
    Extends: OpenBox,

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

//OpenBox.Tip = new Class({});
})();
