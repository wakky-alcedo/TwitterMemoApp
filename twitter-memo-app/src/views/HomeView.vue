<template>
  <div>
    <h1>Twitterプロフィールメモ</h1>

    <input v-model="profileUrl" placeholder="TwitterのプロフィールURLを入力" />
    <textarea v-model="memo" placeholder="メモを入力"></textarea>
    <button @click="handleSaveMemo">保存</button>

    <div v-if="savedMemo">
      <h2>保存したメモ</h2>
      <p>{{ savedMemo }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { saveMemo as storeMemo } from '../composables/useMemoStore'

const profileUrl = ref('')
const memo = ref('')
const savedMemo = ref('')

const handleSaveMemo = () => {
  if (profileUrl.value) {
    storeMemo(profileUrl.value, memo.value)  // メモを保存
    savedMemo.value = memo.value            // 表示用にも保存
    memo.value = ''
  }
}
</script>

<style scoped>
input, textarea {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.5rem;
  font-size: 1rem;
}
</style>
