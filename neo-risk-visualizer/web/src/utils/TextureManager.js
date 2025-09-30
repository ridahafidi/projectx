// Texture management system for progressive loading
import * as THREE from 'three'

class TextureManager {
  constructor() {
    this.cache = new Map()
    this.loader = new THREE.TextureLoader()
    this.loadingPromises = new Map()
  }

  // Get texture with progressive loading
  async getTexture(url, fallbackUrl = null) {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)
    }

    // Start loading
    const promise = this.loadTexture(url, fallbackUrl)
    this.loadingPromises.set(url, promise)
    
    try {
      const texture = await promise
      this.cache.set(url, texture)
      this.loadingPromises.delete(url)
      return texture
    } catch (error) {
      this.loadingPromises.delete(url)
      throw error
    }
  }

  loadTexture(url, fallbackUrl) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // Optimize texture settings
          texture.generateMipmaps = true
          texture.minFilter = THREE.LinearMipmapLinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.wrapS = THREE.RepeatWrapping
          texture.wrapT = THREE.RepeatWrapping
          texture.colorSpace = THREE.SRGBColorSpace
          resolve(texture)
        },
        undefined,
        (error) => {
          if (fallbackUrl) {
            // Try fallback URL
            this.loadTexture(fallbackUrl, null)
              .then(resolve)
              .catch(reject)
          } else {
            reject(error)
          }
        }
      )
    })
  }

  // Preload textures for smooth transitions
  preloadTextures(urls) {
    const promises = urls.map(url => this.getTexture(url))
    return Promise.allSettled(promises)
  }

  // Clear cache to free memory
  clearCache() {
    this.cache.forEach(texture => texture.dispose())
    this.cache.clear()
  }

  // Get available texture sizes
  getAvailableSizes(baseName) {
    const sizes = ['512', '1024', '2048', '4096']
    return sizes.map(size => `/textures/earth/${baseName}_${size}.jpg`)
  }
}

export const textureManager = new TextureManager()

// LOD texture loader hook
export function useLODTexture(baseName, zoomLevel) {
  const [texture, setTexture] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    
    const loadTexture = async () => {
      setLoading(true)
      
      try {
        // Determine texture size based on zoom level
        const size = zoomLevel > 3 ? '2048' : 
                    zoomLevel > 2 ? '1024' : 
                    zoomLevel > 1 ? '1024' : '512'
        
        const url = `/textures/earth/${baseName}_${size}.jpg`
        const fallbackUrl = `/textures/earth/${baseName}_1024.jpg`
        
        const loadedTexture = await textureManager.getTexture(url, fallbackUrl)
        
        if (!cancelled) {
          setTexture(loadedTexture)
          setLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.warn(`Failed to load texture ${baseName}:`, error)
          setLoading(false)
        }
      }
    }

    loadTexture()

    return () => {
      cancelled = true
    }
  }, [baseName, zoomLevel])

  return { texture, loading }
}

export default TextureManager