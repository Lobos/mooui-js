/*
---
description: This provides a simple Drop Down menu with infinit levels

license: MIT-style

authors:
- Arian Stolwijk

requires:
  - Core/Class.Extras
  - Core/Element.Event
  - Core/Selectors

provides: [MooDropMenu, Element.MooDropMenu]

...
*/

var MooDropMenu = new Class({

	Implements: [Options, Events],

	options: {
		onOpen: function(el){
			el.addClass('open');
		},
		onClose: function(el){
			el.removeClass('open');
		},
		onInitialize: function(el){
			el.removeClass('open');
		},
		mouseoutDelay: 200,
		mouseoverDelay: 0,
		listSelector: 'ul',
		itemSelector: 'li',
		openEvent: 'mouseenter',
		closeEvent: 'mouseleave'
	},

	initialize: function(menu, options, level){
		this.setOptions(options);
		options = this.options;

		var menu = this.menu = document.id(menu);

		menu.getElements(options.itemSelector + ' > ' + options.listSelector).each(function(el){

			this.fireEvent('initialize', el);

			var parent = el.getParent(options.itemSelector),
                self = this,
                _k = 'DropDownOpen';

            parent.addEvent('click', function () {
                if (parent.retrieve(_k)) return;
                var selector = el.getParent(options.itemSelector);

                var _close = function (event) {
                    if (event.target == selector.getElement('a'))
                        return;
                    self.fireEvent('close', selector);
                    parent.store(_k, false);
                    document.id(document.body).removeEvent('click', _close);
                };
                document.id(document.body).addEvent('click', _close);
                parent.store(_k, true);
                this.fireEvent('open', selector);
            }.bind(this));

			/*parent.addEvent(options.openEvent, function(){
				parent.store('DropDownOpen', true);

				clearTimeout(timer);
				if (options.mouseoverDelay) timer = this.fireEvent.delay(options.mouseoverDelay, this, ['open', el]);
				else this.fireEvent('open', el.getParent(options.itemSelector));

			}.bind(this)).addEvent(options.closeEvent, function(){
				parent.store('DropDownOpen', false);

				clearTimeout(timer);
				timer = (function(){
					if (!parent.retrieve('DropDownOpen')) this.fireEvent('close', el.getParent(options.itemSelector));
				}).delay(options.mouseoutDelay, this);

			}.bind(this));*/

		}, this);
	},

    close: function () {
        this.menu.getElements(this.options.itemSelector).removeClass('open');
    },

    open: function (el) {
        var self = this;
        var _close = function (event) {
            if (el.contains(event.target))
                return;
            self.fireEvent('close', el);
            document.body.removeEvent('click', _close);
        };
        document.body.addEvent('click', _close);
        parent.store('DropDownOpen', true);
        this.fireEvent('open', el);
    },

	toElement: function(){
		return this.menu
	}

});

/* So you can do like this $('nav').MooDropMenu(); or even $('nav').MooDropMenu().setStyle('border',1); */
Element.implement({
	MooDropMenu: function(options){
		return this.store('MooDropMenu', new MooDropMenu(this, options));
	}
});
