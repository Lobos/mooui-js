/**
* User: lobos841@gmail.com
* Date: 2011-3-12
*/

(function () {
    Locale.define('zh-CHS', 'MooUI_Table', {
        search: '筛选',
        clear: '重置',
        True: '是',
        False: '否'
    });

    if (!this.MooUI) this.MooUI = {};
    MooUI.Table = new Class({
        Implements: [Options, Events],
        options: {
            request: null,
            filterAble: false,
            filterHide: false,
            pageAble: true,
            pagination: { size: 0, index: 1 },
            filterCheckbox: null,
            header: {},
            css: {
                checkbox: 'checkbox',
                checked: 'checked',
                bool: 'bool',

                filterBox: 'table-filter form-inline',

                sort: 'sort',
                sortNormal: 'icon-sort',
                sortUp: 'icon-sort-up',
                sortDown: 'icon-sort-down',
                sortTip: 'sort-tip',

                tdTrue: 'icon-ok',
                tdFalse: 'icon-remove',

                pagination: 'pagination'
            }
        },

        initialize: function (table, options) {
            this.setOptions(options);
            this.css = this.options.css;
            this.table = document.id(table);
            this.createHeader();
            this.request = this.options.request || {};

            if (this.options.pageAble) {
                this.createFooter();
                this.request.data = this.request.data || {};
                Object.merge(this.request.data, {
                    size: this.options.pagination.size,
                    index: this.options.pagination.index
                });
            }

            if (this.options.filterAble)
                this.createFilter();

            return this;
        },

        createFilter: function () {
            var self = this;

            if (!this.table.getElement('caption'))
                new Element('caption', {
                    'class': this.css.filterBox
                }).inject(this.table, 'top');
            this.filterBox = this.table.getElement('caption');

            if (this.options.filterHide)
                this.filterBox.hide();

            var header = this.options.header || [];
            header.each(function (h) {
                if (!h.filter) return;
                self.filterBox.grab(self.getFilterItem(h));
            });

            new Element('button', {
                'html': Locale.get('MooUI_Table.search'),
                'type': 'button',
                'class': 'btn btn-primary',
                'events': {
                    'click': function () {
                        self.filter();
                    }
                }
            }).inject(this.filterBox);

            new Element('button', {
                'html': Locale.get('MooUI_Table.clear'),
                'type': 'button',
                'class': 'btn btn-inverse',
                'events': {
                    'click': function () {
                        self.fireEvent('filterClear');
                        self.filter();
                    }
                }
            }).inject(this.filterBox);

        },

        getFilterItem: function (h) {
            var el = new Element('label', { 'html': h.name + ': ', 'class': 'wrap' });
            switch (h.filter.type) {
                case 'input':
                    var input = new Element('input', {
                        'type': 'text',
                        'title': h.name,
                        'name': h.key
                    }).inject(el);
                    this.addEvent('filterClear', function () {
                        input.set('value', '');
                    });
                    break;
                case 'bool':
                case 'select':
                case 'multi-select':
                    var sel = new Element('div', {
                        'class': 'select'
                    }).inject(el);
                    if (h.filter.width)
                        sel.setStyle('min-width', h.filter.width);
                    else if (h.filter.type == 'bool')
                        sel.setStyle('min-width', 40);
                    else
                        sel.setStyle('min-width', 80);

                    var select,
                        options = {
                        name: h.key,
                        title: h.name,
                        noneData: { text: '&nbsp;', value: ''},
                        onLoad: function () {
                            if (h.filter.def) this.setValue(h.filter.def);
                        }
                    };

                    if (h.filter.type == 'multi-select')
                        select = new MooUI.Select.Multiple(sel, options);
                    else
                        select = new MooUI.Select(sel, options);

                    if (h.filter.data)
                        select.load({ json:h.filter.data });
                    else if (h.filter.url)
                        select.load({ url: h.filter.url, method: 'get' });
                    else if (h.filter.type == 'bool')
                        select.load({
                            json: this.options.filterCheckbox ||
                                [{ value:1, text: Locale.get('MooUI_Table.True') }, { value:0, text: Locale.get('MooUI_Table.False') }]
                        });

                    this.addEvent('filterClear', function () {
                        select.clearValue();
                    });
                    break;
            }
            return el;
        },

        filter: function () {
            var data = {};
            this.filterBox.getElements('input').each(function (el) {
                if (el.get('type') == 'button') return;
                if (!el.get('value')) return;

                data[el.get('name')] = el.get('value');
            });

            this.setFilter(data);
            this.load();
        },

        showFilter: function () {
            this.filterBox.show();
        },

        hideFilter: function () {
            this.filterBox.hide();
        },

        createHeader: function () {
            var self = this;
            var header = this.options.header || [];
            var thead = new Element('thead').inject(this.table, 'top');
            var tr = new Element('tr').inject(thead);

            var _crth = function (th, h) {
                if (h.sort) {
                    var el, tip, icon;
                    var _clearSort = function () {
                        tr.getElements('a > i.' + self.css.sortUp + ', a > i.' + self.css.sortDown).set('class', self.css.sortNormal);
                    };
                    el = new Element('a', {
                        html: h.name,
                        'class': self.css.sort,
                        href: 'javascript:;',
                        events: {
                            click: function () {
                                tip.toggle();
                                tip.isVisible() ? icon.fade('hide') : icon.fade('show');
                            }
                        }
                    }).inject(th);
                    icon = new Element('i', { 'class': self.css.sortNormal }).inject(el);
                    tip = new Element('div', {
                        'class': self.css.sortTip,
                        'styles': {
                            'left': icon.getPosition(th).x
                        }
                    }).inject(el);
                    new Element('i', {
                        'class': self.css.sortUp,
                        'events': {
                            click: function () {
                                self.setSort(true, h.key).load();
                                _clearSort();
                                icon.set('class', self.css.sortUp);
                            }
                        }
                    }).inject(tip);
                    new Element('i', {
                        'class': self.css.sortDown,
                        'events': {
                            click: function () {
                                self.setSort(false, h.key).load();
                                _clearSort();
                                icon.set('class', self.css.sortDown);
                            }
                        }
                    }).inject(tip);
                } else {
                    new Element('span', { 'html':h.name }).inject(th);
                }
            };

            header.each(function (h) {
                if (h.type == 'hidden') return;
                var th = new Element('th', { styles: h.styles }).inject(tr);
                switch (h.type) {
                    case 'checkbox':
                        th.addClass(self.css.checkbox);
                        if (!h.style || !h.styles.width) th.setStyle('width', 14);
                        var cbk = new Element('a', {
                            'href': 'javascript:;',
                            'events': {
                                'click': function () { self.checkAll(this); }
                            }
                        }).inject(th);
                        self.addEvent('load', function () {
                            cbk.removeClass(self.css.checked);
                        });
                        break;
                    default:
                        _crth(th, h);
                        break;
                }
            });

            if (!this.table.getElement('tbody'))
                this.table.grab(new Element('tbody'));
        },

        createFooter: function () {
            var tfoot = new Element('tfoot').inject(this.table, 'bottom');
            var tr = new Element('tr').inject(tfoot);
            var td = new Element('td', {
                'colspan': this.table.getElements('thead th').length,
                'class': this.css.pagination
            }).inject(tr);

            this.page = new MooUI.Pagination(td, this.options.pagination);
            this.page.addEvent('pageChange', this.pageChange.bind(this));
        },

        createBody: function (item) {
            var self = this;
            var header = this.options.header || [];
            var tr = new Element('tr', {
                'events': {
                    'mouseover': function () {
                        this.getElements('td').addClass('highlight');
                    },
                    'mouseout': function () {
                        this.getElements('td').removeClass('highlight');
                    }
                }
            });
            header.each(function (h) {
                if (h.type == 'hidden') return;
                var td = new Element('td', {
                    'styles': h.styles,
                    'class': h['class'] || ''
                });
                switch (h.type) {
                    case 'checkbox':
                        td.addClass(self.css.checkbox);
                        var cbk = new Element('a').store('item', item).inject(td);
                        td.addEvent('click', function () {
                            cbk.toggleClass(self.css.checked);
                            if (h.click) h.click(cbk.hasClass(self.css.checked), item);
                        });
                        break;
                    case 'bool':
                        td.addClass('center');
                        td.grab(new Element('i', { 'class': item[h.key] ? self.css.tdTrue : self.css.tdFalse }));
                        break;
                    case 'template':
                        td.set('html', h.template.substitute(item));
                        break;
                    default:
                        td.set('html', item[h.key]);
                        break;
                }
                tr.grab(td);
            });
            return tr;
        },

        checkAll: function (el) {
            el.toggleClass(this.css.checked);
            if (el.hasClass(this.css.checked)) {
                this.table.getElements('tbody .' + this.css.checkbox + ' > a').addClass(this.css.checked);
                this.table.getElements('tbody .' + this.css.checkbox + ' > a').fireEvent('click');
            } else {
                this.table.getElements('tbody .' + this.css.checkbox + ' > a').removeClass(this.css.checked);
                this.table.getElements('tbody .' + this.css.checkbox + ' > a').fireEvent('click');
            }
        },

        getChecked: function () {
            var items;
            var keys = arguments;
            if (keys.length > 0) {
                items = {};
                Array.each(keys, function (key) {
                    items[key] = [];
                });
            } else {
                items = [];
            }
            this.table.getElements('tbody .' + this.css.checkbox + ' a.' + this.css.checked).each(function (lnk) {
                var data = lnk.retrieve('item');
                if (keys.length > 0) {
                    Array.each(keys, function (key) {
                        items[key].push(data[key]);
                    });
                } else {
                    items.push(data);
                }
            });
            return items;
        },

        getCheckedCount: function () {
            return this.table.getElements('tbody .' + this.css.checkbox + ' a.' + this.css.checked).length;
        },

        setRequest: function (options) {
            Object.merge(this.request, options);
            return this;
        },

        setFilter: function (data) {
            this.request.data = Object.merge({ size: this.options.pagination.size, index: 1 }, data);
            return this;
        },

        setSort: function (asc, key) {
            var _d = this.request.data;
            _d.size = this.options.pagination.size;
            _d.index = 1;
            _d.sort = { asc: (asc ? 1 : -1), key: key };

            return this;
        },

        pageChange: function (index) {
            this.load({
                data: { index: index }
            });
        },

        createData: function (json) {
            var body = this.table.getElement('tbody');
            if (json.status == 1) {
                body.empty();
                json.data.each(function (item, index) {
                    var tr = this.createBody(item);
                    body.grab(tr);
                }.bind(this));
                if (this.page)
                    this.page.change({
                        'table': this,
                        'total': json.total,
                        'index': json.index,
                        'size': json.size
                    });

                this.fireEvent('load', [body.getElements('tr'), json.data]);
            } else {
                Function.attempt(function () {
                    console.log(json.msg);
                });
            }
            this.table.unmask();
            return this;
        },

        load: function (options) {
            options = options || {};
            var self = this;
            Function.attempt(function () {
                self.table.loading(); //Element.loading
            }, function () {
                self.table.mask();
            });
            if (options.json) {
                this.createData(options.json);
                return this;
            }

            this.request.onComplete = this.createData.bind(this);
            Object.merge(this.request, options);
            new Request.JSON(this.request).send();
            return this;
        },

        destroy: function () {
            this.table.destroy();
        }
    });
})();

