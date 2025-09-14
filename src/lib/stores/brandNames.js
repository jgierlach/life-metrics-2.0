import { writable } from 'svelte/store'

export const brandNames = writable([])

export const loadBrandNames = () => {
  try {
    fetch('https://sheet2api.com/v1/q0IL93DpQfSb/distribution-client-sku-mapping/Sheet2')
      .then((response) => response.json())
      .then((data) => {
        brandNames.set(data)
        return data
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  } catch (err) {
    console.log(err)
  }
}
