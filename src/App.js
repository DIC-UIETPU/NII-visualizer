import logo from "./logo.svg";
import "./App.css";
import nifti from "./nifti-reader.js";
import React from "react";
import ReactDOM from "react-dom";

function readNIFTI(name, data) {
  var canvas = document.getElementById("myCanvas");
  var slider = document.getElementById("myRange");
  var niftiHeader, niftiImage;
  console.log("Goood Work");
  // parse nifti
  if (nifti.isCompressed(data)) {
    data = nifti.decompress(data);
  }

  if (nifti.isNIFTI(data)) {
    niftiHeader = nifti.readHeader(data);
    niftiImage = nifti.readImage(niftiHeader, data);
  }

  // set up slider
  var slices = niftiHeader.dims[3];
  slider.max = slices - 1;
  slider.value = Math.round(slices / 2);
  slider.oninput = function () {
    drawCanvas(canvas, slider.value, niftiHeader, niftiImage);
  };

  // draw slice
  drawCanvas(canvas, slider.value, niftiHeader, niftiImage);
}

function drawCanvas(canvas, slice, niftiHeader, niftiImage) {
  // get nifti dimensions
  var cols = niftiHeader.dims[1];
  var rows = niftiHeader.dims[2];

  // set canvas dimensions to nifti slice dimensions
  canvas.width = cols;
  canvas.height = rows;

  // make canvas image data
  var ctx = canvas.getContext("2d");
  var canvasImageData = ctx.createImageData(canvas.width, canvas.height);

  // convert raw data to typed array based on nifti datatype
  var typedData;

  if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT8) {
    typedData = new Uint8Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT16) {
    typedData = new Int16Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT32) {
    typedData = new Int32Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT32) {
    typedData = new Float32Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT64) {
    typedData = new Float64Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT8) {
    typedData = new Int8Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT16) {
    typedData = new Uint16Array(niftiImage);
  } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT32) {
    typedData = new Uint32Array(niftiImage);
  } else {
    return;
  }

  // offset to specified slice
  var sliceSize = cols * rows;
  var sliceOffset = sliceSize * slice;

  // draw pixels
  for (var row = 0; row < rows; row++) {
    var rowOffset = row * cols;

    for (var col = 0; col < cols; col++) {
      var offset = sliceOffset + rowOffset + col;
      var value = typedData[offset];

      /* 
         Assumes data is 8-bit, otherwise you would need to first convert 
         to 0-255 range based on datatype range, data range (iterate through
         data to find), or display range (cal_min/max).
         
         Other things to take into consideration:
           - data scale: scl_slope and scl_inter, apply to raw value before 
             applying display range
           - orientation: displays in raw orientation, see nifti orientation 
             info for how to orient data
           - assumes voxel shape (pixDims) is isometric, if not, you'll need 
             to apply transform to the canvas
           - byte order: see littleEndian flag
      */
      canvasImageData.data[(rowOffset + col) * 4] = value & 0xff;
      canvasImageData.data[(rowOffset + col) * 4 + 1] = value & 0xff;
      canvasImageData.data[(rowOffset + col) * 4 + 2] = value & 0xff;
      canvasImageData.data[(rowOffset + col) * 4 + 3] = 0xff;
    }
  }

  ctx.putImageData(canvasImageData, 0, 0);
}

function makeSlice(file, start, length) {
  var fileType = typeof File;

  if (fileType === "undefined") {
    return function () {};
  }

  if (File.prototype.slice) {
    return file.slice(start, start + length);
  }

  if (File.prototype.mozSlice) {
    return file.mozSlice(start, length);
  }

  if (File.prototype.webkitSlice) {
    return file.webkitSlice(start, length);
  }

  return null;
}

function readFile(file) {
  var blob = makeSlice(file, 0, file.size);

  var reader = new FileReader();

  reader.onloadend = function (evt) {
    if (evt.target.readyState === FileReader.DONE) {
      readNIFTI(file.name, evt.target.result);
    }
  };

  reader.readAsArrayBuffer(blob);
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.inputFileRef = React.createRef();
    this.onFileChange = this.handleFileChange.bind(this);
    this.onBtnClick = this.handleBtnClick.bind(this);
  }

  handleFileChange(e) {
    /*Selected files data can be collected here.*/
    console.log(e.target.files);
    var files = e.target.files;
    readFile(files[0]);
  }

  handleBtnClick() {
    /*Collecting node-element and performing click*/
    this.inputFileRef.current.click();
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div id="select">
            <h3>NII visualizer</h3>
            <input type="file" ref={this.inputFileRef} onChange={this.onFileChange} />
            <button onClick={this.onBtnClick}>Select file</button>
            <hr />
          </div>

          <div id="results">
            <canvas id="myCanvas" width="100" height="100"></canvas>
            <br />
            <input type="range" min="1" max="100" defaultValue="50" className="slider" id="myRange"></input>
          </div>
        </header>
      </div>
    );
  }
}

export default App;
