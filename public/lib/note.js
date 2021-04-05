// const windowUrl = 'players/-MWM43Pmy8tD8pH_Pv2A';//for debug purposes
// removes the first / of the url path
const windowUrl = window.location.pathname.substring(1);
//returns an ever increasing value, there can be no duplicates because each time it is called, it increases.
var iterator = function () {
  let value = 0;
  return function () {
    return value++;
  };
}();
//todo fix search css

$(function () {
  $.mSnackbar({
    text: 'test',
    lifeSpan: Infinity
  });
  $.mSnackbar({
    text: 'test',
    lifeSpan: Infinity
  });

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
      this.type = type;
      this.id = id;
      this.title = title;
    }

    //generates html for a note
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
      switch (this.type) {
        case noteTypes.text:
          return `<textarea class="text-note" role="textbox" placeholder="Write notes here..." data-key="${this.id}">${this._content}</textarea>`;
        case noteTypes.image:
          //if the image is not set, make the ui show a button to add an image
          if (this.content === '') {
            return `<button class="mdl-button mdl-js-button mdl-button--flat mdl-js-ripple-effect add-note-image-placeholder" style="width:calc(100% - 40px); margin: 20px;" id="">
              Click Here To Add an Image
            </button>`;
          } else {
            //Set a placeholder, get the image, preload it, then replace the placeholder
            storageRef.child(
                this.content
              ).getDownloadURL()
              .then((url) => {
                preloadImage(url).then((image) => {
                  //#region animation for loading images in
                  var dimensions = {
                    x: image.width,
                    y: image.height
                  };
                  var imageRatio = $(`#${this.id}-image`).width() / dimensions.x;
                  //change the size of the placeholder to match the finished image
                  $(`#${this.id}-loader-css`).html(`
                    #${this.id}-image:after {
                      content: "";
                      display: block;
                      padding-bottom: ${dimensions.y * imageRatio}px;
                      transition: all 0.2s;
                    }`);
                  //replace the placeholder with the image.
                  setTimeout(() => {
                    $(`#${this.id}-image`).replaceWith(`
                          <image id="${this.id}-image" src="${url}" class="note-image">`);
                    $(`#${this.id}-image`).parent().zoom({
                      magnify: 1.5
                    });
                  }, 200);
                  //#endregion
                });
              });
            //add placeholder
            return `
            <span id="${this.id}-image" class="loader">
              <style id="${this.id}-loader-css"> 
                #${this.id}-image:after {
                  content: "";
                  display: block;
                  padding-bottom: 100%;
                  transition: all 0.2s;
                }
              </style>
            </span>`;
          }
      }
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
        .fadeIn(50);
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

  function authStateChangedUi(userExists, populated = false) {
    switch (userExists) {
      case true:

        if (populated) { //if both the user and their notes have loaded
          $('#main-loader').fadeOut(100, function () {
            $('.main-container').fadeIn(100);
          });
        } else { //if the user has loaded, but their notes have not
          $('#loading-text').html(`<h3>Populating notes...</h3>`);

        }
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

  //todo make it so that you cannot confirm the image without a file in place that is valid.
  function changeNoteImage(e) {
    //creates popup to edit image
    suopPopup.pop(popupConfirmHtml({
      title: 'Change Image',
      id: 'reimageNote',
      body: `<input id="reimageNoteInput" type="file" style="width: 10vmax; height: 40px; background-color: transparent; outline: none; border: none;" accept="image/png, image/jpeg, image/gif, image/jpg, image/webp">`
    }));
    $('#reimageNoteInput').focus();

    //awaits image selection
    var image = new Promise(function (resolve, reject) {
      $('#confirmreimageNote').click(function () {
        resolve($('#reimageNoteInput').val());
      });
      $('#cancelreimageNote').click(() => reject());
    });

    //on confirmation of upload
    image.then(function (fileName) {
        //gets prerequisite information
        var file = $('#reimageNoteInput')[0].files[0];
        var domId = $(e.target).closest('.note-card')[0].id;
        var noteId = domId.substr(0, domId.length - '-note'.length);
        //deletes the old image. Needs to do this because rewriting the old one risks creating duplicates if they have different file extensions.
        if (noteManager.notes[noteId].content !== '') {
          storageRef.child(noteManager.notes[noteId].content).delete()
            .then(function () {
              console.log('image deleted');
            });
        }

        //uploads
        var uploadIndicator = $.mSnackbar({
          text: 'Uploading <i id="upload-percentage">0</i>%',
          lifeSpan: Infinity
        });
        var imageUpload = storageRef.child(
          `users/${user.uid}/images/${noteId}-note-image.${getFileExtension(fileName)}`
        ).put(file);
        imageUpload.on('state_changed', (snapshot) => {
          var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          $('#upload-percentage').html(Math.trunc(progress));
        });
        imageUpload.then((snapshot) => {
          console.log('Uploaded photo!');
          setTimeout(() => uploadIndicator.close(), 1000);
        });
        //todo possibly fix the fact that if they try to delete the note before it finishes uploading, it causees an error.
        //updates path to picture in database
        database.ref(`users/${user.uid}/${windowUrl}/notes/${noteId}/content`)
          .set(`users/${user.uid}/images/${noteId}-note-image.${getFileExtension(fileName)}`);
        noteManager.notes[noteId].content = `users/${user.uid}/images/${noteId}-note-image.${getFileExtension(fileName)}`;
        //changes html to match
        $(e.target).parent() //selects all images, including the zoom image
          .html(`<image id="${noteId}-image" src="${URL.createObjectURL(file)}" class="note-image">`)
          .zoom({
            magnify: 1.5
          });
      },
      function () {
        console.log('failed');
      }).finally(function () {
      suopPopup.close();
    });
  }

  function syncUiChange(synced) {
    switch (synced) {
      case true:
        window.onbeforeunload = null;
        $('#sync-indicator-icon').html('cloud_done').removeClass('loading-icon');
        $('#sync-indicator >span').html('Text changes saved');
        break;
      case false:
        window.onbeforeunload = function () {
          return "Your work is not saved! Please wait for it to upload.";
        };
        $('#sync-indicator-icon').html('cloud_queue').addClass('loading-icon');
        $('#sync-indicator >span').html('syncing...');
        break;
    }
  }

  function loadNotes(user) {
    var notePageRef = database.ref(`users/${user.uid}/${windowUrl}`);
    notePageRef.on('value', (snapshot) => {
      if (snapshot.val() !== null) { //if the user exists
        if (firstTime) {
          $('title').html(titleCase(snapshot.val().name) + ' | Big Brain Notes');
          $('#note-page-title').html(titleCase(snapshot.val().name));
          console.log(snapshot.val().name);
          $('#note-container').css('background-color', snapshot.val().color);
          authStateChangedUi(true, true);
          firstTime = false;
        }

        //changes theme based on stored data

        var notes = snapshot.val().notes;
        //todo make middle click open note in new tab
        //creates a list of client side notes
        var currentNoteKeys = function () {
          var keyArray = [];
          for (let note in noteManager.notes) {
            keyArray.push(note);
          }
          return keyArray;
        }();

        //adds notes to ui
        for (let noteKey in notes) {
          const note = notes[noteKey];
          const noteId = `${noteKey}-note`;

          //removes notes that exist in the database from the list
          currentNoteKeys = currentNoteKeys.filter(key => key !== noteKey);
          //if the note exists, add it. Otherwise, edit the existing note.
          if ($('#' + noteId).length === 0) {
            setTimeout(() => {
              noteManager.addNote({
                content: note.content,
                title: note.title,
                id: noteKey,
                type: note.type
              });
            }, 200);
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
        }

        //removes deleted notes from the clientside.
        for (let noteKey of currentNoteKeys) {
          $(`#${noteKey}-note`).remove();
        }
      } else {
        $('#loading-text').html(`<h3>The note page you are looking for does not exist</h3>`);
        let charactersList = [];
        for (let character of Object.keys(basicCharData)) {
          charactersList.push(character.replace(/\040/gi, '-'));
        }
        console.log(charactersList);
        const characterName = windowUrl.split('/')[1];
        const characterNameWithSpaces = characterName.replace(/-/gi, ' ');
        if (charactersList.includes(characterName)) {
          database.ref(`users/${user.uid}/${windowUrl}`).set({
            name: characterNameWithSpaces,
            color: '#' + basicCharData[characterNameWithSpaces].theme.toString(16).substr(2),
            notes: {
              defaultNote: {
                type: noteTypes.text,
                title: 'Matchup Notes',
                content: ''
              }
            }
          });
        }
      }
    });
  }

  //#region pull notes from storage and initialize custom right click
  //pseudo load notes function.
  var firstTime = true;
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      authStateChangedUi(true);
      loadNotes(user);

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
        database.ref(`users/${user.uid}/${windowUrl}/notes/${noteId}/title`).set(newText);
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

        database.ref(`users/${user.uid}/${windowUrl}/notes/${noteId}`).remove();
        if (noteManager.notes[noteId].type === noteTypes.image &&
          noteManager.notes[noteId].content !== '') { //makes sure there is a file to delete
          console.log(noteManager.notes[noteId]);
          storageRef.child(noteManager.notes[noteId].content).delete()
            .then(function () {
              console.log('image deleted');
            });
        }
        delete noteManager.notes[noteId];
        suopPopup.close();
      });

      $('#canceldeleteNote').click(suopPopup.close);
    }
  });
  //#endregion
  //todo make this not specific to player notes.
  //executes a function after the specified number of ms, but if it is called again before the timer is up, it resets the timer.
  //if run without arguments, it gives a list of ongoing timers.
  var deferNoDuplicates = function () {
    var timeouts = {};
    return function ({
      callback,
      timerLength,
      id
    } = {}) {
      if (callback) {

        if (!id) {
          id = 'default';
        }
        if (timeouts[id]) {
          clearTimeout(timeouts[id]);
        }
        timeouts[id] = setTimeout(() => {
          callback();
          timeouts[id] = null;
        }, timerLength);
      } else {
        return timeouts;
      }

    };
  }();

  function updateTextInDatabase(inputtedTextBox) {
    console.log($(inputtedTextBox).attr('data-key') + ' saved');
    database.ref(`users/${user.uid}/${windowUrl}/notes/${$(inputtedTextBox).attr('data-key')}/content`).set($(inputtedTextBox).val());
  }

  function saveAllTextNotes(e) {
    for (let noteKey in noteManager.notes) {
      if (noteManager.notes[noteKey].type === noteTypes.text) {
        updateTextInDatabase($(`#${noteKey}-note > .note-body > textarea`)[0]);
      }
    }
    e.preventDefault();
    syncUiChange(true);
  }

  //event handlers for dynamically added elements.
  $(document)
    //expands textboxes as they type and saves inputted text to the cloud
    .on('input', '.text-note', (e) => {
      e.preventDefault();
      console.log();

      const inputtedTextBox = e.currentTarget;
      const noteId = $(e.target).attr('data-key');
      inputtedTextBox.style.height = 'auto';
      inputtedTextBox.style.height = (inputtedTextBox.scrollHeight + 1) + 'px';
      syncUiChange(false);

      //prevents it from sending more than one write per three seconds
      deferNoDuplicates({
        callback: () => updateTextInDatabase(inputtedTextBox),
        timerLength: 3000,
        id: noteId
      });
      deferNoDuplicates({
        callback: () => syncUiChange(true),
        timerLength: 3500, //an extra 3500 to be sure it has uploaded
        id: 'all notes saved'
      });
    })
    .on('keydown', '.text-note', (e) => {
      if (e.ctrlKey && (e.which == 83)) {
        saveAllTextNotes(e);
      }
    })
    .bind('keydown', 'ctrl+s', (e) => {
      saveAllTextNotes(e);
    })
    //makes right click on notes open a custom menu
    .on('contextmenu', '.note-card', suopRightClick.rightClick)
    .on('click', '.zoomImg', (e) => changeNoteImage(e))
    .on('click', '.add-note-image-placeholder', (e) => changeNoteImage(e));

  $('#add-text-note').click(() =>
    database.ref(`users/${user.uid}/${windowUrl}/notes`).push({
      title: 'New Note',
      content: '',
      type: noteTypes.text
    }));
  $('#add-image-note').click(() => database.ref(`users/${user.uid}/${windowUrl}/notes`).push({
    title: 'New Image',
    content: '',
    type: noteTypes.image
  }));

});

//$('#example').trigger('zoom.destroy'); to remove zoom.
//todo possibly add a license to avoid legal trouble.
//todo ensure graceful handling of multiple sessions on the same account.
//todo make rename popup auto populate and select text.
//todo make sure that deleting a note deletes the corresponding image.
//todo add graceful error handling for upload