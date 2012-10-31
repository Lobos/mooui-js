/*
 * User: lobos841@gmail.com
 * Date: 11-5-1
 * license: MIT License
 */
(function () {

if (!this.MooUI) this.MooUI = {};

MooUI.Select = new Class({
    Implements: [Options, Events],
    options: {
        name: '',
        boxWrapper: null,
        maxHeight: 200,
        borderFix: 1,
        changeValue: true,
        styleClass: {
            //box: 'select-box',
            box: 'dropdown-menu',
            inner: 'select-inner'
        },
        request: {}/*,
        noneData: { text: '', value: '' },
        data: [{text:'', 'class':'', value:'', events:{}}],
        validate: null,
        onChange: function (item) {},
        */
    },
    initialize: function (container, options) {
        var self = this;
        this.setOptions(options);
        this.container = document.id(container);
        var initTxt = this.container.get('html');

        this.container.empty();

        this.inner = new Element('div', {
            'html': initTxt,
            'class': this.options.styleClass.inner,
            'events': {
                'click': function () {
                    self.open();
                }
            }
        }).inject(this.container);

        new Element('b', { 'class': 'caret' }).inject(this.container);

        this.valueInput = new Element('input', {
            'type': 'text',
            'id': String.uniqueID(),
            'name': this.options.name,
            'title': this.options.title,
            'styles': {
                'display': 'none'
            }
        }).inject(this.container);

        if (this.options.validate)
            this.valueInput.set('validate', this.options.validate.replace('__target__', this.container.get('id')));

        //this.boxWrapper = document.id(this.options.boxWrapper) || document.body;
        this.box = new Element('ul', {
            'class': this.options.styleClass.box,
            'styles': {
                'width': this.options.width || (this.container.outerWidth() - (this.container.getStyle('border-left-width').toInt()||0) * 2),
                'max-height': this.options.maxHeight,
                'overflow': 'auto'
            }
        }).inject(this.container);

        if (this.options.data) this.createData(this.options.data);

        return this;
    },
    createData: function (data) {
        var self = this;
        this.data = data;
        this.box.empty();
        this.links = [];

        if (!data) return;
        if (this.options.noneData)
            data.unshift(this.options.noneData);
        data.each(function (item) {
            var lnk = new Element('li').grab(new Element('a', {
                'html': item.text,
                'href': 'javascript:;',
                'events': item.events
            }));
            if (self.options.changeValue) {
                lnk.addEvent('click', function () {
                    self.item = item;
                    self.setItem(item);
                });
            }
            lnk.store('text', item.text);
            self.box.grab(lnk);
            self.links.push(lnk);
        });
        this.setBoxPosition();
    },
    setItem: function (item) {
        this.valueInput.set('value', item.value === 0 ? '0': item.value);
        this.valueInput.store('data', item);
        this.inner.set('html', item.text);
        this.fireEvent('change', item);
        this.close();
        return this;
    },
    setValue: function (valuelist, isTxt) {
        if (valuelist == undefined) return this;
        var self = this;
        if (typeOf(valuelist) == 'string')
            valuelist = [valuelist];
        valuelist.each(function (value) {
            Array.each(self.data || [], function (item) {
                var val = isTxt ? item.text : item.value;
                if (val == value) {
                    self.setItem(item);
                }
            });
        });
        return this;
    },
    getItem: function () {
        return this.valueInput.retrieve('data');
    },
    getValue: function () {
        return this.valueInput.get('value');
    },
    getValueElement: function () {
        return this.valueInput;
    },
    clearValue: function () {
        this.valueInput.set('value', '');
        this.inner.set('html', '');
        return this;
    },
    load: function (options) {
        options = options || {};
        if (options.json) {
            this.createData(options.json);
            return this;
        }

        var self = this;
        var request_options = {
            onComplete: function (json) {
                if (json.status == 1)
                    self.createData(json.data);
                else
                    alert(json.msg);
                return this;
            }
        };
        options = Object.merge(this.options.request, options);
        Object.merge(request_options, options);
        new Request.JSON(request_options).send();

        return this;
    },
    open: function () {
        if (this.isOpen) return;
        this.isOpen = true;
        this.box.show();

        var self = this;
        var _close = function () {
            self.close();
            document.removeEvent('click', _close);
        };

        //这里需要delay一下，否则document.click会立刻执行。
        document.addEvent.delay(50, document, ['click', _close]);
    },
    close: function (event) {
        //if (event && this.container.contains(event.target))
        //    return false;
        this.box.hide();
        this.isOpen = false;
    },
    setBoxPosition: function () {
        if (Browser.ie) {
            if (this.box.getStyle('height').toInt() >= this.options.maxHeight)
                this.box.setStyle('height', this.options.maxHeight);
            else
                this.box.setStyle('height', 'auto');
        }
        this.box.topZIndex();

        /*
        var pos = this.container.getPosition(this.boxWrapper);
        var bws = this.boxWrapper == document.body ? { x:0, y:0 } : this.boxWrapper.getScroll();
        var left = pos.x - this.box.getStyle('border-left').toInt() + bws.x;
        var top = pos.y + this.container.outerHeight() + bws.y;

        if (top + this.box.getStyle('height').toInt() > this.boxWrapper.getSize().y + this.boxWrapper.getScroll().y)
            top = pos.y - this.box.outerHeight() + bws.y;

        this.box.setStyles({
            'visibility': 'visible',
            'left': left + this.options.borderFix,
            'top': top,
            'z-index': Object.topZIndex()
        });
        */
    },
    destroy: function () {
        document.id(this.container).destroy();
        this.box.destroy();
        Function.attempt(function () {
            this._detachEvents();
        }.bind(this));
        Function.attempt(function () {
            this.subSelect.destroy();
        }.bind(this));
    },
    _detachEvents: function () {
    }
});

MooUI.Select.Multiple = new Class({
    Extends: MooUI.Select,
    options: {},
    initialize: function (container, options) {
        this.parent(container, options);
    },
    createData: function (data) {
        var self = this;
        this.data = data;
        this.checkedItems = {};
        this.box.empty();
        this.links = {};

        if (!data) return;
        if (this.options.noneData)
            data.unshift(this.options.noneData);
        data.each(function (item) {
            var lnk = new Element('a', {
                'html': item.text,
                'href': 'javascript:;',
                'events': item.events
            });
            if (self.options.changeValue) {
                lnk.addEvent('click', function () {
                    self.item = item;
                    if (lnk.hasClass('checked'))
                        self.uncheckItem(lnk, item);
                    else
                        self.checkItem(lnk, item);
                });
            }
            lnk.store('text', item.text);
            self.box.grab(lnk);
            self.links[item.value] = lnk;
        });
    },
    checkItem: function (el, item) {
        el.addClass('checked');
        this.checkedItems[item.value] = item;
        this.showCheckValue();
    },
    uncheckItem: function (el, item) {
        el.removeClass('checked');
        delete this.checkedItems[item.value];
        this.showCheckValue();
    },
    showCheckValue: function () {
        var val = [];
        var txt = [];
        for (var i in this.checkedItems) {
            var item = this.checkedItems[i];
            val.push(item.value);
            txt.push(item.text);
        }
        this.valueInput.set('value', val.join(','));
        this.inner.set('html', txt.join(','));
    },
    setValue: function (valuelist) {
        if (!valuelist) return this;
        var self = this;
        if (typeOf(valuelist) == 'string')
            valuelist = valuelist.split(',');
        valuelist.each(function (value) {
            Array.each(self.data || [], function (item) {
                if (value == item.value) {
                    self.checkItem(self.links[value], item);
                }
            });
        });
        return this;
    },
    close: function (event) {
        if (event && (this.container.contains(event.target) || this.box.contains(event.target)))
            return false;

        this.box.setStyles({
            'visibility': 'hidden',
            'left': -9999,
            'right': -9999
        });
        this._detachEvents();
        this.opened = false;
    }
});

MooUI.Select.Input = new Class({
    Extends: MooUI.Select,
    options: {},
    initialize: function (container, options) {
        this.parent(container, options);
        this.valueInput.setStyle('display', 'block').inject(this.inner.empty());
        this.valueInput.addEvent('keyup', this.filter.bind(this));
    },
    setValue: function (txt) {
        this.valueInput.set('value', txt);
    },
    setItem: function (item) {
        this.valueInput.set('value', item.text);
    },
    clearValue: function () {
        this.valueInput.set('value', '');
        return this;
    },
    filter: function () {
        var val = this.valueInput.get('value').toLowerCase();
        this.links.each(function (lnk) {
            if (lnk.get('text').toLowerCase().contains(val)) {
                lnk.setStyle('display', 'block');
            } else {
                lnk.setStyle('display', 'none');
            }
        });
        this.setBoxPosition();
    }
});

MooUI.Select.Combine = new Class({
    Extends: Options,
    options: {
        request: {},
        width: 200,
        name: '',
        validate: '',
        init: {},
        created: function () {},
        change: function () {}
    },
    initialize: function (container, parentSelect, options) {
        this.setOptions(options);
        this.container = container;
        var init = this.options.init;
        this.createSelector(init.value, parentSelect, init.data);
    },
    createSelector: function (value, parentSelector, initdata) {
        var self = this;
        var request = this.options.request;
        new Request.JSON({
            url: request.url,
            method: 'post',
            data: JSON.decode(request.data.format(value)),
            onSuccess: function (json) {
                if (json.length == 0) return;
                var div = new Element('div', {
                    'class': 'select',
                    'id': String.uniqueID(),
                    'styles': { 'width': self.options.width }
                });

                var select = new MooUI.Select(div, { name: self.options.name, validate: self.options.validate, onChange: function (item) {
                    if (self.options.change)
                        self.options.change(item)
                    if (select.subSelect)
                        select.subSelect.destroy();
                    self.createSelector(item.value, select, initdata);
                }
                }).load({ json: json });
                if (parentSelector) parentSelector.subSelect = select;
                div.inject(self.container);
                if (initdata)
                    select.setValue(initdata);

                if (self.options.created)
                    self.options.created(select);
            }
        })
        .send();
    }
});
})();
