<script>
  export let reqName = "";
  export let reqJson = "";
  export let edit;
  $: innerHeight = 0;
  $: height = innerHeight - 170;
  import { emailValidator, requiredValidator } from "./validators.js";
  import { createFieldValidator } from "./validation.js";

  const [validity, validate] = createFieldValidator(
    requiredValidator(),
    emailValidator()
  );

</script>

<svelte:window bind:innerHeight />

<div>
  <center>
    <vscode-option>Request: {reqName}</vscode-option>
  </center>

  <textarea
    class="input"
    name=""
    id=""
    cols="30"
    rows="10"
    style="--height: {height}px"
    bind:value={reqJson}
    on:input={edit}
    class:field-danger={!$validity.valid}
    class:field-success={$validity.valid}
    use:validate={reqJson}
  />
  {#if $validity.dirty && !$validity.valid}
    <span class="validation-hint">
      INVALID - {$validity.message}
      {$validity.dirty}
    </span>
  {/if}

  <button disabled={!$validity.valid}>Ok, I'm ready!</button>
</div>

<style>
  center {
    padding-bottom: 10px;
  }
  div {
    padding-top: 2%;
    padding-left: 7%;
    padding-right: 3%;
  }
  textarea {
    resize: none;
    height: var(--height);
    padding: 8px;
  }

  .validation-hint {
    color: red;
    padding: 6px 0;
  }

  .field-danger {
    border-color: red;
  }

  .field-success {
    border-color: green;
  }
</style>
