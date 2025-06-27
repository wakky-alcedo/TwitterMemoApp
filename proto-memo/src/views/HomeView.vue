<script setup lang="ts">
import { ref, onMounted } from 'vue';
import useMemoStore from '../composables/useMemoStore';

const twitterUrl = ref('');
const currentMemo = ref('');
const { saveMemo, getMemo } = useMemoStore();

const loadMemo = () => {
  currentMemo.value = getMemo(twitterUrl.value);
};

const saveCurrentMemo = () => {
  saveMemo(twitterUrl.value, currentMemo.value);
  alert('メモを保存しました！');
};

onMounted(async () => {
  // ブラウザのURLSearchParamsを使って共有されたパラメータをチェック
  const urlParams = new URLSearchParams(window.location.search);

  // --- デバッグ用のログを追加 ---
  console.log('--- App Mounted ---');
  console.log('Full URL:', window.location.href);
  console.log('Query Parameters:', Array.from(urlParams.entries()));

  let sharedUrl = urlParams.get('text'); // TwitterはURLを'text'パラメータで渡す
  if (sharedUrl) {
    sharedUrl = sharedUrl.split('?')[0]; // クエリパラメータを削除
    sharedUrl = sharedUrl.split('.com/')[1]; // ドメイン部分を削除

    console.log('Shared URL found:', sharedUrl);
    twitterUrl.value = sharedUrl;
    loadMemo();
    // window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    console.log('No shared URL found.');
  }
});
</script>

<template>
  <h1>Twitterプロフィール メモ</h1>
  <div>
    <label for="twitter-id">Twitter ID:</label>
    <input type="url" id="twitter-id" v-model="twitterUrl" @input="loadMemo" placeholder="例: elonmusk">
  </div>
  <div v-if="twitterUrl">
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