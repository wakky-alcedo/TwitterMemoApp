<script setup lang="ts">
import { ref, onMounted } from 'vue'; // onMounted をインポート
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
  const sharedUrl = urlParams.get('url'); // manifest.jsonで 'url' と指定したパラメータ名

  if (sharedUrl) {
    twitterUrl.value = sharedUrl;
    loadMemo(); // 共有されたURLでメモをロード
    // URLから共有パラメータを削除し、クリーンなURLにする（任意だが推奨）
    // window.history.replaceState({}, document.title, window.location.pathname);
  }
});

</script>

<template>
  <h1>Twitterプロフィール メモ</h1>
  <div>
    <label for="twitter-url">TwitterプロフィールURL:</label>
    <input type="url" id="twitter-url" v-model="twitterUrl" @input="loadMemo" placeholder="例: https://twitter.com/elonmusk">
  </div>
  <div v-if="twitterUrl">
    <label for="memo">メモ:</label>
    <textarea id="memo" v-model="currentMemo" placeholder="このプロフィールについてのメモ"></textarea>
    <button @click="saveCurrentMemo">保存</button>
  </div>
  <div v-else>
    URLを入力するとメモが表示されます。
  </div>
</template>

<style scoped>
label {
  display: block;
  margin-bottom: 0.5em;
}

input[type="url"],
textarea {
  width: 100%;
  padding: 0.5em;
  margin-bottom: 1em;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  padding: 0.75em 1.5em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>