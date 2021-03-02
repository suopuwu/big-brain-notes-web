class Note {
  constructor({
    content,
    title
  } = {
    content: '',
    title: 'Note Title'
  }) {
    this.content = content;
    this.title = title;
  }
  get textHtml() {
    return `
    <span class="note-card">
      <span class="note-title"><span>${this.title}</span> <i class="material-icons note-menu">more_vert</i>
      </span>
      <span class="note-body">
        <textarea class="text-note" role="textbox" placeholder="Write notes here...">${this.content}</textarea>
      </span>
    </span>
  `
  }
  get imageHtml() {
    return `
    <span class="note-card">
      <span class="note-title"><span>Image Note</span> <i class="material-icons note-menu">more_vert</i>
      </span>
      <span class="note-body">
        <image src="https://picsum.photos/400/400" class="note-image">
      </span>
    </span>
  `
  }
};

function popupConfirmHtml({
  body,
  id,
  title
} = {}) {
  this.confirmHtmlId = `cancel${id}`;

  return `
    <div>${title}</div>
    ${body}
    <div id="suopPopupOptions" style="text-align: right;">
      <a href="javascript:;" class="ripple" id="cancel${id}"><i class="material-icons" style="padding:10px;padding-right: 5;cursor: pointer;">close</i></a>
      <a href="javascript:;" class="ripple" id="confirm${id}"><i class="material-icons" style="padding:10px; cursor: pointer;padding-left: 5px;">check</i></a>
    </div>
  `;
}


function replaceNoteImage(noteDom, newImage) {

}

function findSmallestColumn() {
  var columnLengths = [];
  $('.note-column').each(function (index, columnDom) {
    columnLengths[index] = $(columnDom).height();
  });
  var smallestColumn = 0;
  for (let i = 0; i < columnLengths.length; i++) {
    if (columnLengths[i] < columnLengths[smallestColumn]) {
      smallestColumn = i;
    }
  }
  return smallestColumn;
}

$(function () {
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

  $('#add-text-note').click(() => $($('.note-column')[findSmallestColumn()])
    .append(new Note().textHtml));

  $('#add-image-note').click(() => $($('.note-column')[findSmallestColumn()])
    .append(new Note().imageHtml).children().last()
    .children('.note-body').children()
    //finds the image within the newly created note
    .wrap('<span style="display:inline-block"></span>')
    .css('display', 'block')
    .parent()
    .zoom({
      magnify: 1.5
    }));

  //resizes textboxes to be the right size.
  function initTextSize() {
    $('.text-note').each(function () {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight + 1) + 'px';
    });
  }
  initTextSize();

  suopRightClick.initialize();
  suopRightClick.addMenuItem({
    title: 'Rename',
    icon: 'edit',
    clickEvent: function (hostElement) {
      suopPopup.pop(popupConfirmHtml({
        title: 'New Name',
        id: 'renameNote',
        body: `<input id="renameNoteInput"></input>`
      }));
      suopRightClick.close();

      var text = new Promise(function (resolve, reject) {
        $('#renameNoteInput').keydown(function (e) {
          if (e.keyCode === 13) {
            resolve($('#renameNoteInput').val());
          }
        });

        $(document).on('click', '#confirmrenameNote', function () {
          resolve($('#renameNoteInput').val())
        });
        $('#cancelrenameNote').click(() => reject());
      });

      text.then(function (newText) {
        console.log(newText);
      }, function () {
        console.log('failed')
      }).finally(function () {
        suopPopup.close();
      });
    }
  });
  $('.note-card').on('contextmenu', suopRightClick.rightClick);
});
//todo make a test json or something to import notes from.
//todo add a slider to change the magnification on zoom.
//$('#example').trigger('zoom.destroy'); to remove zoom.
//todo possibly add a license to avoid legal trouble.
//todo make a list of items that are then rendered into notes
//todo make it so that you can edith the note info like title, image, be it with a right click menu or otherwise.
//todo newly created textboxes do not auto adjust size.
//todo ensure graceful handling of multiple sessions on the same account.
//todo read on security for allowing users to upload their own files.
