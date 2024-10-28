<script setup lang="ts">
/**
 * @author Dominik Strasser (dcupl)
 */
import type { DcuplList } from "@dcupl/core";

const props = defineProps<{
  list: DcuplList;
  attribute: string;
}>();

const updateFilter = (event: { target: { value: string } }) => {
  const filterValue = event.target.value;

  if (filterValue.length === 0) {
    props.list.catalog.query.remove({ groupKey: props.attribute });
  } else {
    props.list.catalog.query.apply(
      {
        attribute: props.attribute,
        operator: "find",
        value: `/${event.target.value}/`,
        options: {
          transform: ["lowercase"],
        },
      },
      {
        mode: "set",
      }
    );
  }
};
</script>

<template>
  <div>
    <label class="block text-sm font-medium leading-6 text-gray-900">
      {{ attribute }}
    </label>
    <div>
      <input
        type="text"
        class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        placeholder="ball"
        @keyup="updateFilter"
      />
    </div>
  </div>
</template>
