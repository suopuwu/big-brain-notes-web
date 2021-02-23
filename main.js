//getting the background color in jquery gives a hex code instead of rgb
$.cssHooks.backgroundColor = {
  get: function (elem) {
    if (elem.currentStyle)
      var bg = elem.currentStyle["backgroundColor"];
    else if (window.getComputedStyle)
      var bg = document.defaultView.getComputedStyle(elem,
        null).getPropertyValue("background-color");
    if (bg.search("rgb") == -1)
      return bg;
    else {
      bg = bg.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

      function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
      }
      return "#" + hex(bg[1]) + hex(bg[2]) + hex(bg[3]);
    }
  }
}

const suopPopUp = {
  pop: function (content) {
    if ($('#suop-popup').length === 0) {
      $('body').append(`
      <div style="position:fixed;height:100vh;width:100vw;background-color:rgba(0,0,0,0.5);z-index:1000;transition: all 0.2s;display:flex;justify-content: center;align-items: center;opacity:0;backdrop-filter: blur(3px);" id="suop-popup">
        <span id="inner-suop-popup" style ="box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);background-color:white;padding: 20px;border-radius:10px;"></span>
      </div>
    `);
      replaceContent();
      setTimeout(function () {
        $('#suop-popup').css('opacity', '1');
      }, 1);


      $('#suop-popup').click(function () {
        suopPopUp.close();
      });
      $('#inner-suop-popup').click(function (e) {
        e.stopPropagation();

      });
    } else {
      replaceContent();
      $('#suop-popup').css('display', 'flex');
      setTimeout(function () {
        $('#suop-popup').css('opacity', '1');
      }, 1);
    }

    function replaceContent() {
      $('#inner-suop-popup').html(content);
    }
  },
  close: function () {
    $('#suop-popup').css('opacity', '0');
    setTimeout(function () {
      $('#suop-popup').css('display', 'none');
    }, 200);
  }

}

$(function () {
  //    console.log($('#css > .tile-button').attr('id'));
  var charTiles = $('#css > .tile-button');
  var playerTiles = $('#pss > .tile-button');
  var allTiles = [charTiles, playerTiles];
  const modes = {
    character: 0,
    player: 1
  };
  var mode = modes.character;

  $('input:radio[name="select-screen"]').change(internalModeSwitch);
  $('#search-bar').on('input', pruneSearchTerms);
  $('#css > .tile-button').click(navigateToCharacter);
  $('#pss > .tile-button').click(navigateToPlayer);
  $('#search-label-icon').click(clearSearch);
  $('#add-char-fab').click(addPlayer);

  $('#pss > .tile-button').on('contextmenu', rightClickMenu);
  //changes the internal mode between player and character when a new tab is selected.
  //This matters because the search mode only searches in the active tab.
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
    window.location.href = '/characters/' +
      $(this).attr('id')
      .slice(0, $(this).attr('id').length - 5);
  }

  function navigateToPlayer() {

  }

  function pruneSearchTerms(e) {
    const searchQuery = $('#search-bar').val();

    if (searchQuery.length > 0) {
      $('#search-label-icon').html('close');
    } else {
      $('#search-label-icon').html('search');
    }

    allTiles[mode].each(function (index, tile) {
      if ($(tile) //if a tile contains the search term.
        .attr('id')
        .slice(0, $(tile).attr('id').length - 5) //sliced to remove the -tile
        .includes(searchQuery)) {
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
      hostElement: this
    }, removePlayer);
    $('#menuRename').off('click').click({
      hostElement: this
    }, renamePlayer);
    $('#menuRecolor').off('click').click({
      hostElement: this
    }, recolorPlayer);
    $('#menuReimage').off('click').click({
      hostElement: this
    }, reimagePlayer);



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
    $('#pss > span:last-child').on('contextmenu', rightClickMenu);
    /* TODO structure design:
    
    adding immediately adds dom ui elements in a loading state.
    pings server to generate uuid and create entry in database. 
    The server response adds in the link to the player tile.
    removes loading style
    */

  }



  function removePlayer(e) {
    $(e.data.hostElement).remove();
    closeRightClickMenu();
  }

  function renamePlayer(e) {
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopUp.pop(`
      <div>New Name</div>
      <input type="text" id="renameCharacter" autocomplete="off" value="${$('> .name-plate', e.data.hostElement).html()}">
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
    text.then(function (value) {
        $('> .name-plate', e.data.hostElement).html(value);
      }, function () {
        console.log('rejected')
      })
      .finally(function () {
        suopPopUp.close();
      });
  }

  function recolorPlayer(e) {
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopUp.pop(`
      <div>New Color</div>
      <input id="recolorPlayer" type="color" style="width: 10vmax; height: 40px; background-color: transparent; outline: none; border: none;" value="${$(e.data.hostElement).css('background-color')}">
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
    color.then(function (value) {
        $(e.data.hostElement).css('background-color', value);
      })
      .finally(function () {
        suopPopUp.close();
      });
  }

  function reimagePlayer(e) {
    closeRightClickMenu();
    //creates a popup with rename player content
    suopPopUp.pop(`
      <div>Choose Your Image</div>
      <input id="reimagePlayer" type="file" style="width: 10vmax; height: 40px; background-color: transparent; outline: none; border: none;" value="${$(e.data.hostElement).css('background-color')}">
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
    color.then(function (value) {
        $(e.data.hostElement).css('background-color', value);
      })
      .finally(function () {
        suopPopUp.close();
      });
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
