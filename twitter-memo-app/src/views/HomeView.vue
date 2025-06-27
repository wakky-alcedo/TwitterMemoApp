<template>
  <div class="container">
    <h1>Twitterプロフィールメモ</h1>
    <input v-model="profileUrl" placeholder="TwitterプロフィールURLを入力" />
    <textarea v-model="memo" placeholder="メモを入力"></textarea>
    <button @click="saveMemo">保存</button>

    <div v-if="savedMemo">
      <h2>保存したメモ</h2>
      <p>{{ savedMemo }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMemoStore } from '../composables/useMemoStore';

const profileUrl = ref('');
const memo = ref('');
const { saveMemo, getMemo } = useMemoStore();
const savedMemo = ref('');

// 保存ボタンがクリックされたとき
const saveMemo = () => {
  if (profileUrl.value) {
    saveMemo(profileUrl.value, memo.value);  // メモを保存
    savedMemo.value = getMemo(profileUrl.value); // 保存したメモを表示
  }
};

// プロフィールURLが入力されている場合に保存済みメモを表示
if (profileUrl.value) {
  savedMemo.value = getMemo(profileUrl.value);
}
</script>

<style>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

input, textarea {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>
