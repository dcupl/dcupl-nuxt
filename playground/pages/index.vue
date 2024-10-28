<script setup lang="ts">
import useDcupl from "../../src/runtime/composables/useDcupl";

const articles = useState("articles", () => []);

const dcupl = useDcupl();

const { data, status } = await useFetch("/api/test", {
  method: "GET",
  lazy: true,
});

const articleList = dcupl.lists.create({ modelKey: "Article" });
articleList.catalog.query.applyOptions({ count: 10 });

// get initial data
articles.value = articleList.catalog.query.execute();

articleList.on((msg) => {
  if (msg.action === "update") {
    articles.value = articleList.catalog.query.execute();
  }
});

// cleanup on unmount
onBeforeUnmount(() => {
  articleList.destroy();
});
</script>

<template>
  <div class="container mx-auto">
    <h3>Home Page</h3>

    <div class="flex gap-5">
      <div
        class="w-300 flex flex-col flex-shrink-0 gap-3 border-r border-gray-500 px-3"
      >
        <TextFilter :attribute="'productName'" :list="articleList" />

        <SelectFilter :attribute="'category'" :list="articleList" />
      </div>
      <div class="w-full">
        <table>
          <thead>
            <tr>
              <td>Id</td>
              <td>Name</td>
              <td>Category</td>
              <td>Price</td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in articles" :key="article.key">
              <td>
                <NuxtLink :to="`/articles/${article.key}`">
                  {{ article.key }}
                </NuxtLink>
              </td>

              <td>{{ article.productName }}</td>
              <td>{{ article.category }}</td>
              <td>{{ article.price }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <hr />
    <h4>API-Request Test</h4>
    <p v-if="status === 'pending'">Lädt...</p>
    <div v-else>
      {{ data }}
    </div>
  </div>
</template>
