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
            filterAble: true,
            filterHide: false,
            toggleItems: false,
            pageAble: true,
            pagination: { size: 0, index: 1 },
            filterCheckbox: null,
            header: {},
            css: {
                checkbox: 'checkbox',
                checked: 'checked',
                bool: 'bool',

                rowActive: 'active',

                filterBox: 'table-filter form-inline',
                toggleWrapper: 'toggle-wrapper',
                toggleOpen: 'toggle-open',
                toggleClose: 'toggle-close',

                sort: 'sort',
                sortNormal: 'icon-sort',
                sortUp: 'icon-caret-up',
                sortDown: 'icon-caret-down',
                sortTip: 'sort-tip',

                tdTrue: 'icon-ok',
                tdFalse: 'icon-remove',

                pagination: 'pagination pagination-small'
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
                this._createFilter();

            if (this.options.toggleItems)
                this._createToggleItems();

            return this;
        },

        _getCaption: function () {
            if (!this.table.getElement('caption'))
                new Element('caption').inject(this.table, 'top');
            return this.table.getElement('caption');
        },

        _createFilter: function () {
            var self = this;

            this.filterBox = new Element('div', {
                'class': this.css.filterBox
            }).inject(this._getCaption());

            if (this.options.filterHide)
                this.filterBox.hide();

            var header = this.options.header || [];
            var _count = 0;
            header.each(function (h) {
                if (!h.filter) return;
                self.filterBox.grab(self._getFilterItem(h));
                _count++;
            });
            if (_count == 0) this.filterBox.hide();

            new Element('button', {
                'html': Locale.get('MooUI_Table.search'),
                'type': 'button',
                'class': 'btn',
                'events': {
                    'click': function () {
                        self.filter();
                    }
                }
            }).inject(this.filterBox);

            new Element('button', {
                'html': Locale.get('MooUI_Table.clear'),
                'type': 'button',
                'class': 'btn',
                'events': {
                    'click': function () {
                        self.fireEvent('filterClear');
                        self.filter();
                    }
                }
            }).inject(this.filterBox);
        },

        _createToggleItems: function () {
            var self = this;

            var wrap = new Element('div', {
                'class': this.css.toggleWrapper
            }).inject(this._getCaption());

            var header = this.options.header || [];
            header.each(function (h) {
                if (!h.name || h.type == 'none') return;
                new Element('a', {
                    'class': (h['class'] && h['class'].clean().contains('hidden')) ? self.css.toggleClose : self.css.toggleOpen,
                    href: 'javascript:;',
                    html: '<i class="icon-"></i> {0}'.format(h.name),
                    events: {
                        'click': function () {
                            var index = 0,
                                th = null;

                            self.table.getElements('thead th').each(function (el, i) {
                                if (el.get('rel') != h.key) return;
                                th = el;
                                index = i;
                            });

                            if (this.get('class') == self.css.toggleOpen) {
                                this.set('class', self.css.toggleClose);
                                th.addClass('hidden');
                                self.toggleColumn(index, true);
                            } else {
                                this.set('class', self.css.toggleOpen);
                                th.removeClass('hidden');
                                self.toggleColumn(index, false);
                            }
                        }
                    }
                }).inject(wrap);
            });
        },

        _getFilterItem: function (h) {
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

        toggleColumn: function (index, hidden) {
            this.table.getElements('tbody tr').each(function (tr) {
                var td = tr.getElements('td')[index];
                if (hidden) td.addClass('hidden');
                else td.removeClass('hidden');
            });
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
            return this;
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
                        href: 'javascript:;',
                        events: {
                            click: function () {
                                var sort = icon.hasClass(self.css.sortDown);
                                _clearSort();
                                self.setSort(sort, h.key).load();
                                icon.set('class', sort ? self.css.sortUp : self.css.sortDown);
                            }
                        }
                    }).inject(th);
                    icon = new Element('i', { 'class': self.css.sortNormal }).inject(el);
                } else {
                    new Element('span', { 'html':h.name }).inject(th);
                }
            };

            header.each(function (h) {
                if (h.type == 'none') return;
                var th = new Element('th', {
                    'class': h['class'] || '',
                    styles: h.styles,
                    rel: h.key
                }).inject(tr);
                switch (h.type) {
                    case 'checkbox':
                        th.addClass(self.css.checkbox);
                        if (!h.style || !h.styles.width) th.setStyle('width', 14);
                        var cbk = self.checkAllHandle = new Element('a', {
                            'href': 'javascript:;',
                            'events': {
                                'click': function () {
                                    self.checkAll(!this.hasClass(self.css.checked));
                                }
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
                if (h.type == 'none') return;
                var td = new Element('td', {
                    'styles': h.styles,
                    'class': h['class'] || ''
                });
                switch (h.type) {
                    case 'checkbox':
                        td.addClass(self.css.checkbox);
                        var cbk = new Element('a').store('item', item).inject(td);
                        tr.addEvent('click', function () {
                            tr.toggleClass(self.css.rowActive);
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

        checkAll: function (b) {
            if (b) {
                this.checkAllHandle.addClass(this.css.checked);
                this.table.getElements('tbody .' + this.css.checkbox + ' > a').addClass(this.css.checked);
                this.table.getElements('tbody tr').addClass(this.css.rowActive);
            } else {
                this.checkAllHandle.removeClass(this.css.checked);
                this.table.getElements('tbody .' + this.css.checkbox + ' > a').removeClass(this.css.checked);
                this.table.getElements('tbody tr').removeClass(this.css.rowActive);
            }
            this.table.getElements('tbody .' + this.css.checkbox + ' > a').fireEvent('click');
            return this;
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

