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
      playersRef.on('value', (snapshot) => {
        const players = snapshot.val();
        console.log(players);
        for (let key in players) {
          var player = players[key];
          $('#pss').append(getTileHtml({
            name: player.name,
            id: key,
            color: player.color,
            image: player.image
          }));
        }
      });
      console.log('secondary on authstate changed');
      $('#pss > .tile-button').click(navigateToPlayer);
    }
  });

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
    const playerTile = `
    <span class="tile-button" id="mario-tile" style="background-color: #${getRandomColor()};">
      <span class="character-image" style="background-image: url('images/min%20min.png');"></span>
      <span class="name-plate">Player</span>
    </span>
    `;

    $('#pss').append(playerTile);
    /* TODO structure design:
    
    adding immediately adds dom ui elements in a loading state.
    pings server to generate uuid and create entry in database. 
    The server response adds in the link to the player tile.
    removes loading style
    */
  }

  function removePlayer(e) {
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopup.pop(`
      <div>Are you sure you want to delete this player?</div>
      <div style="text-align: right;">
        <a href="javascript:;" class="ripple" id="cancelDelete"><i class="material-icons" style="padding:10px;padding-right: 5;cursor: pointer;">close</i></a>
        <a href="javascript:;" class="ripple" id="confirmDelete"><i class="material-icons" style="padding:10px; cursor: pointer;padding-left: 5px;">check</i></a>
      </div>
    `);

    $('#confirmDelete').click(function () {
      $(e.data.hostElement).remove();
      suopPopup.close();
    });
    $('#cancelDelete').click(() => suopPopup.close());
  }

  function renamePlayer(e) {
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
          $('> .name-plate', e.data.hostElement).html(value);
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
        $(e.data.hostElement).css('background-color', value);
      })
      .finally(function () {
        suopPopup.close();
      });
  }

  function reimagePlayer(e) {
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopup.pop(`
      <div>Choose Your Image</div>
      <input id="reimagePlayer" type="file" style="width: 10vmax; height: 40px; background-color: transparent; outline: none; border: none;" value="${$(
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
    }); //todo make this integrated with the server.
    //when an image is selected, it is validated so it can't harm the server, then uploaded,
    //then once uploaded the response is sent to the client and the image is put into place.
    //otherwise it gives an error.

    //handles confirmation/cancellation of the rename
    color
      .then(function (value) {
        $(e.data.hostElement).css('background-color', value);
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
    id
  } = {}) {
    return `
      <span class="tile-button" id="${id}-tile" style="background-color: #${color}">
        ${number ? '<span class="background-number">' + number + '</span>' : ''}
        <span class="character-image" style="background-image: url('${image}');"></span>
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
});