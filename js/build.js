function init(){
  $('[data-onboarding-id]').each(function(){
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
        var slidersContext = _.assign(existingPageContext.sliders || {}, {
          [id]: swiper.activeIndex
        });

        Fliplet.Page.Context.set(_.assign(existingPageContext, slidersContext));
      }
    });

    swiper.update();

    $(window).on('resize', function() {
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
var debounceLoad = _.debounce(init, 500);

Fliplet.Studio.onEvent(function (event) {
  if (event.detail.event === 'reload-widget-instance') {
    debounceLoad();
  }
});
init();
