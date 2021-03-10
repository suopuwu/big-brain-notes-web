const noteTypes = {
  text: 0,
  image: 1
};

//returns an ever increasing value, there can be no duplicates because each time it is called, it increases.
var iterator = function () {
  let value = 0;
  return function () {
    return value++;
  }
}()

class Note {
  constructor({
    content,
    title,
    type
  } = {}) {
    this._content = content;
    this._title = title;
    this._type = type;
    this.id = `${iterator()}${createUUID()}`;
  }
  get html() {
    return `
      <span class="note-card" id=${this.id}>
        <span class="note-title">${this._title}</span>
        <span class="note-body">
          ${this.bodyHtml}
        </span>
      </span>`;
  }
  get bodyHtml() {
    switch (this._type) {
      case noteTypes.text:
        return `<textarea class="text-note" role="textbox" placeholder="Write notes here...">${this._content}</textarea>`;
      case noteTypes.image:
        if (this.content === '') {
          return `<button class="mdl-button mdl-js-button mdl-button--flat mdl-js-ripple-effect add-note-image-placeholder" style="width:calc(100% - 40px); margin: 20px;" id="">
        Click Here To Add an Image
      </button>`
        } else {
          return `<image src="${this.content}" class="note-image">`;
        }
    }
  }

  delete() {
    $('#' + this.id).remove();
    delete noteManager.notes[this.id];
  }

  set content(val) {
    this._content = val;
    console.log(this.type);
    if (this._type === noteTypes.image) {
      $('> .note-body', '#' + this.id).html(val);
    }
  }
  get content() {
    return this._content;
  }

  set title(val) {
    this._title = val;
    $('> .note-title', '#' + this.id).html(val);
  }
  get title() {
    return _title;
  }

};

const noteManager = {
  notes: {},
  addTextNote: function ({
    content = '',
    title = 'New Note'
  } = {}) {
    var newNote = new Note({
      content: content,
      title: title,
      type: noteTypes.text
    });
    noteManager.notes[newNote.id] = newNote;
    $($('.note-column')[findSmallestColumn()])
      .append(newNote.html).children().last()
      .on('contextmenu', suopRightClick.rightClick)
      .children('.note-body').children()
      .on('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight + 1) + 'px';
        //    $(this).val('this is a big phat test'); how to change the value 
      });

  },
  addImageNote: function ({
    content = '',
    title = 'New Note'
  } = {}) {
    var newNote = new Note({
      content: content,
      title: title,
      type: noteTypes.image
    });
    noteManager.notes[newNote.id] = newNote;
    $($('.note-column')[findSmallestColumn()])
      .append(newNote.html).children().last()
      .on('contextmenu', suopRightClick.rightClick)
      .children('.note-body').children()
      //finds the image within the newly created note
      .wrap('<span style="display:inline-block"></span>')
      .css('display', 'block')
      .parent()
      .zoom({
        magnify: 1.5
      }).click(function (clickEvent) {
        suopPopup.pop(popupConfirmHtml({
          title: 'Change Image',
          id: 'reimageNote',
          body: `<input id="reimageNoteInput" autocomplete="off"></input>`
        }));
        $('#reimageNoteInput').focus();
        var text = new Promise(function (resolve, reject) {
          $('#reimageNoteInput').keydown(function (e) {
            if (e.keyCode === 13) {
              resolve($('#reimageNoteInput').val());
            }
          });

          $('#confirmreimageNote').click(function () {
            resolve($('#reimageNoteInput').val())
          });
          $('#cancelreimageNote').click(() => reject());
        });

        text.then(function (newImage) {
          noteManager.notes[$(clickEvent.currentTarget).parent().parent()[0].id].content = newImage;
        }, function () {
          console.log('failed')
        }).finally(function () {
          suopPopup.close();
        });
      });

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
  //pseudo load notes function.
  for (note of templateData) {
    switch (note.type) {
      case (noteTypes.text):
        noteManager.addTextNote(note);
        break;
      case (noteTypes.image):
        noteManager.addImageNote(note);
        break;
    }
  }

  $('#add-text-note').click(noteManager.addTextNote);
  $('#add-image-note').click(noteManager.addImageNote);

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
    clickEvent: function () {
      suopPopup.pop(popupConfirmHtml({
        title: 'New Name',
        id: 'renameNote',
        body: `<input id="renameNoteInput" autocomplete="off"></input>`
      }));
      suopRightClick.close();
      $('#renameNoteInput').focus();
      var text = new Promise(function (resolve, reject) {
        $('#renameNoteInput').keydown(function (e) {
          if (e.keyCode === 13) {
            resolve($('#renameNoteInput').val());
          }
        });

        $('#confirmrenameNote').click(function () {
          resolve($('#renameNoteInput').val())
        });
        $('#cancelrenameNote').click(() => reject());
      });

      text.then(function (newText) {
        noteManager.notes[suopRightClick.currentTarget.id].title = newText;
      }, function () {
        console.log('failed')
      }).finally(function () {
        suopPopup.close();
      });
    }
  });

  suopRightClick.addMenuItem({
    title: 'Delete',
    icon: 'delete',
    clickEvent: function () {
      suopPopup.pop(popupConfirmHtml({
        title: 'Delete Note?',
        id: 'deleteNote',
        body: ''
      }));
      suopRightClick.close();

      $('#confirmdeleteNote').click(function () {
        noteManager.notes[suopRightClick.currentTarget.id].delete();
        suopPopup.close();
      });

      $('#canceldeleteNote').click(suopPopup.close);
    }
  });
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
