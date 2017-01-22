import "./save-as.js"
import "./getUserMedia.js"
import binarize from "./binarize.js"
import Tesseract from "./tesseract.js"

import "style-loader!font-awesome/css/font-awesome.min.css"
import "style-loader!./stylesheet.css"

function byId( id )
{
  return document.getElementById( id )
}

function toArray( obj )
{
  return Array.prototype.slice.call( obj )
}

function byClass( cl )
{
  return toArray( document.getElementsByClassName( cl ))
}

function showScreen( id )
{
  byClass( "screen" ).map( function( el ) {
    el.classList.add( "hide" )
  })

  id = id.map ? id : [ id ]

  id.map( function( id ) {
    byId( id ).classList.remove( "hide" )
  })
}

var viewportRect = byClass("screen")[0].getBoundingClientRect()
var screenWidth = viewportRect.width
var screenHeight = viewportRect.height
var userMediaStream
var videoWidth, videoHeight
var video = byId('video')
var canvas = byId('canvas')
var context = canvas.getContext('2d');

var recognizedText = ""
var lang = "eng"
var tessPromise
var prevScreenId

function recognizeFile(file)
{
  tessPromise = Tesseract.recognize( file, lang )
  .progress(function(packet){
    // console.info(packet)
    byId( "progress-screen" ).classList.remove( "error" )
    byId( "progress-message" ).innerHTML = packet.status.charAt(0).toUpperCase() + packet.status.substr( 1 )
    byId( "progress" ).value = packet.progress * 100 << 0
  })
  .then(function(data){
    // console.log(data)
    recognizedText = data.text

    byId( "textarea" ).innerHTML = data.text
    showScreen( "textarea-screen" )
  })
  .catch( function (e) {
    // console.log(e)
    showScreen([ prevScreenId, "progress-screen" ])
    byId( "progress-screen" ).classList.add( "error" )
    byId( "progress-message" ).innerHTML = "Could not recognize text"

    if ( e.indexOf( "NetworkError" ) > -1 )
      byId( "progress-message" ).innerHTML = "Could not download resources"
  })
}

var screenRatio = screenWidth / screenHeight
var nextProjectFrame = 0

function projectVideo()
{
  videoWidth = video.videoWidth
  videoHeight = video.videoHeight
  var videoRatio = videoWidth / videoHeight
  var resizeRatio = screenRatio < videoRatio ?
    videoHeight / screenHeight : videoWidth / screenWidth
  var sWidth = screenWidth * resizeRatio << 0
  var sHeight = screenHeight * resizeRatio << 0
  var sx = ( videoWidth - sWidth ) / 2 << 0
  var sy = ( videoHeight - sHeight ) / 2 << 0

  context.drawImage(video, sx, sy, sWidth, sHeight,
    0,0, screenWidth, screenHeight)
  // binarize( context, screenWidth, screenHeight )

  if ( nextProjectFrame )
    requestAnimationFrame( projectVideo )
}

function stopProjectVideo()
{
  nextProjectFrame = 0
  canvas.removeEventListener( "click", capturePhoto )
  byId("capture-button").removeEventListener( "click", capturePhoto )

  requestAnimationFrame( function() {
    userMediaStream.getTracks()[0].stop()
  })

  byId( "capture-photo" ).addEventListener( "click", enableCameraCapture )
}

function capturePhoto()
{
  var rcanvas = byId('recognize-canvas')
  rcanvas.width = videoWidth
  rcanvas.height = videoHeight
  var context = rcanvas.getContext('2d');
  context.drawImage(video, 0, 0, videoWidth, videoHeight);

  // Error occures when video is not loaded yet
  try {
    binarize( context, videoWidth, videoHeight )
    recognizeFile(context.getImageData(0, 0, screenWidth, screenHeight))
    stopProjectVideo()

    showScreen([ "capture-screen", "progress-screen" ])
  }
  catch ( e ) {
    // Ignore it
  }
}

function enableCameraCapture()
{
  tessPromise && tessPromise._instance.terminate()

  prevScreenId = "capture-screen"
  showScreen( "capture-screen" )

  navigator.mediaDevices.getUserMedia(
    { video: { width: screenWidth, height: screenHeight },
      facingMode: { exact: "environment" },
      aspectRatio: screenWidth / screenHeight })
  .then(function(stream) {
    video.src = window.URL.createObjectURL(stream);
    video.play();
    userMediaStream = stream

    canvas.width = screenWidth
    canvas.height = screenHeight
    canvas.addEventListener( "click", capturePhoto )
    byId("capture-button").addEventListener( "click", capturePhoto )

    nextProjectFrame = 1
    projectVideo()
  })
  .catch( function( err ) {
    //~_~
    prevScreenId = "start-screen"
    showScreen([ "start-screen", "progress-screen" ])
    byId( "progress-screen" ).classList.add( "error" )
    byId( "progress-message" ).innerHTML = "Please, turn on the camera."
    byId( "capture-photo" ).addEventListener( "click", enableCameraCapture )
  })

  byId( "capture-photo" ).removeEventListener( "click", enableCameraCapture )
}

function start()
{
  prevScreenId = "start-screen"
  showScreen( "start-screen" )
}

// BUTTONS CLICKS
byId( "upload-file-button" ).addEventListener( "click", function() {
  byId( "upload-file" ).click()
})
byId( "upload-file" ).addEventListener( "change", function() {
  if ( !this.files[0] )
    return
  recognizeFile(window.lastFile=this.files[0])
  byId( "progress-screen" ).classList.remove( "error" )
  showScreen([ "start-screen", "progress-screen" ])
})

byId( "capture-photo" ).addEventListener( "click", enableCameraCapture )
byClass( "lang-button" ).map( function( el ) {
  el.addEventListener( "click", function() {
    showScreen( "lang-screen" )
  })
})
byId( "close-lang-button" ).addEventListener( "click", function() {
  showScreen( prevScreenId )
})
byId( "cancel-recognize-button" ).addEventListener( "click", function() {
  showScreen( "start-screen" )
  if ( prevScreenId === "capture-screen" )
    enableCameraCapture()
})
byId( "close-capture-button" ).addEventListener( "click", stopProjectVideo )
byId( "close-capture-button" ).addEventListener( "click", start )
byId( "close-textarea-button" ).addEventListener( "click", start )

// SELECT LANG
byClass( "lang-val" ).map( function( el ) {
  el.addEventListener( "click", function( e ) {
    lang = this.dataset.val
    byClass("selected-lang").map( function( el ) {
      el.innerHTML = e.target.innerHTML
    })
    showScreen( prevScreenId )
  })
})

// FILE DOWNLOAD
function downloadFile( plain, text, mimetype, ext )
{
  var byteNumbers = new Uint8Array(text.length);
  for (var i = 0; i < text.length; i++)
    byteNumbers[i] = text.charCodeAt(i);
  var blob = new Blob([byteNumbers], {type: mimetype });
  var title = plain.substr(0,20).split(" ").slice(0,-1).join(" ")

  window.saveAs(blob, title + "." + ext );
}

document.getElementById("download-txt").addEventListener( "click", function() {
  downloadFile( recognizedText, recognizedText, "text/plain", "txt" )
})

document.getElementById("download-doc").addEventListener( "click", function() {
  downloadFile( recognizedText,  "<html><head><xml><word:WordDocument><word:View>Print</word:View><word:Zoom>90</word:Zoom><word:DoNotOptimizeForBrowser/></word:WordDocument></xml></head><body>" + recognizedText.replace(/\n/g,"<br>") + "</body></html>", "text/html", "doc" )
})

// WINDOW RESIZE
window.addEventListener("resize", function() {
  viewportRect = byClass("screen")[0].getBoundingClientRect()
  screenWidth = viewportRect.width
  screenHeight = viewportRect.height
  screenRatio = screenWidth / screenHeight

  canvas.width = screenWidth
  canvas.height = screenHeight
})

// DETECT CAMERA FEATURE
if ( !( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia )) {
  byId( "capture-photo" ).style.display = "none"
}

start()
setTimeout(function(){

  downloadFile( "lil",  "<html><head><xml><word:WordDocument><word:View>Print</word:View><word:Zoom>90</word:Zoom><word:DoNotOptimizeForBrowser/></word:WordDocument></xml></head><body>lil</body></html>", "text/html", "doc" )

},7000)
