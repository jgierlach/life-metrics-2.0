<script lang="ts">
  import { enhance } from '$app/forms'

  const {
    label,
    id,
    placeholder,
    btnText = 'Update',
    formAction = '',
    type = 'text',
    error = '',
    defaultValue = '',
    required = true,
    onClick = null,
    onSubmit = null,
    onUpdated = null,
  } = $props()

  let isLoading = $state(false)
</script>

<div class="mt-4">
  <form
    action={formAction ? `?/${formAction}` : ''}
    method="POST"
    onsubmit={onSubmit}
    use:enhance={() => {
      isLoading = true
      return async ({ update }) => {
        isLoading = false
        update()
        onUpdated?.()
      }
    }}
  >
    <label class="label" for={id}>
      <span class="label-text">
        {label}
        {#if required}<span class="text-red-600">*</span>{/if}
      </span>
    </label>
    <div class="flex flex-col gap-2 md:flex-row md:gap-4">
      <input
        {type}
        {id}
        {placeholder}
        {required}
        value={defaultValue}
        name={id}
        class="input input-bordered w-full bg-base-200"
        readonly={onClick ? true : false}
        onclick={onClick}
      />
      <button
        class="btn btn-primary w-full md:w-auto"
        type={formAction ? 'submit' : 'button'}
        disabled={isLoading}
        onclick={onClick}
      >
        {#if isLoading}
          Updating...
        {:else}
          {btnText}
        {/if}
      </button>
    </div>
    {#if error}
      <p class="mt-1 text-sm text-error">{error}</p>
    {/if}
  </form>
</div>
