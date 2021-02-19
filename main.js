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
  $('.tile-button').click(navigateToCharacter);
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

  }

  function removePlayer(e) {
    $(e.data.hostElement).remove();
    closeRightClickMenu();
  }

  function renamePlayer(e) {
    //todo you'll probably have to make a popup system for this and the delete button.
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
