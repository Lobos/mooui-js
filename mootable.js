/**
* User: lobos841@gmail.com
* Date: 2011-3-12
*/

(function () {
    Locale.define('zh-CHS', 'MooTable', {
        search: '过滤',
        clear: '重置',
        True: '是',
        False: '否'
    });

    window.MooTable = new Class({
        Implements: [Options, Events],
        options: {
            request: null,
            filterAble: false,
            filterHide: false,
            pageAble: true,
            page: { size: 0 },
            showAccount: true,
            filterCheckbox: null
        },

        css: {
            checkbox: 'checkbox',
            bool: 'bool',
            rows: ['odd', 'even'],
            order: 'sort-none',
            orderUp: 'sort-up',
            orderDown: 'sort-down',
            singlePage: 'single-page'
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
                Object.merge(this.request.data, this.options.page);
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
                'html': Locale.get('MooTable.search'),
                'type': 'button',
                'class': 'btn',
                'events': {
                    'click': function () {
                        self.filter();
                    }
                }
            }).inject(this.filterBox);

            new Element('button', {
                'html': Locale.get('MooTable.clear'),
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
                    var select = new MooSelect(sel, {
                        name: h.key,
                        title: h.name,
                        'noneData': { text: '&nbsp;', value: ''}
                    });

                    if (h.filter.url)
                        select.load({ url: h.filter.url, method: 'get' });
                    else
                        select.load({
                            json: this.options.filterCheckbox ||
                                [{ value:1, text: Locale.get('MooTable.True') }, { value:0, text: Locale.get('MooTable.False') }]
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
                        html: html + '<i class="{0}"></i>'.format(self.css.order),
                        href: 'javascript:;',
                        events: {
                            click: function () {
                                var icon = this.getElement('i');
                                var isUp = icon.hasClass(self.css.orderUp);
                                tr.getElements('i').set('class', self.css.order);
                                if (isUp) {
                                    icon.set('class', self.css.orderDown);
                                } else {
                                    icon.set('class', self.css.orderUp);
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
                        new Element('a', {
                            'class': self.css.checkbox,
                            'href': 'javascript:;',
                            'events': {
                                'click': function () { self.checkAll(this) }
                            }
                        }).inject(th);
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
                'colspan': this.options.header.length
            }).inject(tr);
            this.page = new Pager(td, {
                size: this.options.page.size,
                showAccount: this.options.showAccount,
                onPageChange: this.pageChange.bind(this)
            });
        },

        createBody: function (item, index) {
            var self = this;
            var header = this.options.header || [];
            var tr = new Element('tr', {
                'class': self.css.rows[index],
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
                        td.grab(new Element('a', {
                            'class': self.css.checkbox,
                            'href': 'javascript:;',
                            'events': {
                                'click': function () {
                                    if (this.hasClass('checked'))
                                        this.removeClass('checked');
                                    else
                                        this.addClass('checked');
                                    if (h.click) h.click(this.hasClass('checked'), item);
                                }
                            }
                        }).store('item', item));
                        break;
                    case 'bool':
                        td.addClass('center');
                        td.grab(new Element('i', { 'class': 'icon-' + (item[h.key] ? 't' : 'x') }));
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
            if (el.hasClass('checked')) {
                el.removeClass('checked');
                this.table.getElements('tbody .' + this.css.checkbox).addClass('checked');
                this.table.getElements('tbody .' + this.css.checkbox).fireEvent('click');
            } else {
                el.addClass('checked');
                this.table.getElements('tbody .' + this.css.checkbox).removeClass('checked');
                this.table.getElements('tbody .' + this.css.checkbox).fireEvent('click');
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
            this.table.getElements('tbody .' + this.css.checkbox).each(function (lnk) {
                if (lnk.hasClass('checked')) {
                    var data = lnk.retrieve('item');
                    if (keys.length > 0) {
                        Array.each(keys, function (key) {
                            items[key].push(data[key]);
                        });
                    } else {
                        items.push(data);
                    }
                }
            });
            return items;
        },

        getCheckedCount: function () {
            return this.table.getElements('tbody .' + this.css.checkbox + '.checked').length;
        },

        setRequest: function (options) {
            Object.merge(this.request, options);
            return this;
        },

        setFilter: function (data) {
            this.request.data = Object.merge({ size: this.options.page.size, index: 1 }, data);
            return this;
        },

        setSort: function (isUp, key) {
            var _d = this.request.data;
            _d.size = this.options.page.size;
            _d.index = 1;
            _d.sort = { order: isUp ? 1 : -1, key: key };

            return this;
        },

        pageChange: function (index) {
            this.load({
                data: { index: index }
            });
        },

        load: function (options) {
            options = options || {};
            var self = this;
            var body = this.table.getElement('tbody');
            Function.attempt(function () {
                self.table.loading(); //Element.loading
            }, function () {
                self.table.mask();
            });
            var row_len = self.css.rows.length;
            function success(json) {
                if (json.status == 1) {
                    body.empty();
                    json.data.each(function (item, index) {
                        var tr = self.createBody(item, index % row_len);
                        body.grab(tr);
                    });
                    if (self.page)
                        self.page.change({
                            'table': self,
                            'total': json.total,
                            'index': json.index,
                            'size': json.size
                        });

                    if (self.options.page.size >= json.total)
                        self.table.getElement('tfoot').addClass(self.css.singlePage);
                    else
                        self.table.getElement('tfoot').removeClass(self.css.singlePage);

                    self.fireEvent('load', [body.getElements('tr'), json.data]);
                } else {
                    Function.attempt(function () {
                        console.log(json.msg);
                    });
                }
                self.table.unmask();
                return self;
            }
            if (options.json) {
                success(options.json);
                return this;
            }

            this.request.onComplete = success;
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

