/**
 * user: lobos841@gmail.com
 * date: 12-10-24 上午9:51
 * license: MIT-style
 */

(function () {
    if (!this.MooUI) this.MooUI = {};

    MooUI.Dropdown = new Class({
        Implements: [Options],

        options: {
            dropbox: '.dropdown-menu',
            toggle: '.dropdown-toggle',
            revealClass: 'dropdown-reveal',
            activeClass: 'active',
            reveal: false
        },

        initialize: function (el, options) {
            this.setOptions(options);
            this.handle = document.id(el);
            if (typeOf(this.options.dropbox) == 'string')
                this.dropbox = this.handle.getElement(this.options.dropbox) || this.handle.getNext(this.options.dropbox);
            else
                this.dropbox = document.id(this.options.dropbox);

            if (this.options.reveal || el.hasClass(this.options.revealClass))
                this.fx = new Fx.Reveal(this.dropbox, {duration: 200, transitionOpacity: false});
            var toggle = this.handle.getElement(this.options.toggle) || this.handle;
            toggle.addEvent('click', this.open.bind(this));
        },

        open: function () {
            if (this.isOpen || !this.dropbox) return;

            this.handle.addClass(this.options.activeClass);
            this.isOpen = true;
            this.fx ? this.fx.reveal() : this.dropbox.show();

            var self = this;
            var _close = function () {
                self.close();
                document.removeEvent('click', _close);
            };

            //这里需要delay一下，否则document.click会立刻执行。
            document.addEvent.delay(50, document, ['click', _close]);
        },

        close: function () {
            this.handle.removeClass(this.options.activeClass);
            this.fx ? this.fx.dissolve() : this.dropbox.hide();
            this.isOpen = false;
        }
    });

    Element.implement({
        dropdown: function(options){
            return this.store('dropdown', new MooUI.Dropdown(this, options));
        }
    });
})();
