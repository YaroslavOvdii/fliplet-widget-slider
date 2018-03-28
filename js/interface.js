// VARS
var widgetId = Fliplet.Widget.getDefaultId();
var data = Fliplet.Widget.getData() || {
    items: []
  },
  linkPromises = [],
  imageProvider;

// DEFAULTS
data.items = data.items || [];

var FlSlider = (function() {

  var accordionCollapsed = false;

  var $accordionContainer = $('#accordion');


  function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  // this reference
  var _this;

  // Constructor
  function FlSlider(data) {
    _this = this;

    if (_.isObject(data.skipLinkAction)) {
      this.initSkipLinkProvider();
    }

    this.listLength = data.items.length + 1;
    this.$tabcontent = $('.tab-content');
    Handlebars.panelTemplate = Handlebars.compile($('#template-panel').html());

    this.checkPanelLength();
    this.setupSortable();
    this.attachObservers();
    this.loadAnimationToggle();
    this.loadNavigationToggle();
    this.loadSkipToggle();
  }

  FlSlider.prototype = {

    // Public functions
    constructor: FlSlider,
    setupSortable: function() {
      var $sortable = $('.panel-group').sortable({
        handle: ".panel-heading",
        cancel: ".icon-delete",
        tolerance: 'pointer',
        revert: 150,
        placeholder: 'panel panel-default placeholder tile',
        cursor: '-webkit-grabbing; -moz-grabbing;',
        axis: 'y',
        start: function(event, ui) {
          $('.panel-collapse.in').collapse('hide');
          ui.item.addClass('focus').css('height', ui.helper.find('.panel-heading').outerHeight() + 2);
          $('.panel').not(ui.item).addClass('faded');
        },
        stop: function(event, ui) {
          ui.item.removeClass('focus');

          var sortedIds = $(".panel-group").sortable("toArray", {
            attribute: 'data-id'
          });
          data.items = _.sortBy(data.items, function(item) {
            return sortedIds.indexOf(item.id);
          });
          save();
          $('.panel').not(ui.item).removeClass('faded');
        },
        sort: function(event, ui) {
          $('.panel-group').sortable('refresh');
          $('.tab-content').trigger('scroll');
        }
      });
      $('form.form-horizontal').trigger('scroll');
    },

    loadAnimationToggle: function() {
      if (typeof data.animationEnabled != "undefined") {
        if (data.animationEnabled) {
          $('#enable-animation-yes').prop("checked", true);
        } else {
          $('#enable-animation-no').prop("checked", true);
        }
      } else {
        $('#enable-animation-yes').prop("checked", true);
      }
      _this.enableAnimation();
    },

    loadNavigationToggle: function() {
      if (typeof data.navigationEnabled != "undefined") {
        if (data.navigationEnabled) {
          $('#enable-navigation-yes').prop("checked", true);
        } else {
          $('#enable-navigation-no').prop("checked", true);
        }
      } else {
        $('#enable-navigation-no').prop("checked", true);
      }
      _this.enableNavigation();
    },

    loadSkipToggle: function() {
      if (typeof data.skipEnabled != "undefined") {
        if (data.skipEnabled) {
          $('#enable-skip-yes').prop("checked", true);
        } else {
          $('#enable-skip-no').prop("checked", true);
        }
      } else {
        $('#enable-skip-no').prop("checked", true);
      }
      _this.enableSkipButton();
    },

    enableAnimation: function() {
      if ($('#enable-animation-yes').is(':checked')) {
        data.animationEnabled = true;
      } else if ($('#enable-animation-no').is(':checked')) {
        data.animationEnabled = false;
      }
    },

    enableNavigation: function() {
      if ($('#enable-navigation-yes').is(':checked')) {
        data.navigationEnabled = true;
      } else if ($('#enable-navigation-no').is(':checked')) {
        data.navigationEnabled = false;
      }
    },

    enableSkipButton: function() {
      if ($('#enable-skip-yes').is(':checked')) {
        $('#skip-link').addClass('show');
        data.skipEnabled = true;
        _this.initSkipLinkProvider();
      } else if ($('#enable-skip-no').is(':checked')) {
        $('#skip-link').removeClass('show');
        data.skipEnabled = false;
      }
    },

    initItemLinkProvider: function(item) {

      item.linkAction = item.linkAction || {};
      item.linkAction.provId = item.id;

      var linkActionProvider = Fliplet.Widget.open('com.fliplet.link', {
        // If provided, the iframe will be appended here,
        // otherwise will be displayed as a full-size iframe overlay
        selector: '[data-id="' + item.id + '"] .add-link',
        // Also send the data I have locally, so that
        // the interface gets repopulated with the same stuff
        data: item.linkAction,
        // Events fired from the provider
        onEvent: function(event, data) {
          if (event === 'interface-validate') {
            Fliplet.Widget.toggleSaveButton(data.isValid === true);
          }
        },
        closeOnSave: false
      });

      linkActionProvider.then(function(data) {
        item.linkAction = data && data.data.action !== 'none' ? data.data : null;
        return Promise.resolve();
      });

      linkActionProvider.id = item.id;
      linkPromises.push(linkActionProvider);
    },

    initSkipLinkProvider: function() {

      data.skipLinkAction = data.skipLinkAction || {};

      var skipLinkActionProvider = Fliplet.Widget.open('com.fliplet.link', {
        // If provided, the iframe will be appended here,
        // otherwise will be displayed as a full-size iframe overlay
        selector: '.add-skip-link',
        // Also send the data I have locally, so that
        // the interface gets repopulated with the same stuff
        data: data.skipLinkAction,
        // Events fired from the provider
        onEvent: function(event, data) {
          if (event === 'interface-validate') {
            Fliplet.Widget.toggleSaveButton(data.isValid === true);
          }
        },
        closeOnSave: false
      });

      skipLinkActionProvider.then(function(result) {
        data.skipLinkAction = result && result.data.action !== 'none' ? result.data : null;
        return Promise.resolve();
      });

      skipLinkActionProvider.id = data.id;
      linkPromises.push(skipLinkActionProvider);
    },

    initImageProvider: function(item) {
      imageProvider = Fliplet.Widget.open('com.fliplet.image-manager', {
        // Also send the data I have locally, so that
        // the interface gets repopulated with the same stuff
        data: item.imageConf,
        // Events fired from the provider
        onEvent: function(event, data) {
          if (event === 'interface-validate') {
            Fliplet.Widget.toggleSaveButton(data.isValid === true);
          }
        },
        single: true,
        type: 'image'
      });

      Fliplet.Widget.toggleCancelButton(false);

      window.addEventListener('message', function(event) {
        if (event.data === 'cancel-button-pressed') {
          Fliplet.Widget.toggleCancelButton(true);
          imageProvider.close();
          if (_.isEmpty(item.imageConf)) {
            $('[data-id="' + item.id + '"] .add-image-holder').find('.add-image').text('Add image');
            $('[data-id="' + item.id + '"] .add-image-holder').find('.thumb-holder').addClass('hidden');
          }
        }
      });

      Fliplet.Studio.emit('widget-save-label-update', {
        text: 'Select & Save'
      });

      imageProvider.then(function(data) {
        if (data.data) {
          item.imageConf = data.data;
          $('[data-id="' + item.id + '"] .thumb-image img').attr("src", data.data.thumbnail);
          save();
        }
        imageProvider = null;
        Fliplet.Studio.emit('widget-save-label-reset');
        return Promise.resolve();
      });
    },

    expandAccordion: function() {
      accordionCollapsed = false;
      $('.panel-collapse').collapse('show');
    },

    collapseAccordion: function() {
      accordionCollapsed = true;
      $('.panel-collapse').collapse('hide');
    },

    setListItemTitle: function(index, title) {
      $('#accordion').find('.panel:eq(' + index + ') .panel-title-text').html(title);
    },

    addListItem: function(data) {
      var $newPanel = $(Handlebars.panelTemplate(data));
      $accordionContainer.append($newPanel);

      $newPanel.find('.form-control:eq(0)').select();
      $('form.form-horizontal').stop().animate({
        scrollTop: $('.tab-content').height()
      }, 300, function() {
        $('form.form-horizontal').trigger('scroll');
      });
    },

    checkPanelLength: function() {
      if ($('.panel').length) {
        $('#slides').removeClass('list-items-empty');
      } else {
        $('#slides').addClass('list-items-empty');
      }
    },

    attachObservers: function() {
      _this.$tabcontent
        .on('click', '.icon-delete', function() {

          var $item = $(this).closest("[data-id], .panel"),
            id = $item.data('id');

          _.remove(data.items, {
            id: id
          });
          _.remove(linkPromises, {
            id: id
          });

          $(this).parents('.panel').remove();
          _this.checkPanelLength();
          _this.listLength--;
          save();

        })
        .on('click', '.add-image', function() {

          var $item = $(this).closest("[data-id], .panel"),
            id = $item.data('id'),
            item = _.find(data.items, {
              id: id
            });

          _this.initImageProvider(item);

          $(this).text('Replace image');
          if ($(this).siblings('.thumb-holder').hasClass('hidden')) {
            $(this).siblings('.thumb-holder').removeClass('hidden');
          }
        })
        .on('click', '.image-remove', function() {

          var $item = $(this).closest("[data-id], .panel"),
            id = $item.data('id'),
            item = _.find(data.items, {
              id: id
            });

          item.imageConf = null;
          $(this).parents('.add-image-holder').find('.add-image').text('Add image');
          $(this).parents('.add-image-holder').find('.thumb-holder').addClass('hidden');
          save();
        })
        .on('keyup change blur paste', '.list-item-title', function() {
          var $listItem = $(this).parents('.panel');
          _this.setListItemTitle($listItem.index(), $(this).val());

          debounceSave();
        }).on('keyup change blur paste', '.list-item-desc', function() {
          debounceSave();
        })
        .on('keyup change blur paste', '.list-item-link-label', function() {
          debounceSave();
        })
        .on('click', '.expand-items', function() {
          var $panelCollapse = $('.panel-collapse.in');
          // Update accordionCollapsed if all panels are collapsed/expanded
          if (!$panelCollapse.length) {
            accordionCollapsed = true;
          } else if ($panelCollapse.length == $('.panel-collapse').length) {
            accordionCollapsed = false;
          }

          if (accordionCollapsed) {
            _this.expandAccordion();
          } else {
            _this.collapseAccordion();
          }
        })
        .on('click', '.new-list-item', function() {

          var item = {};
          item.id = makeid(8);
          item.number = _this.listLength++;
          item.linkAction = null;
          item.description = "";
          data.items.push(item);

          _this.addListItem(item);
          _this.initItemLinkProvider(item);

          _this.checkPanelLength();
          save();

        })
        .on('show.bs.collapse', '.panel-collapse', function() {
          // Get item ID / Get provider / Get item
          var itemID = $(this).parents('.panel').data('id');
          var itemProvider = _.find(linkPromises, function(provider) {
            return provider.id === itemID;
          });
          var item = _.find(data.items, function(item) {
            return item.id === itemID;
          });
          // Init the link provider when the accordion opens
          if (!itemProvider && item) {
            _this.initItemLinkProvider(item);
          }
          $(this).siblings('.panel-heading').find('.fa-chevron-right').removeClass('fa-chevron-right').addClass('fa-chevron-down');
        })
        .on('hide.bs.collapse', '.panel-collapse', function() {
          $(this).siblings('.panel-heading').find('.fa-chevron-down').removeClass('fa-chevron-down').addClass('fa-chevron-right');
        })
        .on('shown.bs.collapse hidden.bs.collapse', '.panel-collapse', function() {
          $('.tab-content').trigger('scroll');
        })
        .on('change', 'input[name="enable_animation"]:radio', function() {
          _this.enableAnimation();
        })
        .on('change', 'input[name="enable_navigation"]:radio', function() {
          _this.enableNavigation();
        })
        .on('change', 'input[name="enable_skip"]:radio', function() {
          _this.enableSkipButton();
        });

      $('#help_tip').on('click', function() {
        alert("During beta, please use live chat and let us know what you need help with.");
      });

      var contentHeight = $('body > .form-horizontal').outerHeight();
      var tabPaneTopPadding = 78;

      $('body > .form-horizontal').scroll(function(event) {
        var tabContentScrollPos = Math.abs($('.tab-pane-content').position().top - tabPaneTopPadding);
        var tabPaneHeight = tabPaneTopPadding + $('.tab-pane-content').height();

        if (tabPaneHeight - tabContentScrollPos > contentHeight) {
          $('body').addClass('controls-sticky-on');
        } else {
          $('body').removeClass('controls-sticky-on');
        }
      });
    }

  };

  return FlSlider;
})();

var flSlider = new FlSlider(data);

Fliplet.Widget.onSaveRequest(function() {
  if (imageProvider) {
    imageProvider.forwardSaveRequest();
  } else {
    save(true);
  }
});

var debounceSave = _.debounce(save, 500);

function save(notifyComplete) {
  _.forEach(data.items, function(item) {
    item.description = $('#list-item-desc-' + item.id).val();
    item.title = $('#list-item-title-' + item.id).val();
    item.linkLabel = $('#list-item-link-label-' + item.id).val();
  });

  if (notifyComplete) {
    Fliplet.Widget.all(linkPromises).then(function() {
      // when all providers have finished
      Fliplet.Widget.save(data).then(function() {
        // Close the interface for good
        Fliplet.Studio.emit('reload-widget-instance', widgetId);
        Fliplet.Widget.complete();
      });
    });

    // forward save request to all providers
    linkPromises.forEach(function(promise) {
      promise.forwardSaveRequest();
    });
  } else {
    // Partial save while typing/using the interface
    Fliplet.Widget.save(data).then(function() {
      Fliplet.Studio.emit('reload-widget-instance', widgetId);
    });
  }
}
