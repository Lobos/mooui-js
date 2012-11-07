/**
* User: lobos841@gmail.com
* Date: 2011-3-12
*/

(function () {
    Locale.define('zh-CHS', 'MooUI.Table', {
        search: '过滤',
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
            pagination: { size: 0 },
            filterCheckbox: null,
            header: {}
        },

        css: {
            checkbox: 'checkbox',
            checked: 'checked',
            bool: 'bool',
            rows: ['odd', 'even'],
            sort: 'icon-sort',
            sortUp: 'icon-sort-up',
            sortDown: 'icon-sort-down',
            tdTrue: 'icon-ok',
            tdFalse: 'icon-remove',
            singlePage: 'single-page',
            pagination: 'pagination'
        },

        initialize: function (table, options) {
            this.setOptions(options);
            this.table = document.id(table);
            this.createHeader();
            this.request = this.options.request || {};
            this.filterItems = [];

            if (this.options.pageAble) {
                this.createFooter();
                this.request.data = this.request.data || {};
                Object.merge(this.request.data, this.options.pagination);
            }

            if (this.options.filterAble)
                this.createFilter();

            return this;
        },

        createFilter: function () {
            var self = this;

            this.filterBox = new Element('div', {
                'class': 'table-filter'
            }).inject(this.table, 'before');

            if (this.options.filterHide)
                this.filterBox.hide();

            var header = this.options.header || [];
            header.each(function (h) {
                if (!h.filter) return;
                self.filterBox.grab(self.getFilterItem(h));
            });

            new Element('button', {
                'html': Locale.get('MooUI.Table.search'),
                'type': 'button',
                'class': 'btn',
                'events': {
                    'click': function () {
                        self.filter();
                    }
                }
            }).inject(this.filterBox);

            new Element('button', {
                'html': Locale.get('MooUI.Table.clear'),
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
                case 'select':
                    var sel = new Element('div', {
                        'class': 'select'
                    }).inject(el);
                    if (h.filter.width)
                        sel.setStyle('width', h.filter.width);
                    else if (h.type == 'bool')
                        sel.setStyle('width', 40);
                    var select = new MooUI.Select(sel, {
                        name: h.key,
                        title: h.name,
                        'noneData': { text: '&nbsp;', value: ''}
                    });

                    if (h.filter.url)
                        select.load({ url: h.filter.url, method: 'get' });
                    else
                        select.load({
                            json: this.options.filterCheckbox ||
                                [{ value:1, text: Locale.get('MooUI.Table.True') }, { value:0, text: Locale.get('MooUI.Table.False') }]
                        });

                    this.filterItems.push(select);
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
            var thead = new Element('thead');
            var tr = new Element('tr');

            var _crth = function (sort, html, key) {
                var el;
                if (sort) {
                    el = new Element('a', {
                        html: html + '&nbsp;<i class="{0}"></i>'.format(self.css.sort),
                        href: 'javascript:;',
                        events: {
                            click: function () {
                                var icon = this.getElement('i');
                                var isUp = icon.hasClass(self.css.sortUp);
                                tr.getElements('i').set('class', self.css.sort);
                                if (isUp) {
                                    icon.set('class', self.css.sortDown);
                                } else {
                                    icon.set('class', self.css.sortUp);
                                }
                                self.setSort(!isUp, key).load();
                            }
                        }
                    });
                } else {
                    el = new Element('span', { 'html': html });
                }

                return el;
            };

            header.each(function (h) {
                if (h.type == 'hidden') return;
                var th = new Element('th', { styles: h.styles });
                switch (h.type) {
                    case 'checkbox':
                        th.addClass(self.css.checkbox);
                        if (!h.style || !h.styles.width) th.setStyle('width', 14);
                        var cbk = new Element('a', {
                            'href': 'javascript:;',
                            'events': {
                                'click': function () { self.checkAll(this) }
                            }
                        }).inject(th);
                        self.addEvent('load', function () {
                            cbk.removeClass(self.css.checked);
                        });
                        break;
                    default:
                        _crth(h.sort, h.name, h.key).inject(th);
                        break;
                }
                tr.grab(th);
            });

            thead.grab(tr).inject(this.table, 'top');
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

        createBody: function (item, index) {
            var self = this;
            var header = this.options.header || [];
            var tr = new Element('tr', {
                //'class': self.css.rows[index],
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

        setSort: function (isUp, key) {
            var _d = this.request.data;
            _d.size = this.options.pagination.size;
            _d.index = 1;
            _d.sort = { asc: (isUp ? 1 : -1), key: key };

            return this;
        },

        pageChange: function (index) {
            this.load({
                data: { index: index }
            });
        },

        createData: function (json) {
            var body = this.table.getElement('tbody');
            var row_len = this.css.rows.length;
            if (json.status == 1) {
                body.empty();
                json.data.each(function (item, index) {
                    var tr = this.createBody(item, index % row_len);
                    body.grab(tr);
                }.bind(this));
                if (this.page)
                    this.page.change({
                        'table': this,
                        'total': json.total,
                        'index': json.index,
                        'size': json.size
                    });

                /*
                if (this.options.pagination.size >= json.total)
                    this.table.getElement('tfoot').addClass(this.css.singlePage);
                else
                    this.table.getElement('tfoot').removeClass(this.css.singlePage);
                */

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
            this.filterItems.each(function (item) {
                Function.attempt(function () {
                    item.destroy();
                });
            });
        }
    });
})();

