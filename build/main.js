import "./save-as.js"
import "./getUserMedia.js"
import binarize from "./binarize.js"
import Tesseract from "./tesseract.js"

import "style-loader!font-awesome/css/font-awesome.min.css"
import "style-loader!./stylesheet.css"

function byId( id )
{
  return document.getElementById( id );
}

function byClass( cl )
{
  return document.getElementsByClassName( cl )[0];
}

function toArray( obj )
{
  return Array.prototype.slice.call( obj )
}

var viewportRect = byClass("screen").getBoundingClientRect()
var screenWidth = viewportRect.width
var screenHeight = viewportRect.height
var userMediaStream
var videoWidth, videoHeight
var video = byId('video')
var canvas = byId('canvas')
var context = canvas.getContext('2d');

var recognizedText = ""
var lang = "eng"

function recognizeFile(file)
{
  Tesseract.recognize( file, lang )
  .progress(function(packet){
    console.info(packet)

    byId( "progress-message" ).innerHTML = packet.status.charAt(0).toUpperCase() + packet.status.substr( 1 )
    byId( "progress" ).value = packet.progress * 100 << 0
  })
  .then(function(data){
    console.log(data)

    recognizedText = data.text

    byId( "textarea" ).innerHTML = data.text
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

  binarize( context, videoWidth, videoHeight )
  recognizeFile(context.getImageData(0, 0, screenWidth, screenHeight))
  stopProjectVideo()
}

function enableCameraCapture()
{
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
  })

  byId( "capture-photo" ).removeEventListener( "click", enableCameraCapture )
}

byId( "capture-photo" ).addEventListener( "click", enableCameraCapture )

byId( "close-capture-button" ).addEventListener( "click", stopProjectVideo )

// SELECT LANG
toArray( document.getElementsByClassName( "lang-val" )).map( function( el ) {
  el.addEventListener( "click", function() {
    lang = this.dataset.val
    byId("selected-lang").innerHTML = this.innerHTML
  })
})

// FILE DOWNLOAD
function downloadFile( text, mimetype, ext )
{
var byteNumbers = new Uint8Array(text.length);
for (var i = 0; i < text.length; i++)
  byteNumbers[i] = text.charCodeAt(i);
var blob = new Blob([byteNumbers], {type: mimetype });

window.saveAs(blob, "yes." + ext );
}

document.getElementById("download-txt").addEventListener( "click", function() {
downloadFile( recognizedText, "text/plain", "txt" )
})

document.getElementById("download-doc").addEventListener( "click", function() {
downloadFile( `<html><head><xml><word:WordDocument><word:View>Print</word:View><word:Zoom>90</word:Zoom><word:DoNotOptimizeForBrowser/></word:WordDocument></xml></head><body>${recognizedText.replace(/\n/g,"<br>")}</body></html>`, "text/html", "doc" )
})

// recognizeFile('cosmic.png')
