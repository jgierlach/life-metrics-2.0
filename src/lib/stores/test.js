import { writable } from 'svelte/store'

export const testStore = writable([])

export const loadTestStore = () => {
  try {
    fetch('https://jsonplaceholder.typicode.com/posts')
      .then(response => response.json())
      .then(data => {
        testStore.set(data)
        console.log('test', data)
        return data
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  } catch (err) {
    console.log(err)
  }
}