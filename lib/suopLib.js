const suopRightClick = {
  currentTarget: document,
  //relies on ripple & material icons library
  initialize: function () {
    $('body').append(`
      <style> 
        #suop-right-click-menu {
          display: flex;
          position: absolute;
          z-index: 999;
          flex-flow: column;
          background-color: white;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
          border-radius: 5px;
          padding: 10px;
          transition: transform 0.1s;
          transform-origin: top left;
        }

        #suop-right-click-menu > a {
          display: flex;
          flex-flow: row nowrap;
          align-items: center;
          padding: 10px;
          text-decoration: none;
          color: #1b1b1b;
          overflow: hidden;
        }

        .suop-transform-collapsed {
          transform: scale(0);
        }

        #suop-right-click-menu > a > i {
          padding-right: 10px;
        }

        #suop-right-click-menu > a > i:empty {
          padding-right: 0;
        }
      </style>
      <div id="suop-right-click-menu" class="transform-collapsed">
      </div>
  `);
  },
  rightClick: function (e) {
    //makes menu visible & positions
    e.preventDefault();
    $('#suop-right-click-menu')
      .css('top', `${e.pageY}px`)
      .css('left', `${e.pageX}px`)
      .removeClass('transform-collapsed');
    suopRightClick.currentTarget = e.currentTarget;
    //closes menu when user clicks outside of it.
    $('#suop-right-click-menu').on('click', function (e) {
      e.stopPropagation();
    });
    $(document).on('click', function (e) {
      suopRightClick.close();
    });
  },

  close: function () {
    $('#suop-right-click-menu').addClass('transform-collapsed');
    $('#suop-right-click-menu').off('click');
    $(document).off('click');
  },

  addMenuItem: function ({
    title,
    icon,
    clickEvent
  } = {
    title: '',
    icon: '',
    clickEvent: function () {
      console.log('This menu item has nothing set');
    }
  }) {
    //adds a new menu item, sets the click event, passes the element parameter into the click event
    $('#suop-right-click-menu').append(`
      <a class="ripple" href="javascript:;" id="suopMenu${title}">
        <i class="material-icons">${icon}</i>${title}</a>`)
      .children().last().click(() =>
        clickEvent());
  }

};

const suopPopup = {
  pop: function (content) {
    if ($('#suop-popup').length === 0) {
      $('body').append(`
      <div style="position:fixed;height:100vh;width:100vw;background-color:rgba(0,0,0,0.5);z-index:1000;transition: all 0.2s;display:flex;justify-content: center;align-items: center;opacity:0;" id="suop-popup">
        <span id="inner-suop-popup" style ="box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);background-color:white;padding: 20px;border-radius:10px;"></span>
      </div>
    `);
      replaceContent();
      setTimeout(function () {
        $('#suop-popup').css('opacity', '1');
      }, 1);


      $('#suop-popup').click(function () {
        suopPopup.close();
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

function createUUID() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
}
