<script lang="ts">
  interface Props {
    /** Download progress as a 0–1 fraction. */
    value: number;
  }

  let { value }: Props = $props();
</script>

<div class="responsive-app__scrim">
  <div class="progress__container">
    <div id="loadinglabel">Building your map:</div>
    <div class="progress__outer">
      <div
        role="progressbar"
        aria-labelledby="loadinglabel"
        aria-valuenow={Math.round(value * 100)}
        class="progress__inner"
        style="width: {Math.max(value * 100, 1)}%"
      ></div>
    </div>
  </div>
</div>
