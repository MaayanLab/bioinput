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
   * Returns the position of the caret in the given input field
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

  /**
   * HtmlEncodes the given value
   */
  const htmlEncodeContainer = $('<div />');
  function htmlEncode(value) {
    return value ? htmlEncodeContainer.text(value).html() : '';
  }

  const defaultOptions = {
    tagClass: function () { return 'bioinput-label'; },
    focusClass: 'focus',
    itemValue: function (item) { return item ? item.toString() : item; },
    itemText: function (item) { return this.itemValue(item); },
    itemTitle: function () { return null; },
    freeInput: true,
    addOnBlur: true,
    maxTags: undefined,
    maxChars: undefined,
    confirmKeys: [13, 44],
    delimiter: ',',
    delimiterRegex: null,
    cancelConfirmKeysOnEmpty: false,
    onTagExists: function (item, $tag) { return $tag.hide().fadeIn(); },
    trimValue: false,
    allowDuplicates: false,
  };

  /**
   * Constructor function
   */
  function BioInput(element, options) {
    this.isInit = true;
    this.itemsArray = [];

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

  BioInput.prototype = {
    constructor: BioInput,

    /**
     * Adds the given item as a new tag. Pass true to dontPushVal to prevent
     * updating the elements val()
     */
    add: function (inputItem, dontPushVal, options) {
      const self = this;
      const {
        itemsArray,
        objectItems,
        $element,
        $container,
        $tagList,
        $input,
        isInit,
      } = self;
      const opts = this.options;

      const item = typeof inputItem === 'string' && opts.trimValue ? $.trim(inputItem) : inputItem;

      if (opts.maxTags && itemsArray.length >= opts.maxTags) {
        return;
      }

      // Ignore falsey values, except false
      if (item !== false && !item) {
        return;
      }

      // Throw an error when trying to add an object while the itemValue option was not set
      if (typeof item === 'object' && !objectItems) {
        throw new Error('Can\'t add objects when itemValue option is not set');
      }

      // // Ignore strings only containing whitespace
      if (item.toString().match(/^\s*$/)) {
        return;
      }

      if (typeof item === 'string' && $element[0].tagName === 'INPUT') {
        const delimiter = (opts.delimiterRegex) ? opts.delimiterRegex : opts.delimiter;
        const itemsArr = item.split(delimiter);
        if (itemsArr.length > 1) {
          $.each(itemsArr, function (index, splitItem) { self.add(splitItem, true); });
          if (!dontPushVal) {
            self.pushVal();
          }
          return;
        }
      }

      const itemValue = opts.itemValue(item);
      const itemText = opts.itemText(item);
      const tagClass = opts.tagClass(item);
      const itemTitle = opts.itemTitle(item);

      // Ignore items already added
      const existing = $.inArray(itemValue, itemsArray);
      if (existing && !opts.allowDuplicates) {
        // Invoke onTagExists
        if (opts.onTagExists) {
          const $existingTag = $('.tag', $container).filter(function f() {
            return $(this).data('item') === existing;
          });
          opts.onTagExists(item, $existingTag);
        }
        return;
      }

      // if length greater than limit
      if (self.items().toString().length + item.length + 1 > opts.maxInputLength) {
        return;
      }

      // raise beforeItemAdd arg
      const beforeItemAddEvent = new $.Event('beforeItemAdd', { item, cancel: false, options });
      $element.trigger(beforeItemAddEvent);
      if (beforeItemAddEvent.cancel) {
        return;
      }

      // register item in internal array and map
      itemsArray.push(item);

      // add a tag element
      const $tag = $(
        '<li class="tag ' + htmlEncode(tagClass) +
        (itemTitle !== null ? ('" title="' + itemTitle) : '') + '">' +
        htmlEncode(itemText) + '<span data-role="remove"></span></li>'
      );
      $tag.data('item', item);
      $tagList.append($tag);
      $tag.after(' ');

      // Remove the 'tag-to-remove' class
      $('.tag').each(function () {
        $(this).removeClass('tag-to-remove');
      });

      if (!dontPushVal) {
        self.pushVal();
      }

      // Add class when reached maxTags
      if (
        opts.maxTags === itemsArray.length ||
        self.items().toString().length === opts.maxInputLength
      ) {
        $container.addClass('bioinput-max');
      }

      // If using typeahead, once the tag has been added, clear the
      // typeahead value so it does not stick around in the input.
      if ($('.typeahead, .twitter-typeahead', $container).length) {
        $input.typeahead('val', '');
      }

      if (isInit) {
        $element.trigger(new $.Event('itemAddedOnInit', { item, options }));
      } else {
        $element.trigger(new $.Event('itemAdded', { item, options }));
      }
    },

    /**
     * Removes the given item. Pass true to dontPushVal to prevent updating the
     * elements val()
     */
    remove: function (itemToRemove, dontPushVal, options) {
      let item = itemToRemove;
      const self = this;
      const { objectItems, $element, $container, itemsArray } = self;
      const opts = this.options;

      if (objectItems) {
        const itemToFind = typeof item === 'object' ? opts.itemValue(item) : item;
        item = $.grep(itemsArray, function (other) { return opts.itemValue(other) === itemToFind; });
        item = item[item.length - 1];
      }

      if (item) {
        const beforeRemoveE = new $.Event('beforeItemRemove', { item, cancel: false, options });
        $element.trigger(beforeRemoveE);
        if (beforeRemoveE.cancel) {
          return;
        }

        $('.tag', $container).filter(function f() {
          return $(this).data('item') === item;
        }).remove();

        if ($.inArray(item, itemsArray) !== -1) {
          itemsArray.splice($.inArray(item, itemsArray), 1);
        }
      }

      if (!dontPushVal) {
        self.pushVal();
      }

      // Remove class when reached maxTags
      if (opts.maxTags > itemsArray.length) {
        $container.removeClass('bioinput-max');
      }

      $element.trigger(new $.Event('itemRemoved', { item, options }));
    },

    /**
     * Removes all items
     */
    removeAll: function () {
      const { $container, itemsArray } = this;
      $('.tag', $container).remove();
      // http://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
      itemsArray.splice(0, itemsArray.length);
      this.pushVal();
    },

    /**
     * Refreshes the tags so they match the text/value of their corresponding
     * item.
     */
    refresh: function () {
      const { $container, options } = this;
      $('.tag', $container).each(function each() {
        const $tag = $(this);
        const item = $tag.data('item');
        const itemText = options.itemText(item);
        const tagClass = options.tagClass(item);

        // Update tag's class and inner text
        $tag.attr('class', null);
        $tag.addClass('tag ' + htmlEncode(tagClass));
        $tag.contents().filter(function f() { return this.nodeType === 3; })[0].nodeValue = htmlEncode(itemText);
      });
    },

    /**
     * Returns the items added as tags
     */
    items: function () { return this.itemsArray; },

    /**
     * Assembly value by retrieving the value of each item, and set it on the
     * element.
     */
    pushVal: function () {
      const { items, options, $element } = this;
      const val = $.map(items(), function (item) { return options.itemValue(item).toString(); });
      $element.val(val, true).trigger('change');
    },

    /**
     * Initializes the tags input behaviour on the element
     */
    build: function (options) {
      const self = this;
      const { objectItems, $input, $element, $container } = self;
      self.options = { ...defaultOptions, ...options };
      const opts = self.options;
      // When itemValue is set, freeInput should always be false
      opts.freeInput = !objectItems;

      makeOptionItemFunction(opts, 'itemValue');
      makeOptionItemFunction(opts, 'itemText');
      makeOptionFunction(opts, 'tagClass');

      const autocomplete = opts.autocomplete;
      if (autocomplete) {
        // Determine if main configurations were passed or simply a dataset
        const acConfig = $.isArray(autocomplete) ? autocomplete[0] : null;
        const datasets = $.isArray(autocomplete) ? autocomplete[1] : autocomplete;

        $input
          .typeahead(acConfig, datasets)
          .on('typeahead:selected', $.proxy(function (obj, datum) {
            self.add(datasets.valueKey ? datum[datasets.valueKey] : datum);
            $input.typeahead('val', '');
          }, self));
      }

      $container.on('click', $.proxy(function () {
        if (!$element.attr('disabled')) {
          $input.removeAttr('disabled');
        }
        $input.focus();
      }, self));

      if (opts.addOnBlur && opts.freeInput) {
        $input.on('focusout', $.proxy(function () {
          // HACK: only process on focusout when no typeahead opened, to
          //       avoid adding the typeahead text as tag
          if ($('.typeahead, .twitter-typeahead', $container).length === 0) {
            self.add($input.val());
            $input.val('');
          }
        }, self));
      }

      // Toggle the 'focus' css class on the container when it has focus
      $container.on({
        focusin: function () { return $container.addClass(opts.focusClass); },
        focusout: function () { return $container.removeClass(opts.focusClass); },
      });

      let lastKeyPressed = 0;
      $container.on('keydown', 'input', $.proxy(function (event) {
        const $targetInput = $(event.target);
        const $tag = $('.bioinput-label');

        if ($element.attr('disabled')) {
          $input.attr('disabled', 'disabled');
          return;
        }

          // Backspace pressed and cursor at beginning of input.
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
      }, self));

      $container.on('keypress', 'input', $.proxy(function (event) {
        const $targetInput = $(event.target);

        if ($element.attr('disabled')) {
          $input.attr('disabled', 'disabled');
          return;
        }

        const text = $targetInput.val();
        const maxLengthReached = opts.maxChars && text.length >= opts.maxChars;
        if (opts.freeInput && (keyCombinationInList(event, opts.confirmKeys) || maxLengthReached)) {
          // Only attempt to add a tag if there is data in the field
          if (text.length !== 0) {
            const textToAdd = maxLengthReached ? text.substr(0, opts.maxChars) : text;
            self.add(textToAdd);
            $targetInput.val('');
          }

          // If the field is empty, let the event triggered fire as usual
          if (opts.cancelConfirmKeysOnEmpty === false) {
            event.preventDefault();
          }
        }

         // Reset internal input's size
        const textLength = $input.val().length + 1;

        $targetInput.attr('size', Math.max(this.inputSize, textLength));
      }, self));

      // Remove icon clicked
      $container.on('click', '[data-role=remove]', $.proxy(function (event) {
        if (!$element.attr('disabled')) {
          self.remove($(event.target).closest('.tag').data('item'));
        }
      }, self));

      // Only add existing value as tags when using strings as tags
      if (opts.itemValue === defaultOptions.itemValue) {
        if ($element[0].tagName === 'INPUT') {
          self.add($element.val());
        } else {
          $('option', $element).each(function each() {
            self.add($(this).attr('value'), true);
          });
        }
      }
    },

    /**
     * Removes all bioinput behavior and unregister all event handlers
     */
    destroy: function destroy() {
      const { $container, $element } = this;

      // Unbind events
      $container.off('keypress', 'input');
      $container.off('click', '[role=remove]');

      $container.remove();
      $element.removeData('bioinput');
      $element.show();
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
    input: function () { return this.$input; },

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
    this.each(function each() {
      let bioinput = $(this).data('bioinput');
      // Initialize a new tags input
      if (!bioinput) {
        bioinput = new BioInput(this, arg1);
        $(this).data('bioinput', bioinput);
        results.push(bioinput);

        // Init tags from $(this).val()
        $(this).val($(this).val());
      } else if (!arg1 && !arg2) {
        // bioinput already exists
        // no function, trying to init
        results.push(bioinput);
      } else if (bioinput[arg1] !== undefined) {
        // Invoke function on existing tags input
        let retVal;
        if (bioinput[arg1].length === 3 && arg3 !== undefined) {
          retVal = bioinput[arg1](arg2, null, arg3);
        } else {
          retVal = bioinput[arg1](arg2);
        }
        if (retVal) {
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

  $.fn.bioinput.Constructor = BioInput;

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
      url: 'http://amp.pharm.mssm.edu/LDR/api/autocomplete/assays?q=%QUERY',
    },
  });

  const cellLineEngine = new Bloodhound({
    ...bHOpts,
    remote: {
      ...bHOpts.remote,
      url: 'http://amp.pharm.mssm.edu/LDR/api/autocomplete/cellLines?q=%QUERY',
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
  });
})(window.jQuery, window.Bloodhound);
