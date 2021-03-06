import React, { Component, PropTypes } from 'react'
import jsQR from 'jsqr'
import 'md-gum-polyfill'

export default class Reader extends Component {
  handleVideo(stream) {
    const { preview } = this.refs
    if(window.URL.createObjectURL){
      preview.src = window.URL.createObjectURL(stream)
    }else if (window.webkitURL) {
      preview.src = window.webkitURL.createObjectURL(stream)
    } else if (preview.mozSrcObject !== undefined) {
      preview.mozSrcObject = stream
    } else {
      preview.src = stream
    }

    preview.addEventListener('loadstart', e => {
      preview.play()
      if(this.props.interval){
        setInterval(this.check.bind(this), this.props.interval)
      }else{
        window.requestAnimationFrame(this.check.bind(this))
      }
    })
  }
  componentDidMount(){
    this.initiate.apply(this)
  }
  initiate(){
    const { handleError } = this.props
    const constrains = {
      video: {
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 776, ideal: 720, max: 1080 }
      }
    }
    if (navigator.mediaDevices.getUserMedia){
      navigator.mediaDevices.getUserMedia(constrains)
      .then(this.handleVideo.bind(this))
      .catch(e => handleError(e.name))
    }else{
      handleError('Not compatible with getUserMedia')
    }
  }
  check() {
    const { height, width, interval, handleScan } = this.props
    const { preview, canvas } = this.refs
    if(!interval)
      window.requestAnimationFrame(this.check.bind(this))

    if (preview.readyState === preview.HAVE_ENOUGH_DATA){
      const ctx = canvas.getContext('2d')
      ctx.drawImage(preview, 0, 0, width, height)
      const imageData = ctx.getImageData(0, 0, width, height)
      const decoded = jsQR.decodeQRFromImage(imageData.data, imageData.width, imageData.height, width)
      if(decoded)
        handleScan(decoded)
    }
  }
  render(){
    const { height, width } = this.props
    const previewStyle = {
      display: 'none'
    }
    const canvasStyle = {
      height,
      width
    }
    return (
      <section>
        <video style={previewStyle} ref="preview"/>
        <canvas style={canvasStyle} ref="canvas"/>
      </section>
    )
  }
}

Reader.defaultProps = {
  height: 240,
  width: 320,
  interval: null
}
Reader.propTypes = {
  height: PropTypes.number,
  width: PropTypes.number,
  handleScan: PropTypes.func.isRequired,
  handleError: PropTypes.func.isRequired,
  interval: PropTypes.number
}
