import { writable } from 'svelte/store'

export const skuMapping = writable([])

export const loadSkuMapping = () => {
  try {
    fetch('https://sheet2api.com/v1/q0IL93DpQfSb/distribution-client-sku-mapping')
      .then((response) => response.json())
      .then((data) => {
        skuMapping.set(data)
        console.log('skuMapping', data)
        return data
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  } catch (err) {
    console.log(err)
  }
}
