const fakeUrl = '-MWM43Pmy8tD8pH_Pv2A'; //todo remove

//returns an ever increasing value, there can be no duplicates because each time it is called, it increases.
var iterator = function () {
  let value = 0;
  return function () {
    return value++;
  }
}();


$(function () {
  const noteTypes = {
    text: 0,
    image: 1
  };
  class Note {
    constructor({
      content,
      title,
      type,
      id
    } = {}) {
      this._content = content;
      this._type = type;
      this.id = id;
      this.title = title;
    }
    get html() {
      return `
        <span class="note-card" style="display:none" id="${this.id}-note">
          <span class="note-title">${this.title}</span>
          <span class="note-body">
            ${this.bodyHtml}
          </span>
        </span>`;
    }
    get bodyHtml() {
      switch (this._type) {
        case noteTypes.text:
          return `<textarea class="text-note" role="textbox" placeholder="Write notes here..." data-key="${this.id}">${this._content}</textarea>`;
        case noteTypes.image:
          if (this.content === '') {
            return `<button class="mdl-button mdl-js-button mdl-button--flat mdl-js-ripple-effect add-note-image-placeholder" style="width:calc(100% - 40px); margin: 20px;" id="">
              Click Here To Add an Image
            </button>`;
          } else {
            storageRef.child(
                this.content
              ).getDownloadURL()
              .then((url) => {
                $(`#${this.id}-note > .note-body`).append(`
                    <image id="${this.id}-image" src="${url}" class="note-image">`)
                  .zoom({
                    magnify: 1.5
                  }); //todo make blank image adding work
              });
            //add placeholder
            return '';
          } //todo when adding images, if you add an image with a different extension than the one it had before, it doesn't overwrite the image, but creates a new one. Not a huge issue, but could cause storage problems in the future.
      }
    }

    delete() {
      $('#' + this.id).remove();
      delete noteManager.notes[this.id];
    }

    set content(val) {
      this._content = val;
      if (this._type === noteTypes.image) {
        $('> .note-body', '#' + this.id).html(val);
      }
    }
    get content() {
      return this._content;
    }


  }

  const noteManager = {
    notes: {},
    addNote: function ({
      content = '',
      title = 'New Note',
      id,
      type
    } = {}) {
      var newNote = new Note({
        content: content,
        title: title,
        type: type,
        id: id
      });
      noteManager.notes[newNote.id] = newNote;
      $($('.note-column')[findSmallestColumn()])
        .append(newNote.html).children().last()
        .fadeIn(100);
      //finds the image within the newly created note


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

  function authStateChangedUi(userExists) {
    switch (userExists) {
      case true:
        $('#main-loader').fadeOut(100, function () {

          $('.main-container').fadeIn();
        });
        break;
      case false:
        $('.main-container').fadeOut(100, function () {
          $('#main-loader').fadeIn();
          $('#loading-text').html(`
                  PLEASE<h3>LOGIN</h3>`);
        });
        break;
    }
  }
  //#region pull notes from storage and initialize custom right click
  //pseudo load notes function.

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      authStateChangedUi(true);
      var notePageRef = database.ref('users/' + user.uid + '/players/' + fakeUrl);
      notePageRef.on('value', (snapshot) => {
        var notes = snapshot.val().notes;

        //creates a list of client side notes
        var currentNoteKeys = function () {
          var keyArray = [];
          for (let note in noteManager.notes) {
            keyArray.push(note);
          }
          return keyArray;
        }();

        for (let noteKey in notes) {
          const note = notes[noteKey];
          const noteId = `${noteKey}-note`;

          //removes notes that exist in the database from the list
          currentNoteKeys = currentNoteKeys.filter(key => key !== noteKey);
          //if the note exists, add it. Otherwise, edit the existing note.
          if ($('#' + noteId).length === 0) {
            noteManager.addNote({
              content: note.content,
              title: note.title,
              id: noteKey,
              type: note.type
            });
          } else {
            switch (note.type) {
              case noteTypes.text:
                $(`#${noteId} > .note-body > .text-note`).html(note.content);
                break;
              case noteTypes.image:
                break;
            }
            $(`#${noteId} > .note-title`).html(note.title);
          }
        } //todo make nice animation for image loading in.

        //removes deleted notes from the clientside.
        for (let noteKey of currentNoteKeys) {
          $(`#${noteKey}-note`).remove();
        }

      });


    } else {
      authStateChangedUi(false);
    }
  });

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
          resolve($('#renameNoteInput').val());
        });
        $('#cancelrenameNote').click(() => reject());
      });

      text.then(function (newText) {
        const noteId = suopRightClick.currentTarget.id.substr(0, suopRightClick.currentTarget.id.length - '-note'.length);
        database.ref(`users/${user.uid}/players/${fakeUrl}/notes/${noteId}/title`).set(newText);
      }, function () {
        console.log('failed');
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
        const noteId = suopRightClick.currentTarget.id.substr(0, suopRightClick.currentTarget.id.length - '-note'.length);

        database.ref(`users/${user.uid}/players/${fakeUrl}/notes/${noteId}`).remove();
        suopPopup.close();
      });

      $('#canceldeleteNote').click(suopPopup.close);
    }
  });
  //#endregion

  //event handlers for dynamically added elements.
  $(document)
    //expands textboxes as they type
    .on('input', '.text-note', (e) => {
      var inputedTextBox = e.currentTarget;
      inputedTextBox.style.height = 'auto';
      inputedTextBox.style.height = (inputedTextBox.scrollHeight + 1) + 'px';
    })
    //makes right click on notes open a custom menu
    .on('contextmenu', '.note-card', suopRightClick.rightClick)
    //todo makes clicking on images allow you to edit the image.
    .on('click', '.zoomImg', (e) => {
      console.log('image-clicked');
      suopPopup.pop(popupConfirmHtml({
        title: 'Change Image',
        id: 'reimageNote',
        body: `<input id="reimageNoteInput" type="file" style="width: 10vmax; height: 40px; background-color: transparent; outline: none; border: none;" accept="image/png, image/jpeg, image/gif, image/jpg, image/webp">`
      }));
      $('#reimageNoteInput').focus();
      var image = new Promise(function (resolve, reject) {
        $('#confirmreimageNote').click(function () {
          resolve($('#reimageNoteInput').val());
        });
        $('#cancelreimageNote').click(() => reject());
      });

      image.then(function (fileName) {
          var file = $('#reimageNoteInput')[0].files[0];

          var uploadIndicator = $.mSnackbar({
            text: 'Uploading <i id="upload-percentage">0</i>%',
            lifeSpan: Infinity
          });
          var domId = $(e.currentTarget).closest('.note-card')[0].id;
          var noteId = domId.substr(0, domId.length - '-note'.length);
          var imageUpload = storageRef.child(
            `users/${user.uid}/images/${noteId}-note-image.${getFileExtension(fileName)}`
          ).put(file);
          imageUpload.on('state_changed', (snapshot) => {
            console.log((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            $('#upload-percentage').html(Math.trunc(progress));
          });
          imageUpload.then((snapshot) => {
            console.log('Uploaded photo!');
            setTimeout(() => uploadIndicator.close(), 1000)
          });

          //updates path to picture in database
          database.ref(`users/${user.uid}/players/${fakeUrl}/notes/${noteId}/content`)
            .set(`users/${user.uid}/images/${noteId}-note-image.${getFileExtension(fileName)}`);

          //changes html to match
        },
        function () {
          console.log('failed');
        }).finally(function () {
        suopPopup.close();
      });
    });

  $('#add-text-note').click(() =>
    database.ref(`users/${user.uid}/players/${fakeUrl}/notes`).push({
      title: 'New Note',
      content: '',
      type: noteTypes.text
    }));
  $('#add-image-note').click(() => database.ref(`users/${user.uid}/players/${fakeUrl}/notes`).push({
    title: 'New Image',
    content: '',
    type: noteTypes.image
  }));

});

//todo add a slider to change the magnification on zoom.
//$('#example').trigger('zoom.destroy'); to remove zoom.
//todo possibly add a license to avoid legal trouble.
//todo ensure graceful handling of multiple sessions on the same account.
//todo make rename popup auto populate and select text.
//todo make it so that new notes are auto added to the event listener instead of creating a new event listener for each one.
//todo make sure that deleting a note deletes the corresponding image.
//todo add graceful error handling for upload