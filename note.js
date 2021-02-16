$(function () {
  //event bindings
  $('.text-note').on('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    //    $(this).val('this is a big phat test'); how to change the value 
  });

  $('.note-image')
    .wrap('<span style="display:inline-block"></span>')
    .css('display', 'block')
    .parent()
    .zoom({
      magnify: 2
    });

  //resizes textboxes to be the right size.
  function initTextSize() {
    $('.text-note').each(function () {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }
  initTextSize();
});
//todo make a test json or something to import notes from.
//todo switch layout to grid for fixed positioning sidebars nerddd
//todo add a slider to change the magnification on zoom.
//$('#example').trigger('zoom.destroy'); to remove zoom.
//todo possibly add a license to avoid legal trouble.
