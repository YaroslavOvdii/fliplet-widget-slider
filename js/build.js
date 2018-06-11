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
      grabCursor: true
    });

    swiper.update();

    $(window).on('resize', function() {
      swiper.update();
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
