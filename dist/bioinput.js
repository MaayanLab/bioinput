'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function ($, Bloodhound) {
  if ($ === undefined) {
    throw new Error('BioInput requires jQuery and it is currently undefined.');
  }
  if (Bloodhound === undefined) {
    throw new Error('BioInput requires Bloodhound and it is currently undefined. ' + 'This is included with the latest version of typeahead.js');
  }

  function makeOptionItemFunction(options, key) {
    if (typeof options[key] !== 'function') {
      (function () {
        var propertyName = options[key];
        options[key] = function (item) {
          return item[propertyName];
        };
      })();
    }
  }

  function makeOptionFunction(options, key) {
    if (typeof options[key] !== 'function') {
      (function () {
        var value = options[key];
        options[key] = function () {
          return value;
        };
      })();
    }
  }

  var htmlEncodeContainer = $('<div />');
  function htmlEncode(value) {
    if (value) {
      return htmlEncodeContainer.text(value).html();
    }
    return '';
  }

  function getCaretPosition(oField) {
    var iCaretPos = 0;
    if (document.selection) {
      oField.focus();
      var oSel = document.selection.createRange();
      oSel.moveStart('character', -oField.value.length);
      iCaretPos = oSel.text.length;
    } else if (oField.selectionStart || oField.selectionStart === '0') {
      iCaretPos = oField.selectionStart;
    }
    return iCaretPos;
  }

  function keyCombinationInList(keyPressEvent, lookupList) {
    var found = false;
    $.each(lookupList, function (index, keyCombination) {
      if (typeof keyCombination === 'number' && keyPressEvent.which === keyCombination) {
        found = true;
        return false;
      }

      if (keyPressEvent.which === keyCombination.which) {
        var alt = !keyCombination.hasOwnProperty('altKey') || keyPressEvent.altKey === keyCombination.altKey;
        var shift = !keyCombination.hasOwnProperty('shiftKey') || keyPressEvent.shiftKey === keyCombination.shiftKey;
        var ctrl = !keyCombination.hasOwnProperty('ctrlKey') || keyPressEvent.ctrlKey === keyCombination.ctrlKey;
        if (alt && shift && ctrl) {
          found = true;
          return false;
        }
      }
    });

    return found;
  }

  var defaultOptions = {
    tagClass: function tagClass() {
      return 'bioinput-label bioinput-label-info';
    },
    focusClass: 'focus',
    itemValue: function itemValue(item) {
      return item ? item.toString() : item;
    },
    itemText: function itemText(item) {
      return this.itemValue(item);
    },
    itemTitle: function itemTitle() {
      return null;
    },
    freeInput: true,
    addOnBlur: true,
    maxTags: undefined,
    maxChars: undefined,
    confirmKeys: [13, 44],
    delimiter: ',',
    delimiterRegex: null,
    cancelConfirmKeysOnEmpty: false,
    onTagExists: function onTagExists(item, $tag) {
      return $tag.hide().fadeIn();
    },
    trimValue: false,
    allowDuplicates: false
  };

  function TagsInput(element, options) {
    this.isInit = true;
    this.entitiesArray = [];

    this.$element = $(element);
    this.$element.hide();

    this.objectItems = options && options.itemValue;
    this.placeholderText = element.hasAttribute('placeholder') ? this.$element.attr('placeholder') : '';
    this.inputSize = Math.max(1, this.placeholderText.length);

    this.$container = $('<div class="bioinput"></div>');
    this.$tagList = $('<ul class="bioinput-tag-list"></ul>').appendTo(this.$container);
    this.$input = $('<input type="text" placeholder="' + this.placeholderText + '"/>').appendTo(this.$container);

    this.$element.before(this.$container);

    this.build(options);
    this.isInit = false;
  }

  TagsInput.prototype = {
    constructor: TagsInput,

    add: function add(inputItem, dontPushVal, options) {
      var item = inputItem;
      var self = this;

      if (self.options.maxTags && self.entitiesArray.length >= self.options.maxTags) {
        return;
      }

      if (item !== false && !item) {
        return;
      }

      if (typeof item === 'string' && self.options.trimValue) {
        item = $.trim(item);
      }

      if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object' && !self.objectItems) {
        throw new Error("Can't add objects when itemValue option is not set");
      }

      if (item.toString().match(/^\s*$/)) {
        return;
      }

      if (typeof item === 'string' && this.$element[0].tagName === 'INPUT') {
        var delimiter = self.options.delimiterRegex ? self.options.delimiterRegex : self.options.delimiter;
        var entities = item.split(delimiter);
        if (entities.length > 1) {
          for (var i = 0; i < entities.length; i++) {
            this.add(entities[i], true);
          }

          if (!dontPushVal) {
            self.pushVal();
          }
          return;
        }
      }

      var itemValue = self.options.itemValue(item);
      var itemText = self.options.itemText(item);
      var tagClass = self.options.tagClass(item);
      var itemTitle = self.options.itemTitle(item);

      var existing = $.grep(self.entitiesArray, function (searchItem) {
        return self.options.itemValue(searchItem) === itemValue;
      })[0];
      if (existing && !self.options.allowDuplicates) {
        if (self.options.onTagExists) {
          var $existingTag = $('.tag', self.$container).filter(function () {
            return $(this).data('item') === existing;
          });
          self.options.onTagExists(item, $existingTag);
        }
        return;
      }

      if (self.entities().toString().length + item.length + 1 > self.options.maxInputLength) {
        return;
      }

      var beforeItemAddEvent = new $.Event('beforeItemAdd', { item: item, cancel: false, options: options });
      self.$element.trigger(beforeItemAddEvent);
      if (beforeItemAddEvent.cancel) {
        return;
      }

      self.entitiesArray.push(item);

      var $tag = $('<li class="tag ' + htmlEncode(tagClass) + (itemTitle !== null ? '" title="' + itemTitle : '') + '">' + htmlEncode(itemText) + '<span data-role="remove"></span></li>');
      $tag.data('item', item);
      self.$tagList.append($tag);
      $tag.after(' ');

      if (!dontPushVal) {
        self.pushVal();
      }

      if (self.options.maxTags === self.entitiesArray.length || self.entities().toString().length === self.options.maxInputLength) {
        self.$container.addClass('bioinput-max');
      }

      if ($('.typeahead, .twitter-typeahead', self.$container).length) {
        self.$input.typeahead('val', '');
      }

      if (this.isInit) {
        self.$element.trigger(new $.Event('itemAddedOnInit', { item: item, options: options }));
      } else {
        self.$element.trigger(new $.Event('itemAdded', { item: item, options: options }));
      }
    },

    remove: function remove(inputItem, dontPushVal, options) {
      var item = inputItem;
      var self = this;

      if (self.objectItems) {
        if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
          item = $.grep(self.entitiesArray, function (other) {
            return self.options.itemValue(other) === self.options.itemValue(item);
          });
        } else {
          item = $.grep(self.entitiesArray, function (other) {
            return self.options.itemValue(other) === item;
          });
        }
        item = item[item.length - 1];
      }

      if (item) {
        var beforeItemRemoveEvent = new $.Event('beforeItemRemove', { item: item, cancel: false, options: options });
        self.$element.trigger(beforeItemRemoveEvent);
        if (beforeItemRemoveEvent.cancel) {
          return;
        }

        $('.tag', self.$container).filter(function () {
          return $(this).data('item') === item;
        }).remove();
        $('option', self.$element).filter(function () {
          return $(this).data('item') === item;
        }).remove();
        if ($.inArray(item, self.entitiesArray) !== -1) {
          self.entitiesArray.splice($.inArray(item, self.entitiesArray), 1);
        }
      }

      if (!dontPushVal) {
        self.pushVal();
      }

      if (self.options.maxTags > self.entitiesArray.length) {
        self.$container.removeClass('bioinput-max');
      }

      self.$element.trigger(new $.Event('itemRemoved', { item: item, options: options }));
    },

    removeAll: function removeAll() {
      var self = this;

      $('.tag', self.$container).remove();
      $('option', self.$element).remove();

      while (self.entitiesArray.length > 0) {
        self.entitiesArray.pop();
      }

      self.pushVal();
    },

    refresh: function refresh() {
      var self = this;
      $('.tag', self.$container).each(function () {
        var $tag = $(this);
        var item = $tag.data('item');
        var itemText = self.options.itemText(item);
        var tagClass = self.options.tagClass(item);

        $tag.attr('class', null);
        $tag.addClass('tag ' + htmlEncode(tagClass));
        $tag.contents().filter(function () {
          return this.nodeType === 3;
        })[0].nodeValue = htmlEncode(itemText);
      });
    },

    entities: function entities() {
      return this.entitiesArray;
    },

    pushVal: function pushVal() {
      var self = this;
      var val = $.map(self.entities(), function (item) {
        return self.options.itemValue(item).toString();
      });

      self.$element.val(val, true).trigger('change');
    },

    build: function build(options) {
      var self = this;

      self.options = $.extend({}, defaultOptions, options);

      if (self.objectItems) {
        self.options.freeInput = false;
      }

      makeOptionItemFunction(self.options, 'itemValue');
      makeOptionItemFunction(self.options, 'itemText');
      makeOptionFunction(self.options, 'tagClass');

      if (self.options.autocomplete) {
        (function () {
          var typeaheadConfig = null;
          var typeaheadDatasets = {};

          var autocomplete = self.options.autocomplete;
          if ($.isArray(autocomplete)) {
            typeaheadConfig = autocomplete[0];
            typeaheadDatasets = autocomplete[1];
          } else {
            typeaheadDatasets = autocomplete;
          }

          self.$input.typeahead(typeaheadConfig, typeaheadDatasets).on('typeahead:selected', $.proxy(function (obj, datum) {
            if (typeaheadDatasets.valueKey) {
              self.add(datum[typeaheadDatasets.valueKey]);
            } else {
              self.add(datum);
            }
            self.$input.typeahead('val', '');
          }, self));
        })();
      }

      self.$container.on('click', $.proxy(function () {
        if (!self.$element.attr('disabled')) {
          self.$input.removeAttr('disabled');
        }
        self.$input.focus();
      }, self));

      if (self.options.addOnBlur && self.options.freeInput) {
        self.$input.on('focusout', $.proxy(function () {
          if ($('.typeahead, .twitter-typeahead', self.$container).length === 0) {
            self.add(self.$input.val());
            self.$input.val('');
          }
        }, self));
      }

      self.$container.on({
        focusin: function focusin() {
          self.$container.addClass(self.options.focusClass);
        },
        focusout: function focusout() {
          self.$container.removeClass(self.options.focusClass);
        }
      });

      var lastKeyPressed = 0;

      self.$container.on('keydown', 'input', $.proxy(function (event) {
        var $targetInput = $(event.target);
        var $tag = $('.bioinput-label');

        if (self.$element.attr('disabled')) {
          self.$input.attr('disabled', 'disabled');
          return;
        }

        if (event.which === 8 && getCaretPosition($targetInput[0]) === 0) {
          var last = $tag.last();
          if (last.length && lastKeyPressed === 8) {
            self.remove(last.data('item'));
            lastKeyPressed = 0;
          } else if (last.length) {
            last.addClass('tag-to-remove');
            lastKeyPressed = 8;
          }
        } else {
          lastKeyPressed = 0;
          $('.tag').each(function each() {
            $(this).removeClass('tag-to-remove');
          });
        }

        $targetInput.attr('size', Math.max(this.inputSize, $targetInput.val().length + 1));
      }, self));

      self.$container.on('keypress', 'input', $.proxy(function (event) {
        var $input = $(event.target);

        if (self.$element.attr('disabled')) {
          self.$input.attr('disabled', 'disabled');
          return;
        }

        var text = $input.val();
        var maxLengthReached = self.options.maxChars && text.length >= self.options.maxChars;
        if (self.options.freeInput && (keyCombinationInList(event, self.options.confirmKeys) || maxLengthReached)) {
          if (text.length !== 0) {
            self.add(maxLengthReached ? text.substr(0, self.options.maxChars) : text);
            $input.val('');
          }

          if (self.options.cancelConfirmKeysOnEmpty === false) {
            event.preventDefault();
          }
        }

        $input.attr('size', Math.max(this.inputSize, $input.val().length + 1));
      }, self));

      self.$container.on('click', '[data-role=remove]', $.proxy(function (event) {
        if (self.$element.attr('disabled')) {
          return;
        }
        self.remove($(event.target).closest('.tag').data('item'));
      }, self));

      if (self.options.itemValue === defaultOptions.itemValue) {
        if (self.$element[0].tagName === 'INPUT') {
          self.add(self.$element.val());
        } else {
          $('option', self.$element).each(function () {
            self.add($(this).attr('value'), true);
          });
        }
      }
    },

    destroy: function destroy() {
      var self = this;

      self.$container.off('keypress', 'input');
      self.$container.off('click', '[role=remove]');

      self.$container.remove();
      self.$element.removeData('bioinput');
      self.$element.show();
    },

    focus: function focus() {
      this.$input.focus();
    },

    input: function input() {
      return this.$input;
    },

    findInputWrapper: function findInputWrapper() {
      var elt = this.$input[0];
      var container = this.$container[0];
      while (elt && elt.parentNode !== container) {
        elt = elt.parentNode;
      }
      return $(elt);
    }
  };

  $.fn.bioinput = function (arg1, arg2, arg3) {
    var results = [];

    this.each(function () {
      var bioinput = $(this).data('bioinput');

      if (!bioinput) {
        bioinput = new TagsInput(this, arg1);
        $(this).data('bioinput', bioinput);
        results.push(bioinput);

        $(this).val($(this).val());
      } else if (!arg1 && !arg2) {
        results.push(bioinput);
      } else if (bioinput[arg1] !== undefined) {
        var retVal = undefined;

        if (bioinput[arg1].length === 3 && arg3 !== undefined) {
          retVal = bioinput[arg1](arg2, null, arg3);
        } else {
          retVal = bioinput[arg1](arg2);
        }
        if (retVal !== undefined) {
          results.push(retVal);
        }
      }
    });

    if (typeof arg1 === 'string') {
      return results.length > 1 ? results : results[0];
    }
    return results;
  };

  $.fn.bioinput.Constructor = TagsInput;

  var bHOpts = {
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: '',
      wildcard: '%QUERY',
      transform: function transform(response) {
        return response;
      }
    }
  };

  var assayEngine = new Bloodhound(_extends({}, bHOpts, {
    remote: _extends({}, bHOpts.remote, {
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/assay/suggest?q=%QUERY'
    })
  }));

  var cellLineEngine = new Bloodhound(_extends({}, bHOpts, {
    remote: _extends({}, bHOpts.remote, {
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/cellLine/suggest?q=%QUERY'
    })
  }));

  var geneEngine = new Bloodhound(_extends({}, bHOpts, {
    remote: _extends({}, bHOpts.remote, {
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/gene/suggest?q=%QUERY'
    })
  }));

  var diseaseEngine = new Bloodhound(_extends({}, bHOpts, {
    remote: _extends({}, bHOpts.remote, {
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/disease/suggest?q=%QUERY'
    })
  }));

  var organismEngine = new Bloodhound(_extends({}, bHOpts, {
    remote: _extends({}, bHOpts.remote, {
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/organism/suggest?q=%QUERY'
    })
  }));

  var bioInputOpts = {
    itemValue: 'name'
  };

  var typeaheadOpts = {
    hint: true,
    highlight: true,
    minLength: 1
  };

  $(function () {
    assayEngine.initialize().done(function () {
      $('input[data-role=bioinput][data-entity-type=assay]').bioinput(_extends({}, bioInputOpts, {
        autocomplete: [_extends({}, typeaheadOpts), { display: 'name', source: assayEngine }]
      }));
    });

    cellLineEngine.initialize().done(function () {
      $('input[data-role=bioinput][data-entity-type=cell]').bioinput(_extends({}, bioInputOpts, {
        autocomplete: [_extends({}, typeaheadOpts), { display: 'name', source: cellLineEngine }]
      }));
    });

    geneEngine.initialize().done(function () {
      $('input[data-role=bioinput][data-entity-type=gene]').bioinput(_extends({}, bioInputOpts, {
        autocomplete: [_extends({}, typeaheadOpts), { display: 'name', source: geneEngine }]
      }));
    });

    organismEngine.initialize().done(function () {
      $('input[data-role=bioinput][data-entity-type=organismEngine]').bioinput(_extends({}, bioInputOpts, {
        autocomplete: [_extends({}, typeaheadOpts), { display: 'name', source: organismEngine }]
      }));
    });

    diseaseEngine.initialize().done(function () {
      $('input[data-role=bioinput][data-entity-type=disease]').bioinput(_extends({}, bioInputOpts, {
        autocomplete: [_extends({}, typeaheadOpts), { display: 'name', source: diseaseEngine }]
      }));
    });
  });
})(window.jQuery, window.Bloodhound);