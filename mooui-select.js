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
        name: '', //required
        maxHeight: 200,
        borderFix: 1,
        changeValue: true,
        styleClass: {
            box: 'dropdown-menu',
            inner: 'select-inner',
            checked: 'checked'
        },
        autoLoad: false,
        request: {}/*,
        noneData: { text: '', value: '' },
        data: [{text:'', 'class':'', value:'', events:{}}],
        validate: null,
        onChange: function (item) {},
        onLoad: function () {}
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

        this.valueInput = new Element('input', {
            'type': 'text',
            'id': String.uniqueID(),
            'name': this.options.name,
            'title': this.options.title,
            'styles': {
                'display': 'none'
            }
        }).inject(this.container);

        if (this.options.validate) {
            this.valueInput.set('validate', this.options.validate.replace('__target__', this.container.get('id')));
        }

        this.box = new Element('ul', {
            'class': this.options.styleClass.box,
            'styles': {
                'width': this.options.width || (this.container.outerWidth() - (this.container.getStyle('border-left-width').toInt()||0) * 2),
                'max-height': this.options.maxHeight,
                'overflow': 'auto',
                'z-index': Object.topZIndex()
            }
        }).inject(this.container);

        if (this.options.data) this.createData(this.options.data);
        else if (this.options.autoLoad) this.load();

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

        this.fireEvent('load');
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
        this.valueInput.store('data', null);
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

        var _error = function (msg, txt) {
            Function.attempt(
                function () {
                    console.log(msg);
                    if (txt) console.log(txt);
                },
                function () {
                    alert(msg);
                }
            );
        };
        var request_options = {
            onComplete: function (json) {
                if (json.status == 1)
                    self.createData(json.data);
                else
                    _error(json.msg);
                return this;
            },
            onError: _error
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
        var _close = this._close = function (event) {
            self.close(event);
        };

        //这里需要delay一下，否则document.click会立刻执行。
        document.addEvent.delay(50, document, ['click', _close]);
    },
    close: function () {
        this.box.hide();
        this.isOpen = false;
        this._detachEvents();
    },
    setBoxPosition: function () {
        if (Browser.Engine.trident4) {
            if (this.box.getStyle('height').toInt() >= this.options.maxHeight)
                this.box.setStyle('height', this.options.maxHeight);
            else
                this.box.setStyle('height', 'auto');
        }
    },
    destroy: function () {
        //this.box.destroy();
        document.id(this.container).destroy();
        Function.attempt(function () {
            this._detachEvents();
        }.bind(this));
        Function.attempt(function () {
            this.subSelect.destroy();
        }.bind(this));
    },
    _detachEvents: function () {
        document.removeEvent('click', this._close);
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
            var lnk = new Element('li').grab(new Element('a', {
                'html': item.text,
                'href': 'javascript:;',
                'events': item.events
            }));
            if (self.options.changeValue) {
                lnk.addEvent('click', function () {
                    self.item = item;
                    if (lnk.hasClass(self.options.styleClass.checked))
                        self.uncheckItem(lnk, item);
                    else
                        self.checkItem(lnk, item);
                });
            }
            lnk.store('text', item.text);
            self.box.grab(lnk);
            self.links[item.value] = lnk;
        });

        this.fireEvent('load');
    },
    checkItem: function (el, item, lazy) {
        el.addClass(this.options.styleClass.checked);
        this.checkedItems[item.value] = item;
        if (!lazy)
            this.showCheckValue();
    },
    uncheckItem: function (el, item) {
        el.removeClass(this.options.styleClass.checked);
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
        this.fireEvent('change', [this._getCheckedItemArray()]);
    },
    _getCheckedItemArray: function () {
        var items = [];
        Object.each(this.checkedItems, function (item) {
            items.push(item);
        });
        return items;
    },
    setValue: function (valuelist) {
        if (!valuelist) return this;
        var self = this;
        if (typeOf(valuelist) == 'string')
            valuelist = valuelist.split(',');
        valuelist.each(function (value) {
            Array.each(self.data || [], function (item) {
                if (value == item.value) {
                    self.checkItem(self.links[value], item, true);
                }
            });
        });
        this.showCheckValue();
        return this;
    },
    clearValue: function () {
        this.box.getElements('li').removeClass(this.options.styleClass.checked);
        this.checkedItems = {};
        this.showCheckValue();
        return this;
    },
    close: function (event) {
        if (event && this.box.contains(event.target))
            return false;

        this.parent(event);
    }
});

MooUI.Select.Input = new Class({
    Extends: MooUI.Select,
    options: {
        styleClass: {
            input: 'select-input'
        },
        size: 50,
        ajaxFilter: false
    },
    initialize: function (container, options) {
        this.parent(container, options);
        this.inner.addClass(this.options.styleClass.input);
        this.valueInput.setStyle('display', 'block').inject(this.inner.empty());
        this.valueInput.addEvent('keyup', this.filter.bind(this));
    },
    setValue: function (txt) {
        this.valueInput.set('value', txt);
    },
    setItem: function (item) {
        this.valueInput.set('value', item.text);
        this.filter();
    },
    clearValue: function () {
        this.valueInput.set('value', '');
        return this;
    },
    filter: function () {
        var val = this.valueInput.get('value').toLowerCase();
        if (this.options.ajaxFilter) {
            var data = { size: this.options.size };
            data[this.options.name] = val;
            var options = Object.merge(Object.clone(this.options.request.data || {}), data);
            this.load(options);
        } else {
            this.links.each(function (lnk) {
                if (lnk.get('text').toLowerCase().contains(val)) {
                    lnk.setStyle('display', 'block');
                } else {
                    lnk.setStyle('display', 'none');
                }
            });
            this.setBoxPosition();
        }
    }
});

//多级联动的Select，未测试完全，慎用。
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
                        self.options.change(item);
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
