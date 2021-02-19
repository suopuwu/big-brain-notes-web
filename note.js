const noteHtml = `
<span class="note-card">
    <span class="note-title"><span>Matchup notes</span> <i class="material-icons note-menu">more_vert</i>
    </span>
    <span class="note-body">
        <textarea class="text-note" role="textbox" placeholder="Write notes here...">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quas, delectus. Magni odio vitae, dolorem neque cupiditate beatae consequuntur eligendi illo.</textarea>
    </span>
</span>
`;

function createNoteHtml() {

}

$(function () {
  //event bindings
  $('.text-note').on('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight + 1) + 'px';
    //    $(this).val('this is a big phat test'); how to change the value 
  });

  $('.note-image')
    .wrap('<span style="display:inline-block"></span>')
    .css('display', 'block')
    .parent()
    .zoom({
      magnify: 1.5
    });

  $('#add-text-note').click(function () {

  });

  //resizes textboxes to be the right size.
  function initTextSize() {
    $('.text-note').each(function () {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight + 1) + 'px';
    });
  }
  initTextSize();
});
//todo make a test json or something to import notes from.
//todo add a slider to change the magnification on zoom.
//$('#example').trigger('zoom.destroy'); to remove zoom.
//todo possibly add a license to avoid legal trouble.
//todo make a list of items that are then rendered into notes
