//getting the background color in jquery gives a hex code instead of rgb
$.cssHooks.backgroundColor = {
  get: function (elem) {
    if (elem.currentStyle) var bg = elem.currentStyle.backgroundColor;
    else if (window.getComputedStyle)
      var bg = document.defaultView
        .getComputedStyle(elem, null)
        .getPropertyValue('background-color');
    if (bg.search('rgb') == -1) return bg;
    else {
      bg = bg.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

      function hex(x) {
        return ('0' + parseInt(x).toString(16)).slice(-2);
      }
      return '#' + hex(bg[1]) + hex(bg[2]) + hex(bg[3]);
    }
  },
};

$(function () {
  //    console.log($('#css > .tile-button').attr('id'));
  var charTiles = $('#css > .tile-button');
  var playerTiles = $('#pss > .tile-button');
  var allTiles = [charTiles, playerTiles];
  const modes = {
    character: 0,
    player: 1,
  };
  var mode = modes.character;

  $('input:radio[name="select-screen"]').change(internalModeSwitch);
  $('#search-bar').on('input', pruneSearchTerms);
  $('#css > .tile-button').click(navigateToCharacter);
  //dynamically adds event listeners
  $('#pss').on('click', '.tile-button', navigateToPlayer)
    .on('contextmenu', '.tile-button', rightClickMenu);
  $('#search-label-icon').click(clearSearch);
  $('#add-char-fab').click(addPlayer);

  //changes the internal mode between player and character when a new tab is selected.
  //This matters because the search mode only searches in the active tab.

  firebase.auth().onAuthStateChanged(function (user) { //adds player buttons
    if (user) {
      //if already logged in
      var playersRef = database.ref('users/' + user.uid + '/players');
      //on value change
      playersRef.on('value', (snapshot) => {
        const players = snapshot.val();
        for (let key in players) {
          var player = players[key];
          var tileHtml = getTileHtml({
            name: player.name,
            id: key,
            color: player.color,
            image: 'images/logo.png',
          });
          if ($('#' + key + '-tile').length > 0) {
            //if the element has already been added, replace the existing one's subelements

            $('#' + key + '-tile > .name-plate').html(player.name);
            $('#' + key + '-tile').css('background-color', player.color);
          } else {
            //otherwise, add a new one.
            $('#pss').append(tileHtml);
            $('#' + key + '-tile')
              .data('imagePath', player.image).fadeIn().removeClass('invisible');
            loadAndChangeImage(player, key);
          }
        }
      });
      $('#pss > .tile-button').click(navigateToPlayer);
    }
  });

  //todo it does not do anything when a character is deleted on the server. May have to fix this.
  function internalModeSwitch() {
    clearSearch();
    switch ($(this).val()) {
      case 'character':
        mode = modes.character;
        break;
      case 'player':
        mode = modes.player;
        break;
    }
  }

  function navigateToCharacter() {
    window.location.href =
      '/characters/' +
      $(this)
      .attr('id')
      .slice(0, $(this).attr('id').length - 5);
  }

  function navigateToPlayer() {
    window.location.href =
      '/players/' +
      $(this)
      .attr('id')
      .slice(0, $(this).attr('id').length - 5);
  }

  function pruneSearchTerms(e) {
    const searchQuery = $('#search-bar').val();

    if (searchQuery.length > 0) {
      $('#search-label-icon').html('close');
    } else {
      $('#search-label-icon').html('search');
    }

    allTiles[mode].each(function (index, tile) {
      if (
        $(tile) //if a tile contains the search term.
        .attr('id')
        .slice(0, $(tile).attr('id').length - 5) //sliced to remove the -tile
        .includes(searchQuery)
      ) {
        $(tile).removeClass('collapsed');
      } else {
        $(tile).addClass('collapsed');
      }
    });
  }

  //makes all tiles visible before switching tabs to avoid confusion & deletes search text.
  function clearSearch() {
    allTiles[mode].each(function (index, tile) {
      $(tile).removeClass('collapsed');
    });
    $('#search-bar').val('');
    $('#search-label-icon').html('search');
  }

  function rightClickMenu(e) {
    //makes menu visible & positions
    e.preventDefault();
    $('#right-click-menu')
      .css('top', `${e.pageY}px`)
      .css('left', `${e.pageX}px`)
      .removeClass('transform-collapsed');

    //menu items
    $('#menuDelete').off('click').click({
        hostElement: this,
      },
      removePlayer
    );
    $('#menuRename').off('click').click({
        hostElement: this,
      },
      renamePlayer
    );
    $('#menuRecolor').off('click').click({
        hostElement: this,
      },
      recolorPlayer
    );
    $('#menuReimage').off('click').click({
        hostElement: this,
      },
      reimagePlayer
    );

    //closes menu when user clicks outside of it.
    $('#right-click-menu').on('click', function (e) {
      e.stopPropagation();
    });
    $(document).on('click', function (e) {
      closeRightClickMenu();
    });
  }

  function closeRightClickMenu() {
    $('#right-click-menu').addClass('transform-collapsed');
    $('#right-click-menu').off('click');
    $(document).off('click');
  }

  function addPlayer() {
    var newTileRef = database.ref('users/' + user.uid + '/players').push({
      name: 'New Player',
      color: getRandomColor()
    });
  }

  function removePlayer(e) {
    var domId = $(e.data.hostElement).attr('id');
    var id = domId.substring(0, domId.length - 5);
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopup.pop(`
      <div>Are you sure you want to delete this player? This cannot be undone.</div>
      <div style="text-align: right;">
        <a href="javascript:;" class="ripple" id="cancelDelete"><i class="material-icons" style="padding:10px;padding-right: 5;cursor: pointer;">close</i></a>
        <a href="javascript:;" class="ripple" id="confirmDelete"><i class="material-icons" style="padding:10px; cursor: pointer;padding-left: 5px;">check</i></a>
      </div>
    `);

    $('#confirmDelete').click(function () {
      try {
        storageRef.child($(e.data.hostElement).data('imagePath')).delete().then(function () {
          console.log('image deleted');
        });
      } catch (err) {
        if ($(e.data.hostElement).data('imagePath') !== undefined) {
          //if there was actually an image to delete but an error happened.
          console.error(err);
        }
      }
      database.ref('users/' + user.uid + '/players/' + id).remove();
      $(e.data.hostElement).remove();
      suopPopup.close();
    });
    $('#cancelDelete').click(() => suopPopup.close());
  }

  function renamePlayer(e) {
    var domId = $(e.data.hostElement).attr('id');
    var id = domId.substring(0, domId.length - 5);
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopup.pop(`
      <div>New Name</div>
      <input type="text" id="renameCharacter" autocomplete="off" value="${$(
        '> .name-plate',
        e.data.hostElement
      ).html()}">
      <div style="text-align: right;">
        <a href="javascript:;" class="ripple" id="cancelRename"><i class="material-icons" style="padding:10px;padding-right: 5;cursor: pointer;">close</i></a>
        <a href="javascript:;" class="ripple" id="confirmRename"><i class="material-icons" style="padding:10px; cursor: pointer;padding-left: 5px;">check</i></a>
      </div>
    `);
    $('#renameCharacter').select();

    //awaits the text entered.
    var text = new Promise(function (resolve, reject) {
      $('#renameCharacter').keydown(function (e) {
        if (e.keyCode === 13) {
          resolve($('#renameCharacter').val());
        }
      });
      $('#confirmRename').click(() => resolve($('#renameCharacter').val()));
      $('#cancelRename').click(() => reject());
    });

    //handles confirmation/cancellation of the rename
    text
      .then(
        function (value) {
          database.ref('users/' + user.uid + '/players/' + id + '/name')
            .set(value);
        },
        function () {
          console.log('rejected');
        }
      )
      .finally(function () {
        suopPopup.close();
      });
  }

  function recolorPlayer(e) {
    var domId = $(e.data.hostElement).attr('id');
    var id = domId.substring(0, domId.length - 5);
    closeRightClickMenu();

    //creates a popup with rename player content
    suopPopup.pop(`
      <div>New Color</div>
      <input id="recolorPlayer" type="color" style="width: 10vmax; height: 40px; background-color: transparent; outline: none; border: none;" value="${$(
        e.data.hostElement
      ).css('background-color')}">
      <div style="text-align: right;">
        <a href="javascript:;" class="ripple" id="cancelRecolor"><i class="material-icons" style="padding:10px;padding-right: 5;cursor: pointer;">close</i></a>
        <a href="javascript:;" class="ripple" id="confirmRecolor"><i class="material-icons" style="padding:10px; cursor: pointer;padding-left: 5px;">check</i></a>
      </div>
    `);

    $('#confirmRecolor').focus();
    //awaits the color entered.
    var color = new Promise(function (resolve, reject) {
      $('#confirmRecolor').click(() => resolve($('#recolorPlayer').val()));
      $('#cancelRecolor').click(() => reject());
    });

    //handles confirmation/cancellation of the rename
    color
      .then(function (value) {
        database.ref('users/' + user.uid + '/players/' + id + '/color')
          .set(value);
      })
      .finally(function () {
        suopPopup.close();
      });
  }

  function reimagePlayer(e) {
    var domId = $(e.data.hostElement).attr('id');
    var id = domId.substring(0, domId.length - 5);
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopup.pop(`
      <div>Choose Your Image (1MB limit)</div>
      <input id="reimagePlayer" type="file" style="width: 10vmax; height: 40px; background-color: transparent; outline: none; border: none;" value="${$(
        e.data.hostElement
      ).css('background-color')}" accept="image/png, image/jpeg, image/gif, image/jpg, image/webp"
      accept="image/png, image/jpeg" >
      <div style="text-align: right;">
        <a href="javascript:;" class="ripple" id="cancelReimage"><i class="material-icons" style="padding:10px;padding-right: 5;cursor: pointer;">close</i></a>
        <a href="javascript:;" class="ripple" id="confirmReimage"><i class="material-icons" style="padding:10px; cursor: pointer;padding-left: 5px;">check</i></a>
      </div>
    `);
    //awaits the color entered.
    var image = new Promise(function (resolve, reject) {
      $('#confirmReimage').click(() => resolve($('#reimagePlayer').val()));
      $('#cancelReimage').click(() => reject());
    });
    //TODO make this integrated with the server.
    //when an image is selected, it is validated so it can't harm the server, then uploaded,
    //then once uploaded the response is sent to the client and the image is put into place.
    //otherwise it gives an error.
    //TODO validation
    //TODO make it so that users can use image urls and the images are downloaded automatically.
    //TODO polish ui for uploading
    //handles confirmation/cancellation of the rename
    image.then(function (fileName) {

        var file = $('#reimagePlayer')[0].files[0];
        var imageHtml = `
          <span class="character-image" id="${id}-image" style="display: none; background-image: url(${URL.createObjectURL(file)})"></span>
          `;

        //updates profile picture in storage
        var uploadIndicator = $.mSnackbar({
          text: 'Uploading <i id="upload-percentage">0</i>%',
          lifeSpan: Infinity
        })
        var imageUpload = storageRef.child(
          `users/${user.uid}/images/${id}-profile-picture.${getFileExtension(fileName)}`
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
        database.ref('users/' + user.uid + '/players/' + id + '/image')
          .set(`users/${user.uid}/images/${id}-profile-picture.${getFileExtension(fileName)}`);

        //changes html to match
        $('#' + domId + '> .character-image').replaceWith(imageHtml);
        $('#' + domId + '> .character-image').fadeIn();
      })
      .finally(function () {
        suopPopup.close();
      });
  }

  function getTileHtml({
    name,
    color,
    number,
    image,
    id,
  } = {}) {
    return `
      <span class="tile-button invisible" id="${id}-tile" style="background-color: ${color}; display: none;">
        ${number ? '<span class="background-number">' + number + '</span>' : ''}
        <span class="character-image" id="${id}-image" style="display: none"></span>
        <span class="name-plate">${name}</span>
        ${number? `<span class="foreground-number"><span class="inner-foreground-number"><span>` + number + `</span></span>`: ''}
        </span>
      </span>
    `;
  }

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function loadAndChangeImage(player, id) {
    if (player.image && !player.image.includes('http')) {
      //if string is not a path to firebase storage
      storageRef.child(
          player.image
        ).getDownloadURL()
        .then((url) => {
          preloadImage(url).then((image) => {
            $('#' + id + '-image').css('background-image',
              `url('${url}')`).fadeIn();
          });
        }).catch((error) => {
          console.log(error);
        });
    } else {
      preloadImage(player.image).then((image) => {
        $('#' + id + '-image').css('background-image',
          `url('${player.image}')`).fadeIn();
      });
    }
  }
});