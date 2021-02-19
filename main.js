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

  //changes the internal mode between player and character when a new tab is selected.
  $('input:radio[name="select-screen"]').change(function () {
    clearSearch();

    //switches mode variable
    switch ($(this).val()) {
      case 'character':
        mode = modes.character;
        break;
      case 'player':
        mode = modes.player;
        break;
    }
  });

  //narrows results from the search bar.
  $('#search-bar').on('input', function (e) {
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
  });

  //on tile-button click, navigate
  $('.tile-button').click(function () {
    window.location.href = '/characters/' +
      $(this).attr('id')
      .slice(0, $(this).attr('id').length - 5);
  });

  $('#search-label-icon').click(clearSearch);

  $('#add-char-fab').click(addPlayer);

  //makes all tiles visible before switching tabs to avoid confusion & deletes search text.
  function clearSearch() {
    allTiles[mode].each(function (index, tile) {
      $(tile).removeClass('collapsed');
    });
    $('#search-bar').val('');
    $('#search-label-icon').html('search');
  }

  function addPlayer() {
    var playerTile = `
<span class="tile-button" id="mario-tile">
  <span class="background-number">74e</span>
  <span class="character-image" style="background-image: url('images/min%20min.png');"></span>
  <span class="name-plate">mario</span>
  <span class="foreground-number">
    <span class="inner-foreground-number"><span>74e</span></span><span></span>
  </span>
</span>
`;
  }
});
