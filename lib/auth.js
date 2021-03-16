var ui = new firebaseui.auth.AuthUI(firebase.auth());

$(function () {
  $('#sign-in-button').click(function () {
    suopPopup.pop('<div id="firebaseui-auth-container"></div>');
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false
        },
    ],
      signInSuccessUrl: false,
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
          console.log(authResult);
          // User successfully signed in.
          // Return type determines whether we continue the redirect automatically
          // or whether we leave that to developer to handle.
          return false;
        }

      },
      // Other config options...
    });
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        console.log(user);
        console.log('logged');
      }
    })
  });
});
