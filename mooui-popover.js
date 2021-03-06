/**
 * user: lobos841@gmail.com
 * date: 13-9-3 上午10:27
 * license: MIT-style
 */

(function () {

    if (!this.MooUI) this.MooUI = {};
    MooUI.Popover = new Class({
        Implements: [Options, Events],

        options: {
            placement: 'bottom',
            html: '',
            destroyOnClose: false,
            closeDelay: 0 //等于0不自动关闭
        },

        initialize: function (el, options) {
            this.setOptions(options);
            this.element = document.id(el);
        },

        createPop: function (html) {
            this.pop = new Element('div', {
                'class': 'popover',
                events: {
                    click: function () {
                        this.close();
                    }.bind(this)
                }
            }).inject(this.element, 'after').fade('hide');
            new Element('a', {
                href: 'javascript:;',
                'class': 'close'
            }).inject(this.pop);
            this.content = new Element('div', {
                html: html || this.options.html
            }).inject(this.pop);
            this.pop.addClass(this.options.placement);
        },

        show: function (html, options) {
            this.setOptions(options);
            if (!this.pop) this.createPop(html);
            else if (html) this.content.set('html', html);
            this.pop.fade('in');

            var pos = this.element.getPosition(this.element.getOffsetParent()),
                placement = this.options.placement,
                left, top;

            if (placement == 'bottom' || placement == 'top')
                left = pos.x + (this.element.getWidth() / 2) - (this.pop.getWidth() / 2);
            else if (placement == 'right')
                left = pos.x + this.element.getWidth();
            else
                left = pos.x - this.pop.getWidth();

            if (placement == 'left' || placement == 'right')
                top = pos.y + (this.element.getHeight() / 2) - (this.pop.getHeight() / 2);
            else if (placement == 'top')
                top = pos.y - this.pop.getHeight();
            else
                top = pos.y + this.element.getHeight();

            this.pop.setStyles({
                left: left,
                top: top,
                zIndex: Object.topZIndex()
            });

            if (this.options.closeDelay > 0)
                setTimeout(this.close.bind(this), this.options.closeDelay);
        },

        close: function () {
            if (this.options.destroyOnClose) {
                if (this.pop) this.pop.destroy();
                this.pop = null;
            } else {
                this.pop.fade('hide');
            }
        },

        destroy: function () {
            this.pop.destroy();
        }
    });


    Element.implement({
        popover: function(html, options){
            var po = this.retrieve('popover');
            if (!po) {
                po = new MooUI.Popover(this, options);
                this.store('popover', po);
            }
            po.show(html, options);
        }
    });

})();