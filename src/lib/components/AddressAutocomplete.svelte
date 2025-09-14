<script>
  import { createEventDispatcher, onMount } from 'svelte'

  /**
   * @typedef {Object} AddressSuggestion
   * @property {string} id - Unique identifier
   * @property {string} text - Display text
   * @property {string} streetLine - Street address
   * @property {string} city - City name
   * @property {string} state - State abbreviation
   * @property {string} zipCode - ZIP code
   * @property {number} entries - Number of deliverable addresses
   */

  /**
   * @typedef {Object} AddressComponents
   * @property {string} street1 - Street address
   * @property {string} city - City name
   * @property {string} state - State abbreviation
   * @property {string} postalCode - ZIP code
   */

  // Props
  /** @type {string} */
  export let value = ''
  /** @type {string} */
  export let placeholder = 'Start typing an address...'
  /** @type {string} */
  export let inputClass = 'input input-bordered w-full'
  /** @type {boolean} */
  export let disabled = false
  /** @type {number} */
  export let maxSuggestions = 8

  // State
  /** @type {AddressSuggestion[]} */
  let suggestions = []
  let isLoading = false
  let showDropdown = false
  let selectedIndex = -1
  /** @type {HTMLInputElement} */
  let inputElement
  /** @type {HTMLDivElement} */
  let dropdownElement
  /** @type {ReturnType<typeof setTimeout> | null} */
  let searchTimeout = null
  /** @type {AbortController | null} */
  let abortController = null

  const dispatch = createEventDispatcher()

  /**
   * Debounced search function
   * @param {string} query
   */
  async function searchAddresses(query) {
    // Clear previous timeout and abort previous request
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    if (abortController) {
      abortController.abort()
    }

    // Reset state
    suggestions = []
    selectedIndex = -1

    // Skip if query is too short
    if (!query || query.trim().length < 3) {
      showDropdown = false
      return
    }

    // Create new abort controller for this request
    abortController = new AbortController()

    // Debounce the API call
    searchTimeout = setTimeout(async () => {
      try {
        isLoading = true
        showDropdown = true

        const response = await fetch('/app/api/address/smarty-autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query.trim(),
            maxSuggestions,
          }),
          signal: abortController?.signal,
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          console.warn('Address autocomplete error:', data.error)
          showDropdown = false
          return
        }

        suggestions = data.suggestions || []
        showDropdown = suggestions.length > 0
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, ignore
          return
        }
        console.error('Address search error:', error)
        showDropdown = false
      } finally {
        isLoading = false
      }
    }, 300) // 300ms debounce
  }

  /**
   * Handle input changes
   * @param {Event} event
   */
  function handleInput(event) {
    const target = event.target
    if (!target || !('value' in target)) return

    value = String(target.value)
    dispatch('input', { value })
    searchAddresses(value)
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (!showDropdown || suggestions.length === 0) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1)
        scrollToSelected()
        break

      case 'ArrowUp':
        event.preventDefault()
        selectedIndex = Math.max(selectedIndex - 1, -1)
        scrollToSelected()
        break

      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex])
        }
        break

      case 'Escape':
        event.preventDefault()
        closeDropdown()
        break
    }
  }

  /**
   * Scroll selected item into view
   */
  function scrollToSelected() {
    if (!dropdownElement || selectedIndex < 0) return

    const selectedElement = dropdownElement.children[selectedIndex]
    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }

  /**
   * Select an address suggestion
   * @param {AddressSuggestion} suggestion
   */
  async function selectSuggestion(suggestion) {
    value = suggestion.streetLine
    closeDropdown()

    // First, dispatch the basic address components (without ZIP code)
    let addressComponents = {
      street1: suggestion.streetLine,
      city: suggestion.city,
      state: suggestion.state,
      postalCode: '', // Will be filled after validation
    }

    dispatch('addressSelected', addressComponents)

    // Now validate the address to get the ZIP code
    try {
      console.log('Validating address:', {
        street: suggestion.streetLine,
        city: suggestion.city,
        state: suggestion.state,
      })

      const response = await fetch('/app/api/address/smarty-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          street: suggestion.streetLine,
          city: suggestion.city,
          state: suggestion.state,
        }),
      })

      console.log('Validation response status:', response.status)

      if (response.ok) {
        const validationResult = await response.json()
        console.log('Validation result:', validationResult)

        if (validationResult.isValid && validationResult.zipCode) {
          // Update with the validated address including ZIP code
          addressComponents = {
            street1: validationResult.deliveryLine1 || suggestion.streetLine,
            city: validationResult.city || suggestion.city,
            state: validationResult.state || suggestion.state,
            postalCode: validationResult.zipCode,
          }

          console.log('Updated address with ZIP code:', addressComponents)
          // Dispatch updated address with ZIP code
          dispatch('addressSelected', addressComponents)
        } else {
          console.log('Address validation failed or no ZIP code returned')
        }
      } else {
        const errorData = await response.json()
        console.error('Validation API error:', response.status, errorData)
      }
    } catch (error) {
      console.warn('Address validation failed:', error)
      // Continue with original address (ZIP code will be empty)
    }
  }

  /**
   * Close the dropdown
   */
  function closeDropdown() {
    showDropdown = false
    suggestions = []
    selectedIndex = -1
  }

  /**
   * Handle clicks outside the component
   * @param {MouseEvent} event
   */
  function handleClickOutside(event) {
    if (!event.target) return

    const target = event.target
    if (!(target instanceof Node)) return

    const isInsideInput = inputElement && inputElement.contains(target)
    const isInsideDropdown = dropdownElement && dropdownElement.contains(target)

    if (!isInsideInput && !isInsideDropdown) {
      closeDropdown()
    }
  }

  // Setup click outside listener
  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      if (abortController) {
        abortController.abort()
      }
    }
  })
</script>

<div class="relative w-full">
  <!-- Input field -->
  <div class="relative">
    <input
      bind:this={inputElement}
      bind:value
      {placeholder}
      {disabled}
      class="{inputClass} {isLoading ? 'pr-12' : ''}"
      type="text"
      autocomplete="off"
      role="combobox"
      aria-expanded={showDropdown}
      aria-controls="address-suggestions-list"
      aria-haspopup="listbox"
      aria-autocomplete="list"
      aria-describedby="address-autocomplete-instructions"
      oninput={handleInput}
      onkeydown={handleKeydown}
    />

    <!-- Loading spinner -->
    {#if isLoading}
      <div class="absolute right-3 top-1/2 -translate-y-1/2">
        <span class="loading loading-spinner loading-sm"></span>
      </div>
    {/if}
  </div>

  <!-- Instructions for screen readers -->
  <div id="address-autocomplete-instructions" class="sr-only">
    Type at least 3 characters to see address suggestions. Use arrow keys to navigate, Enter to
    select, Escape to close.
  </div>

  <!-- Suggestions dropdown -->
  {#if showDropdown && suggestions.length > 0}
    <div
      bind:this={dropdownElement}
      id="address-suggestions-list"
      class="border-base-300 bg-base-100 absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg"
      role="listbox"
      aria-label="Address suggestions"
    >
      {#each suggestions as suggestion, index}
        <button
          type="button"
          class="hover:bg-base-200 flex w-full cursor-pointer items-center px-4 py-3 text-left transition-colors {index ===
          selectedIndex
            ? 'bg-primary text-primary-content'
            : ''}"
          role="option"
          aria-selected={index === selectedIndex}
          onclick={() => selectSuggestion(suggestion)}
        >
          <div class="flex flex-col">
            <div class="font-medium">
              {suggestion.streetLine}
            </div>
            <div class="text-sm opacity-70">
              {suggestion.city}, {suggestion.state}
              {suggestion.zipCode}
            </div>
          </div>
          {#if suggestion.entries > 1}
            <div class="ml-auto text-xs opacity-60">
              {suggestion.entries} addresses
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <!-- No results message -->
  {#if showDropdown && !isLoading && suggestions.length === 0}
    <div
      class="border-base-300 bg-base-100 text-base-content/70 absolute z-50 mt-1 w-full rounded-lg border p-4 text-center shadow-lg"
    >
      No address suggestions found. Please check your spelling or enter the address manually.
    </div>
  {/if}
</div>

<style>
  /* Ensure proper z-index layering */
  .relative {
    isolation: isolate;
  }
</style>
