<script setup lang="ts">
import { computed } from 'vue';
import useMemoStore from '../composables/useMemoStore'; // `memos` を直接使わず `props` で受け取るため、不要ですが、念のため

// props の定義: 親コンポーネントから memos 配列を受け取る
const props = defineProps<{
  memos: Array<{ id: string; text: string }>;
}>();

// 親コンポーネントへのイベント発行を定義
const emit = defineEmits(['edit-memo']);

/**
 * メモ一覧の項目（ボタン）がクリックされた際に、そのIDとメモ内容を親コンポーネントに通知し、編集可能にする
 * @param id メモのTwitter ID
 * @param text メモの内容
 */
const editMemo = (id: string, text: string) => {
  emit('edit-memo', id, text); // edit-memo イベントを発行
};

/**
 * メモ一覧で ID リンクがクリックされた際に、親要素（メモボタン）のクリックイベントのバブリングを停止する
 * これにより、ID リンククリック時に編集モードに切り替わらず、直接リンク先に遷移するようになる
 * @param event クリックイベント
 */
const handleIdLinkClick = (event: MouseEvent) => {
  event.stopPropagation(); // 親要素（メモボタン）のクリックイベントを発火させない
};

// メモアイテム内のIDのプロフィールURLを生成する計算プロパティや関数
// 各メモアイテムのループ内で直接生成するため、個別の computed は不要
// ただし、もし共通のロジックや整形が必要ならここに定義
</script>

<template>
  <h2>保存済みメモ一覧</h2>
  <div class="memo-list-container">
    <p v-if="props.memos.length === 0">まだメモは保存されていません。</p>
    <ul v-else class="memo-list">
      <!-- 各メモアイテムをボタンとして表示 -->
      <li v-for="memoItem in props.memos" :key="memoItem.id" class="memo-item-wrapper">
        <button @click="editMemo(memoItem.id, memoItem.text)" class="memo-item-button">
          <div class="memo-item-content">
            <!-- IDの文字列をリンクにする -->
            <strong>ID:
              <a :href="`https://x.com/${memoItem.id}`"
                 target="_blank"
                 rel="noopener noreferrer"
                 @click="handleIdLinkClick"
                 class="memo-id-link">
                {{ memoItem.id }}
              </a>
            </strong>
            <p>{{ memoItem.text }}</p>
          </div>
          <!-- 必要に応じて編集アイコンなどを追加することも可能 -->
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* メモ一覧のスタイル */
.memo-list-container {
  margin-top: 1em;
  border: 1px solid var(--memo-list-border);
  border-radius: 8px;
  padding: 15px;
  background-color: var(--memo-list-bg);
}

.memo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.memo-item-wrapper {
  margin-bottom: 10px;
}
.memo-item-wrapper:last-child {
  margin-bottom: 0;
}

.memo-item-button {
  width: 100%;
  background-color: var(--memo-item-bg);
  border: 1px solid var(--memo-item-border);
  color: var(--text-color); /* メモアイテムの文字色 */
  text-align: left;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px var(--memo-item-shadow);
  display: block;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.memo-item-button:hover {
  background-color: var(--memo-item-hover-bg);
  border-color: var(--memo-item-hover-border);
  box-shadow: 0 4px 8px var(--memo-item-hover-shadow);
}

.memo-item-content strong {
  color: var(--memo-item-id-color);
  display: block;
  margin-bottom: 5px;
  font-size: 1.1em;
}

.memo-item-content p {
  margin: 0;
  color: var(--memo-item-text-color);
  font-size: 0.95em;
}

/* メモアイテム内のIDリンクのスタイル */
.memo-id-link {
  color: var(--link-color);
  text-decoration: none;
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.memo-id-link:hover {
  text-decoration: underline;
  color: var(--link-hover);
}

/* h2 も scoped に含める */
h2 {
  color: var(--header-color);
}
</style>
