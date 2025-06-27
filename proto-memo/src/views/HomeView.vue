<script setup lang="ts">
import { ref, onMounted } from 'vue';
import useMemoStore from '../composables/useMemoStore';

const twitterId = ref('');
const currentMemo = ref('');
const { saveMemo, getMemo } = useMemoStore();

const loadMemo = () => {
  currentMemo.value = getMemo(twitterId.value);
};

const saveCurrentMemo = () => {
  saveMemo(twitterId.value, currentMemo.value);
  alert('メモを保存しました！');
};

onMounted(async () => {
  // ブラウザのURLSearchParamsを使って共有されたパラメータをチェック
  const urlParams = new URLSearchParams(window.location.search);

  console.log('--- App Mounted ---');
  console.log('Full URL:', window.location.href);
  console.log('Query Parameters:', Array.from(urlParams.entries()));

  let sharedUrl = urlParams.get('text'); // TwitterはURLを'text'パラメータで渡す
  if (sharedUrl) {
    sharedUrl = sharedUrl.split('?')[0]; // クエリパラメータを削除
    // sharedUrl が "https://x.com/wakky_robocon" のような形式の場合、ドメイン部分を削除してIDを抽出
    const match = sharedUrl.match(/(?:twitter|x)\.com\/(?:#!\/)?([a-zA-Z0-9_]+)/);
    if (match && match[1]) {
        sharedUrl = match[1]; // 抽出されたID
    }

    console.log('Shared ID found:', sharedUrl); // ログ出力を ID に変更
    twitterId.value = sharedUrl; // twitterId に ID をセット
    loadMemo();
    // window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    console.log('No shared ID found.');
  }
});
</script>

<template>
  <h1>Twitterプロフィール メモ</h1>
  <div>
    <label for="twitter-id">Twitter ID:</label>
    <input type="url" id="twitter-id" v-model="twitterId" @input="loadMemo" placeholder="例: elonmusk">
  </div>
  <div v-if="twitterId">
    <label for="memo">メモ:</label>
    <textarea id="memo" v-model="currentMemo" placeholder="このプロフィールについてのメモ"></textarea>
    <button @click="saveCurrentMemo">保存</button>
  </div>
  <div v-else>
    Twitter ID を入力するとメモが表示されます。
  </div>
</template>

<style scoped>
/* スタイルは変更なし */
</style>