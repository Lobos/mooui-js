/*
---

name: Overlay

authors:
  - David Walsh (http://davidwalsh.name)

license:
  - MIT-style license

requires: [Core/Class, Core/Element.Style, Core/Element.Event, Core/Element.Dimensions, Core/Fx.Tween]

provides:
  - Overlay
...
*/

var Overlay = new Class({

    Implements: [Options, Events],

    options: {
        id: 'overlay',
        color: '#000',
        duration: 500,
        teen: false,
        opacity: 0.1/*,
		zIndex: 5000,
		onClick: $empty,
		onClose: $empty,
		onHide: $empty,
		onOpen: $empty,
		onShow: $empty
		*/
    },

    initialize: function (container, options) {
        this.setOptions(options);
        this.container = document.id(container);

        this.bound = {
            'window': {
                resize: this.resize.bind(this),
                scroll: this.scroll.bind(this)
            },
            overlayClick: this.overlayClick.bind(this),
            tweenStart: this.tweenStart.bind(this),
            tweenComplete: this.tweenComplete.bind(this)
        };

        this.build().attach();
    },

    build: function () {
        this.overlay = new Element('div', {
            id: this.options.id,
            opacity: this.options.teen ? 0 : this.options.opacity,
            styles: {
                position: (Browser.ie6) ? 'absolute' : 'fixed',
                background: this.options.color,
                left: 0,
                top: 0
            }
        }).inject(this.container);
        if (this.options.teen)
            this.tween = new Fx.Tween(this.overlay, {
                duration: this.options.duration,
                link: 'cancel',
                property: 'opacity'
            });
        return this;
    } .protect(),

    attach: function () {
        window.addEvents(this.bound.window);
        this.overlay.addEvent('click', this.bound.overlayClick);
        if (this.teen)
            this.tween.addEvents({
                onStart: this.bound.tweenStart,
                onComplete: this.bound.tweenComplete
            });
        return this;
    },

    detach: function () {
        var args = Array.prototype.slice.call(arguments);
        args.each(function (item) {
            if (item == 'window') window.removeEvents(this.bound.window);
            if (item == 'overlay') this.overlay.removeEvent('click', this.bound.overlayClick);
        }, this);
        return this;
    },

    overlayClick: function () {
        this.fireEvent('click');
        return this;
    },

    tweenStart: function () {
        this.overlay.setStyles({
            width: '100%',
            height: this.container.getScrollSize().y
        });
        return this;
    },

    tweenComplete: function () {
        this.fireEvent(this.overlay.get('opacity') == this.options.opacity ? 'show' : 'hide');
        return this;
    },

    open: function (zIndex) {
        zIndex = zIndex || Object.topZIndex();
        document.id(this.overlay).setStyle('z-index', zIndex);
        this.fireEvent('open');
        if (this.options.teen)
            this.tween.start(this.options.opacity);
        else
            this.overlay.setStyles({
                display: 'block',
                width: '100%',
                height: this.container.getScrollSize().y
            });
        return this;
    },

    close: function () {
        this.fireEvent('close');
        if (this.options.teen)
            this.tween.start(0);
        else
            this.overlay.setStyle('display', 'none');
        return this;
    },

    destroy: function () {
        this.detach();
        this.overlay.destroy();
        delete this.overlay;
        Function.attempt(function () {
            CollectGarbage();
        });
    },

    resize: function () {
        this.fireEvent('resize');
        if (this.overlay)
            document.id(this.overlay).setStyle('height', this.container.getScrollSize().y);
        return this;
    },

    scroll: function () {
        this.fireEvent('scroll');
        if (Browser.ie6) document.id(this.overlay).setStyle('left', window.getScroll().x);
        return this;
    }

});
