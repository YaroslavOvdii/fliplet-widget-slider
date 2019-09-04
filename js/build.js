var firstInit = true;
var globalSwiper;
function init(){
  var i = 0;
  $('[data-onboarding-id]').each(function(){
    if (i !== 0) {
      return;
    }
    i++;
    var container = this;
    var id = $(container).data('onboarding-id');
    var config = Fliplet.Widget.getData(id);
    var swiperElement = $(container).find('.swiper-container');
    var swiper = new Swiper( swiperElement, {
      direction: 'horizontal',
      loop: false,
      autoHeight: true,
      pagination: '.swiper-pagination-' + id,
      paginationClickable: true,
      nextButton: '.swiper-button-next-' + id,
      prevButton: '.swiper-button-prev-' + id,
      grabCursor: true,
      onSlideChangeEnd: function () {
        /**
         * get current page context if any
         */
        var existingPageContext = Fliplet.Page.Context.get() || {};
        /**
         * use a direct access data structure for faster lookup later
         * store the current slider context under the slider's id
         */
        var slidersContext = existingPageContext.sliders || {};
        slidersContext[id] = swiper.activeIndex;

        Fliplet.Page.Context.set(_.assign(existingPageContext, slidersContext));
      }
    });

    globalSwiper = swiper;

    swiper.update();

    $(window).on('resize', function() {
      swiper.update();
    });

    Fliplet.Hooks.on('appearanceChanged', function () {
      swiper.update();
    });

    Fliplet.Hooks.on('restorePageContext', function (pageContext) {
      if(pageContext && pageContext[id]){
        swiper.slideTo(pageContext[id]);
      }
    });

    $(container).find('.ob-skip span').click(function () {
      var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder').data('onboarding-id') );

      if(!_.isUndefined(data) && (!_.isUndefined(data.skipLinkAction) && !_.isEmpty(data.skipLinkAction))) {
        Fliplet.Navigate.to(data.skipLinkAction);
      }
    });

    $(container).find('.btn[data-slide-button-id]').click(function (event) {
      event.preventDefault();

      var data = Fliplet.Widget.getData( $(this).parents('.onboarding-holder').data('onboarding-id') );
      var itemData = _.find(data.items,{id: $(this).data('slide-button-id')});

      if(!_.isUndefined(itemData) && (!_.isUndefined(itemData.linkAction) && !_.isEmpty(itemData.linkAction))) {
        Fliplet.Navigate.to(itemData.linkAction);
      }
    });

  });
}

// Creating slide template to put in to the slide content
function slideTemplate (data) {
  var template = data.imageConf ? '<img src="'+data.imageConf.url+'" />' : '';
  template += '<h1>'+data.title+'</h1>';
  template += data.description ? '<p>'+data.description.replace(/(?:\r\n|\r|\n)/g, '<br/>')+'</p>' : '';
  template += data.linkAction.action ? '<input data-slide-button-id="'+data.id+'" type="button" class="btn btn-primary" value="'+data.linkLabel ? data.linkLabel : "Continue"+'" />' : '';

  return template;
}

// Cheking if user changed array order in interface
function hasArrayChangedOrder (domArray, newArray) {
  var changed = false;

  domArray.each(function(index, element) {
    if ( element.dataset.sliderId !== newArray[index].id ) {
      changed = true;
      return false;
    }
  });

  return changed;
}

// Drawing slides according to new array order
function reDrawAllSlides(data) {
  
  globalSwiper.removeAllSlides();

  _.forEach(data, function (item) {
    globalSwiper.appendSlide('<div class="swiper-slide" data-slider-id="'+item.id+'"></div>');
  });
}

// Main fanction to update and show slides
function updateSlide (data, widgetId, activeSlide) {

  var $slidesInDom = $('[data-slider-id]');

  if (firstInit || data.length === 0) {
    Fliplet.Studio.emit('reload-widget-instance', widgetId);
    firstInit = data.length === 0;
    return;
  }

  var currentSlide = activeSlide !== undefined ? activeSlide : globalSwiper.activeIndex;

  
  if ($slidesInDom.length !== data.length) {
    if ($slidesInDom.length > data.length) {
      var deletedPosition;
      $slidesInDom.each(function(index, element) {
        if ( !data[index] || element.dataset.sliderId !== data[index].id  ) {
          globalSwiper.removeSlide(index);
          deletedPosition = index;
          return false;
        }
      });
      if (deletedPosition === ($slidesInDom.length - 1)) {
        currentSlide = deletedPosition - 1;
      } else {
        currentSlide = deletedPosition;
      }
    } else {
      globalSwiper.appendSlide('<div class="swiper-slide" data-slider-id="'+data[data.length-1].id+'"></div>');
      currentSlide = data.length - 1;
    }
  } else { 
    var arrayChanged = hasArrayChangedOrder($slidesInDom, data);
    if (arrayChanged) {
      reDrawAllSlides(data);
    }
  }

  _.forEach(data, function(item) {
    var newTemplate = slideTemplate(item);
    $('[data-slider-id='+item.id+']').html(newTemplate);
  });

  globalSwiper.updateAutoHeight(500);
  globalSwiper.slideTo(currentSlide, 500, false);
}

var debounceLoad = _.debounce(init, 500);

Fliplet.Studio.onEvent(function (event) {

  var eventDetail = event.detail;

if (eventDetail.event === 'reload-widget-instance') {
  debounceLoad();
  return;
}

if (eventDetail.type === 'updateSlide') {
  updateSlide(eventDetail.data, eventDetail.widgetId, eventDetail.index);
}

});

init();
