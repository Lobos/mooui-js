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
            destroyOnClose: false
        },

        initialize: function (el, options) {
            this.setOptions(options);
            this.element = document.id(el);
        },

        createPop: function (html) {
            this.pop = new Element('div', {
                'class': 'popover',
                html: html || this.options.html,
                events: {
                    click: function () {
                        this.close();
                    }.bind(this)
                }
            }).inject(this.element, 'after');
            this.pop.addClass(this.options.placement);
        },

        show: function (html, options) {
            this.setOptions(options);
            if (!this.pop) this.createPop(html);
            else if (html) this.pop.set('html', html);

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
            this.pop.show();
        },

        close: function () {
            if (this.options.destroyOnClose) {
                if (this.pop) this.pop.destroy();
                this.pop = null;
            } else {
                this.pop.hide();
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