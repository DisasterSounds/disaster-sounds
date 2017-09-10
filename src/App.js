import React, { Component } from 'react'
import { Howl } from 'howler'
import announcement from './boarding-announcement.mp3'
import './App.css'
import * as THREE from 'three'
import geodata from './volcanos.json'
import earthDiffuse from './earth_diffuse.jpg'

const sound = new Howl({
  src: [announcement]
})

// Scene, Camera, Renderer
let renderer = new THREE.WebGLRenderer()
let scene = new THREE.Scene()
let aspect = window.innerWidth / window.innerHeight
let camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1500)
let cameraRotation = 0
let cameraRotationSpeed = 0
let cameraAutoRotation = true

// Lights
let spotLight = new THREE.SpotLight(0xffffff, 1, 0, 10, 0, 2)

// Texture Loader
let textureLoader = new THREE.TextureLoader()

// Planet Proto
let planetProto = {
  sphere: function (size) {
    let sphere = new THREE.SphereGeometry(size, 32, 32)
    return sphere
  },
  material: function (options) {
    let material = new THREE.MeshPhongMaterial()
    if (options) {
      for (var property in options) {
        material[property] = options[property]
      }
    }

    return material
  },
  texture: function (material, property, uri) {
    let textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = true
    textureLoader.load(
      uri,
      function (texture) {
        material[property] = texture
        material.needsUpdate = true
      }
    )
  }
}

let createPlanet = function (options) {
    // Create the planet's Surface
  let surfaceGeometry = planetProto.sphere(options.surface.size)
  let surfaceMaterial = planetProto.material(options.surface.material)
  let surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)

  let planet = new THREE.Object3D()
  surface.name = 'surface'
  planet.add(surface)

    // Load the Surface's textures
  for (let textureProperty in options.surface.textures) {
      planetProto.texture(
            surfaceMaterial,
            textureProperty,
            options.surface.textures[textureProperty]
        )
  }

  return planet
}

let earth = createPlanet({
  surface: {
    size: 0.5,
    textures: {
        map: earthDiffuse,
        emissiveMap: earthDiffuse
      }
  }
})

// Marker Proto
let markerProto = {
  latLongToVector3: function latLongToVector3 (latitude, longitude, radius, height) {
    var phi = (latitude) * Math.PI / 180
    var theta = (longitude - 180) * Math.PI / 180

    var x = -(radius + height) * Math.cos(phi) * Math.cos(theta)
    var y = (radius + height) * Math.sin(phi)
    var z = (radius + height) * Math.cos(phi) * Math.sin(theta)

    return new THREE.Vector3(x, y, z)
  },
  marker: function marker (size, color, vector3Position) {
    let markerGeometry = new THREE.SphereGeometry(size)
    let markerMaterial = new THREE.MeshLambertMaterial({
          color: 0xff0000,
          emissive: 0xff0000
        })
    let markerMesh = new THREE.Mesh(markerGeometry, markerMaterial)
    markerMesh.position.copy(vector3Position)

    return markerMesh
  }
}

// Place Marker
let placeMarker = function (object, options) {
  let position = markerProto.latLongToVector3(options.latitude, options.longitude, options.radius, options.height)
  let marker = markerProto.marker(options.size, options.color, position)
  object.add(marker)
}

// Place Marker At Address
geodata.features.forEach((feature) => {
  let latitude = feature.geometry.coordinates[1]
  let longitude = feature.geometry.coordinates[0]

  placeMarker(earth.getObjectByName('surface'), {
    latitude: latitude,
    longitude: longitude,
    radius: 0.5,
    height: 0,
    size: 0.0075,
    color: 0xff0000
  })

})

// Galaxy
let galaxyGeometry = new THREE.SphereGeometry(100, 32, 32)
let galaxyMaterial = new THREE.MeshBasicMaterial({
  side: THREE.BackSide
})
let galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial)

// Load Galaxy Textures
textureLoader.crossOrigin = true
textureLoader.load(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/141228/starfield.png',
    function (texture) {
      galaxyMaterial.map = texture
      scene.add(galaxy)
    }
)

// Scene, Camera, Renderer Configuration
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

camera.position.set(1, 1, 1)

scene.add(camera)
scene.add(spotLight)
scene.add(earth)

// Light Configurations
spotLight.position.set(0.125, 0, 1)

// Mesh Configurations
earth.receiveShadow = true
earth.castShadow = true
earth.getObjectByName('surface').geometry.center()

// On window resize, adjust camera aspect ratio and renderer size
window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Main render function
let draw = function () {
  earth.getObjectByName('surface').rotation.y -= 0.01
  if (cameraAutoRotation) {
      cameraRotation += cameraRotationSpeed
      camera.position.y = 0
      camera.position.x = 2 * Math.sin(cameraRotation)
      camera.position.z = 2 * Math.cos(cameraRotation)
      camera.lookAt(earth.position)
    }
  requestAnimationFrame(draw)
  renderer.render(scene, camera)
}

draw()

class App extends Component {
  render () {
    function playSound () {
      sound.play()
    }
    function stopSound () {
      sound.stop()
    }
    return (
      <div className='App'>
        <h1>The world is on fire</h1>
        <button type='button' onClick={playSound}>Play</button>
        <button type='button' onClick={stopSound}>Stop</button>
      </div>
    )
  }
}

export default App
