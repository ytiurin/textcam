if ( !navigator )
  navigator = {}

if ( !navigator.mediaDevices )
  navigator.mediaDevices = {}

if ( !navigator.mediaDevices.getUserMedia ) {
  navigator.mediaDevices.getUserMedia = function( constraints ) {
    return new Promise( function( resolve, reject ) {
      var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

      if ( !getUserMedia )
        reject({
          message: "This browser doesn't support camera capture.",
          name: "BrowserSupportError"
        })

      else
        getUserMedia.call( navigator, constraints, resolve, reject )
    })
  }
}
