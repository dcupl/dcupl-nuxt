<script setup lang="ts">
/**
 * @author Dominik Strasser (dcupl)
 */
const infoVisible = ref(false);
</script>

<template>
  <nav class="bg-gray-300">
    <div class="container mx-auto py-3">
      <div class="flex justify-between items-center">
        <div class="w-full flex items-center justify-start gap-3">
          <NuxtLink to="/"> Dcupl Nuxt Starter </NuxtLink>
        </div>
        <div class="relative w-full flex items-center justify-end gap-3">
          <a target="_blank" href="https://github.com/dcupl/dcupl-nuxt-starter">
            <svg
              aria-hidden="true"
              height="24"
              viewBox="0 0 24 24"
              version="1.1"
              width="24"
              data-view-component="true"
              class="octicon octicon-mark-github"
            >
              <path
                d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"
              />
            </svg>
          </a>
          <button @click="infoVisible = !infoVisible">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#5f6368"
            >
              <path
                d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
              />
            </svg>
          </button>
          <div
            v-if="infoVisible"
            class="absolute top-10 right-0 w-96 max-w-sm px-3 bg-white border border-gray-500"
          >
            <p>
              <span class="font-semibold">How does it work?:</span> This page is
              initially rendered via SSR using the dcuplServer instance. After
              the initial load, hydration kicks in and initializes a dcuplClient
              instance that is used for client-side filtering.
            </p>
            <p>
              <span class="font-semibold">The Models/Data</span> are loaded from
              the "Product Catalog" starter Project in the
              <a target="_blank" href="https://console.dcupl.com"
                >dcupl console</a
              >. Feel free to create a free account and your own project.
            </p>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
