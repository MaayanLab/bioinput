(function ($, Bloodhound) {
  if ($ === undefined) {
    throw new Error('BioInput requires jQuery and it is currently undefined.');
  }
  if (Bloodhound === undefined) {
    throw new Error('BioInput requires Bloodhound and it is currently undefined. ' +
      'This is included with the latest version of typeahead.js');
  }

  /**
   * Most options support both a string or number as well as a function as
   * option value. This function makes sure that the option with the given
   * key in the given options is wrapped in a function
   */
  function makeOptionItemFunction(options, key) {
    if (typeof options[key] !== 'function') {
      const propertyName = options[key];
      options[key] = function (item) { return item[propertyName]; };
    }
  }

  function makeOptionFunction(options, key) {
    if (typeof options[key] !== 'function') {
      const value = options[key];
      options[key] = function () { return value; };
    }
  }
  /**
   * HtmlEncodes the given value
   */
  const htmlEncodeContainer = $('<div />');
  function htmlEncode(value) {
    if (value) {
      return htmlEncodeContainer.text(value).html();
    }
    return '';
  }

  /**
   * Returns the position of the caret in the given input field
   * http://flightschool.acylt.com/devnotes/caret-position-woes/
   */
  function getCaretPosition(oField) {
    let iCaretPos = 0;
    if (document.selection) {
      oField.focus();
      const oSel = document.selection.createRange();
      oSel.moveStart('character', -oField.value.length);
      iCaretPos = oSel.text.length;
    } else if (oField.selectionStart || oField.selectionStart === '0') {
      iCaretPos = oField.selectionStart;
    }
    return (iCaretPos);
  }

  /**
    * Returns boolean indicates whether user has pressed an expected key combination.
    * @param object keyPressEvent: JavaScript event object, refer
    *     http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    * @param object lookupList: expected key combinations, as in:
    *     [13, {which: 188, shiftKey: true}]
    */
  function keyCombinationInList(keyPressEvent, lookupList) {
    let found = false;
    $.each(lookupList, function (index, keyCombination) {
      if (typeof (keyCombination) === 'number' && keyPressEvent.which === keyCombination) {
        found = true;
        return false;
      }

      if (keyPressEvent.which === keyCombination.which) {
        const alt = !keyCombination.hasOwnProperty('altKey') || keyPressEvent.altKey === keyCombination.altKey;
        const shift = !keyCombination.hasOwnProperty('shiftKey') || keyPressEvent.shiftKey === keyCombination.shiftKey;
        const ctrl = !keyCombination.hasOwnProperty('ctrlKey') || keyPressEvent.ctrlKey === keyCombination.ctrlKey;
        if (alt && shift && ctrl) {
          found = true;
          return false;
        }
      }
    });

    return found;
  }

  const defaultOptions = {
    tagClass: function () {
      return 'bioinput-label bioinput-label-info';
    },
    focusClass: 'focus',
    itemValue: function (item) {
      return item ? item.toString() : item;
    },
    itemText: function (item) {
      return this.itemValue(item);
    },
    itemTitle: function () {
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
    onTagExists: function (item, $tag) {
      $tag.hide().fadeIn();
    },
    trimValue: false,
    allowDuplicates: false,
  };

  /**
   * Constructor function
   */
  function TagsInput(element, options) {
    this.isInit = true;
    this.entitiesArray = [];

    this.$element = $(element);
    this.$element.hide();

    this.isSelect = (element.tagName === 'SELECT');
    this.multiple = (this.isSelect && element.hasAttribute('multiple'));
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

    /**
     * Adds the given item as a new tag. Pass true to dontPushVal to prevent
     * updating the elements val()
     */
    add: function (inputItem, dontPushVal, options) {
      let item = inputItem;
      const self = this;

      if (self.options.maxTags && self.entitiesArray.length >= self.options.maxTags) {
        return;
      }

      // Ignore falsey values, except false
      if (item !== false && !item) {
        return;
      }

      // Trim value
      if (typeof item === 'string' && self.options.trimValue) {
        item = $.trim(item);
      }

      // Throw an error when trying to add an object while the itemValue option was not set
      if (typeof item === 'object' && !self.objectItems) {
        throw new Error("Can't add objects when itemValue option is not set");
      }

      // Ignore strings only containg whitespace
      if (item.toString().match(/^\s*$/)) {
        return;
      }

      // If SELECT but not multiple, remove current tag
      if (self.isSelect && !self.multiple && self.entitiesArray.length > 0) {
        self.remove(self.entitiesArray[0]);
      }

      if (typeof item === 'string' && this.$element[0].tagName === 'INPUT') {
        const delimiter = (self.options.delimiterRegex) ? self.options.delimiterRegex : self.options.delimiter;
        const entities = item.split(delimiter);
        if (entities.length > 1) {
          for (let i = 0; i < entities.length; i++) {
            this.add(entities[i], true);
          }

          if (!dontPushVal) {
            self.pushVal();
          }
          return;
        }
      }

      const itemValue = self.options.itemValue(item);
      const itemText = self.options.itemText(item);
      const tagClass = self.options.tagClass(item);
      const itemTitle = self.options.itemTitle(item);

      // Ignore entities allready added
      const existing = $.grep(self.entitiesArray, function (searchItem) { return self.options.itemValue(searchItem) === itemValue; })[0];
      if (existing && !self.options.allowDuplicates) {
        // Invoke onTagExists
        if (self.options.onTagExists) {
          const $existingTag = $('.tag', self.$container).filter(function () { return $(this).data('item') === existing; });
          self.options.onTagExists(item, $existingTag);
        }
        return;
      }

      // if length greater than limit
      if (self.entities().toString().length + item.length + 1 > self.options.maxInputLength) {
        return;
      }

      // raise beforeItemAdd arg
      const beforeItemAddEvent = new $.Event('beforeItemAdd', { item: item, cancel: false, options: options });
      self.$element.trigger(beforeItemAddEvent);
      if (beforeItemAddEvent.cancel) {
        return;
      }

      // register item in internal array and map
      self.entitiesArray.push(item);

      // add a tag element

      const $tag = $(
        '<li class="tag ' + htmlEncode(tagClass) +
        (itemTitle !== null ? ('" title="' + itemTitle) : '') + '">' +
        htmlEncode(itemText) + '<span data-role="remove"></span></li>'
      );
      $tag.data('item', item);
      self.$tagList.append($tag);
      $tag.after(' ');

      // Check to see if the tag exists in its raw or uri-encoded form
      const optionExists = (
        $('option[value="' + encodeURIComponent(itemValue) + '"]', self.$element).length ||
        $('option[value="' + htmlEncode(itemValue) + '"]', self.$element).length
      );

      // add <option /> if item represents a value not present in one of the <select />'s options
      if (self.isSelect && !optionExists) {
        const $option = $('<option selected>' + htmlEncode(itemText) + '</option>');
        $option.data('item', item);
        $option.attr('value', itemValue);
        self.$element.append($option);
      }

      if (!dontPushVal) {
        self.pushVal();
      }

      // Add class when reached maxTags
      if (self.options.maxTags === self.entitiesArray.length || self.entities().toString().length === self.options.maxInputLength) {
        self.$container.addClass('bioinput-max');
      }

      // If using typeahead, once the tag has been added, clear the typeahead value so it does not stick around in the input.
      if ($('.typeahead, .twitter-typeahead', self.$container).length) {
        self.$input.typeahead('val', '');
      }

      if (this.isInit) {
        self.$element.trigger(new $.Event('itemAddedOnInit', { item: item, options: options }));
      } else {
        self.$element.trigger(new $.Event('itemAdded', { item: item, options: options }));
      }
    },

    /**
     * Removes the given item. Pass true to dontPushVal to prevent updating the
     * elements val()
     */
    remove: function (inputItem, dontPushVal, options) {
      let item = inputItem;
      const self = this;

      if (self.objectItems) {
        if (typeof item === 'object') {
          item = $.grep(self.entitiesArray, function (other) { return self.options.itemValue(other) === self.options.itemValue(item); });
        } else {
          item = $.grep(self.entitiesArray, function (other) { return self.options.itemValue(other) === item; });
        }
        item = item[item.length - 1];
      }

      if (item) {
        const beforeItemRemoveEvent = new $.Event('beforeItemRemove', { item: item, cancel: false, options: options });
        self.$element.trigger(beforeItemRemoveEvent);
        if (beforeItemRemoveEvent.cancel) {
          return;
        }

        $('.tag', self.$container).filter(function () { return $(this).data('item') === item; }).remove();
        $('option', self.$element).filter(function () { return $(this).data('item') === item; }).remove();
        if ($.inArray(item, self.entitiesArray) !== -1) {
          self.entitiesArray.splice($.inArray(item, self.entitiesArray), 1);
        }
      }

      if (!dontPushVal) {
        self.pushVal();
      }

      // Remove class when reached maxTags
      if (self.options.maxTags > self.entitiesArray.length) {
        self.$container.removeClass('bioinput-max');
      }

      self.$element.trigger(new $.Event('itemRemoved', { item: item, options: options }));
    },

    /**
     * Removes all entities
     */
    removeAll: function () {
      const self = this;

      $('.tag', self.$container).remove();
      $('option', self.$element).remove();

      while (self.entitiesArray.length > 0) {
        self.entitiesArray.pop();
      }

      self.pushVal();
    },

    /**
     * Refreshes the tags so they match the text/value of their corresponding
     * item.
     */
    refresh: function () {
      const self = this;
      $('.tag', self.$container).each(function () {
        const $tag = $(this);
        const item = $tag.data('item');
        const itemValue = self.options.itemValue(item);
        const itemText = self.options.itemText(item);
        const tagClass = self.options.tagClass(item);

          // Update tag's class and inner text
        $tag.attr('class', null);
        $tag.addClass('tag ' + htmlEncode(tagClass));
        $tag.contents().filter(function () {
          return this.nodeType === 3;
        })[0].nodeValue = htmlEncode(itemText);

        if (self.isSelect) {
          const option = $('option', self.$element).filter(function () { return $(this).data('item') === item; });
          option.attr('value', itemValue);
        }
      });
    },

    /**
     * Returns the entities added as tags
     */
    entities: function () {
      return this.entitiesArray;
    },

    /**
     * Assembly value by retrieving the value of each item, and set it on the
     * element.
     */
    pushVal: function () {
      const self = this;
      const val = $.map(self.entities(), function (item) {
        return self.options.itemValue(item).toString();
      });

      self.$element.val(val, true).trigger('change');
    },

    /**
     * Initializes the tags input behaviour on the element
     */
    build: function (options) {
      const self = this;

      self.options = $.extend({}, defaultOptions, options);
      // When itemValue is set, freeInput should always be false
      if (self.objectItems) {
        self.options.freeInput = false;
      }

      makeOptionItemFunction(self.options, 'itemValue');
      makeOptionItemFunction(self.options, 'itemText');
      makeOptionFunction(self.options, 'tagClass');

      // typeahead.js
      if (self.options.autocomplete) {
        let typeaheadConfig = null;
        let typeaheadDatasets = {};

          // Determine if main configurations were passed or simply a dataset
        const autocomplete = self.options.autocomplete;
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
      }

      self.$container.on('click', $.proxy(function () {
        if (! self.$element.attr('disabled')) {
          self.$input.removeAttr('disabled');
        }
        self.$input.focus();
      }, self));

      if (self.options.addOnBlur && self.options.freeInput) {
        self.$input.on('focusout', $.proxy(function () {
          // HACK: only process on focusout when no typeahead opened, to
          //       avoid adding the typeahead text as tag
          if ($('.typeahead, .twitter-typeahead', self.$container).length === 0) {
            self.add(self.$input.val());
            self.$input.val('');
          }
        }, self));
      }

      // Toggle the 'focus' css class on the container when it has focus
      self.$container.on({
        focusin: function () {
          self.$container.addClass(self.options.focusClass);
        },
        focusout: function () {
          self.$container.removeClass(self.options.focusClass);
        },
      });

      let lastKeyPressed = 0;

      self.$container.on('keydown', 'input', $.proxy(function (event) {
        const $targetInput = $(event.target);
        const $tag = $('.bioinput-label');

        if (self.$element.attr('disabled')) {
          self.$input.attr('disabled', 'disabled');
          return;
        }

        if (event.which === 8 && getCaretPosition($targetInput[0]) === 0) {
          const last = $tag.last();
          if (last.length && lastKeyPressed === 8) {
            self.remove(last.data('item'));
            lastKeyPressed = 0;
          } else if (last.length) {
            last.addClass('tag-to-remove');
            lastKeyPressed = 8;
          }
        } else {
          // Reset last key pressed and remove 'tag-to-remove' class
          lastKeyPressed = 0;
          $('.tag').each(function each() {
            $(this).removeClass('tag-to-remove');
          });
        }
        // Reset internal input's size
        $targetInput.attr('size', Math.max(this.inputSize, $targetInput.val().length + 1));
      }, self));

      self.$container.on('keypress', 'input', $.proxy(function (event) {
        const $input = $(event.target);

        if (self.$element.attr('disabled')) {
          self.$input.attr('disabled', 'disabled');
          return;
        }

        const text = $input.val();
        const maxLengthReached = self.options.maxChars && text.length >= self.options.maxChars;
        if (self.options.freeInput && (keyCombinationInList(event, self.options.confirmKeys) || maxLengthReached)) {
            // Only attempt to add a tag if there is data in the field
          if (text.length !== 0) {
            self.add(maxLengthReached ? text.substr(0, self.options.maxChars) : text);
            $input.val('');
          }

            // If the field is empty, let the event triggered fire as usual
          if (self.options.cancelConfirmKeysOnEmpty === false) {
            event.preventDefault();
          }
        }

         // Reset internal input's size
        $input.attr('size', Math.max(this.inputSize, $input.val().length + 1));
      }, self));

      // Remove icon clicked
      self.$container.on('click', '[data-role=remove]', $.proxy(function (event) {
        if (self.$element.attr('disabled')) {
          return;
        }
        self.remove($(event.target).closest('.tag').data('item'));
      }, self));

      // Only add existing value as tags when using strings as tags
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

    /**
     * Removes all bioinput behaviour and unregsiter all event handlers
     */
    destroy: function () {
      const self = this;

      // Unbind events
      self.$container.off('keypress', 'input');
      self.$container.off('click', '[role=remove]');

      self.$container.remove();
      self.$element.removeData('bioinput');
      self.$element.show();
    },

    /**
     * Sets focus on the bioinput
     */
    focus: function () {
      this.$input.focus();
    },

    /**
     * Returns the internal input element
     */
    input: function () {
      return this.$input;
    },

    /**
     * Returns the element which is wrapped around the internal input. This
     * is normally the $container, but typeahead.js moves the $input element.
     */
    findInputWrapper: function () {
      let elt = this.$input[0];
      const container = this.$container[0];
      while (elt && elt.parentNode !== container) {
        elt = elt.parentNode;
      }
      return $(elt);
    },
  };

  /**
   * Register JQuery plugin
   */
  $.fn.bioinput = function (arg1, arg2, arg3) {
    const results = [];

    this.each(function () {
      let bioinput = $(this).data('bioinput');
      // Initialize a new tags input
      if (!bioinput) {
        bioinput = new TagsInput(this, arg1);
        $(this).data('bioinput', bioinput);
        results.push(bioinput);

        if (this.tagName === 'SELECT') {
          $('option', $(this)).attr('selected', 'selected');
        }

          // Init tags from $(this).val()
        $(this).val($(this).val());
      } else if (!arg1 && !arg2) {
          // bioinput already exists
          // no function, trying to init
        results.push(bioinput);
      } else if (bioinput[arg1] !== undefined) {
        let retVal;
          // Invoke function on existing tags input
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
      // Return the results from the invoked function calls
      return results.length > 1 ? results : results[0];
    }
    return results;
  };

  $.fn.bioinput.Constructor = TagsInput;

  const bHOpts = {
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: '',
      wildcard: '%QUERY',
      transform: function (response) {
        return $.map(response, function (lineObj) {
          return lineObj.name;
        });
      },
    },
  };

  const assayEngine = new Bloodhound({
    ...bHOpts,
    remote: {
      ...bHOpts.remote,
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/assay/suggest?q=%QUERY',
    },
  });

  const cellLineEngine = new Bloodhound({
    ...bHOpts,
    remote: {
      ...bHOpts.remote,
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/cellLine/suggest?q=%QUERY',
    },
  });

  const geneEngine = new Bloodhound({
    ...bHOpts,
    remote: {
      ...bHOpts.remote,
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/gene/suggest?q=%QUERY',
    },
  });

  const diseaseEngine = new Bloodhound({
    ...bHOpts,
    remote: {
      ...bHOpts.remote,
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/disease/suggest?q=%QUERY',
    },
  });

  const organismEngine = new Bloodhound({
    ...bHOpts,
    remote: {
      ...bHOpts.remote,
      url: 'http://amp.pharm.mssm.edu/biocomplete/api/v1/organism/suggest?q=%QUERY',
    },
  });

  $(function () {
    $('input[data-role=bioinput][data-entity-type=assay]').bioinput({
      autocomplete: {
        source: assayEngine,
      },
    });
    $('input[data-role=bioinput][data-entity-type=cell]').bioinput({
      autocomplete: {
        source: cellLineEngine,
      },
    });
    $('input[data-role=bioinput][data-entity-type=gene]').bioinput({
      autocomplete: {
        source: geneEngine,
      },
    });
    $('input[data-role=bioinput][data-entity-type=disease]').bioinput({
      autocomplete: {
        source: diseaseEngine,
      },
    });
    $('input[data-role=bioinput][data-entity-type=organism]').bioinput({
      autocomplete: {
        source: organismEngine,
      },
    });
  });
})(window.jQuery, window.Bloodhound);
