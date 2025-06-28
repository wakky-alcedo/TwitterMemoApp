<script setup lang="ts">
import { computed } from 'vue';

// Props の定義: 親コンポーネントから memos 配列と並び替え基準を受け取る
const props = defineProps<{
  memos: Array<{ id: string; text: string; timestamp: string; createdAt: string }>;
  sortKey: 'id' | 'timestamp' | 'createdAt'; // ★修正: sortKey の型を具体的に指定
  sortOrder: 'asc' | 'desc'; // ★修正: sortOrder の型を具体的に指定
}>();

// 親コンポーネントへのイベント発行を定義 (sortKey と sortOrder の更新、edit-memo)
const emit = defineEmits(['update:sortKey', 'update:sortOrder', 'edit-memo']);

/**
 * 日付文字列 (yyyy/MM/dd) を yy/MM/dd 形式にフォーマットするヘルパー関数
 * @param dateString YYYY/MM/dd 形式の日付文字列
 * @returns yy/MM/dd 形式の短い日付文字列
 */
const formatShortDate = (dateString: string): string => {
  // DateオブジェクトはYYYY-MM-DD 形式の文字列を推奨するため、ハイフンに変換してパース
  const dateParts = dateString.split('/');
  if (dateParts.length === 3) {
    const formatted = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
    const date = new Date(formatted);
    // 有効な日付か確認
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' });
    }
  }
  return dateString; // フォーマットできない場合は元の文字列を返す
};

/**
 * 日付文字列 (yyyy/MM/dd) を比較可能な形式 (YYYYMMDD 数値) に変換するヘルパー関数
 * ソート用に利用
 * @param dateString YYYY/MM/dd 形式の日付文字列
 * @returns 比較可能な数値 (YYYYMMDD)
 */
const dateToComparable = (dateString: string): number => {
  const parts = dateString.split('/');
  // YYYYMMDD の数値形式に変換 (例: "2025/06/28" -> 20250628)
  return parseInt(`${parts[0]}${parts[1]}${parts[2]}`, 10);
};

/**
 * ソートされたメモのリストを返す計算プロパティ
 */
const sortedMemos = computed(() => {
  // 元の配列を破壊しないようにコピーを作成
  const memosCopy = [...props.memos];

  memosCopy.sort((a, b) => {
    let valA: string | number; // 型を明確に
    let valB: string | number; // 型を明確に

    if (props.sortKey === 'timestamp' || props.sortKey === 'createdAt') {
      // 日付の場合は比較可能な数値に変換
      valA = dateToComparable(a[props.sortKey]);
      valB = dateToComparable(b[props.sortKey]);
    } else {
      // ID の場合は文字列として比較 (小文字に変換して大文字小文字を区別しない)
      // ★修正: a[props.sortKey] は Memo の有効なプロパティであることを TypeScript に伝える
      valA = (a[props.sortKey] as string).toLowerCase();
      valB = (b[props.sortKey] as string).toLowerCase();
    }

    // 比較ロジック
    if (valA < valB) return props.sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return props.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return memosCopy;
});

/**
 * 並び替えキーが変更されたときのハンドラ
 * @param event 変更イベント
 */
const handleSortKeyChange = (event: Event) => {
  const newSortKey = (event.target as HTMLSelectElement).value;
  // ★修正: イベントでemitするsortKeyの型を限定
  emit('update:sortKey', newSortKey as 'id' | 'timestamp' | 'createdAt');
};

/**
 * 並び替え順序が変更されたときのハンドラ
 * @param event 変更イベント
 */
const handleSortOrderChange = (event: Event) => {
  const newSortOrder = (event.target as HTMLSelectElement).value;
  // ★修正: イベントでemitするsortOrderの型を限定
  emit('update:sortOrder', newSortOrder as 'asc' | 'desc');
};

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
</script>

<template>
  <div class="list-header-container">
    <h2>メモ一覧</h2>
    <div class="sort-controls">
      <label for="sort-key">並び替え基準:</label>
      <select :value="props.sortKey" @change="handleSortKeyChange" id="sort-key">
        <option value="timestamp">更新日</option>
        <option value="createdAt">作成日</option>
        <option value="id">ID</option>
      </select>

      <label for="sort-order">順序:</label>
      <select :value="props.sortOrder" @change="handleSortOrderChange" id="sort-order">
        <option value="desc">降順</option>
        <option value="asc">昇順</option>
      </select>
    </div>
  </div>

  <div class="memo-list-container">
    <p v-if="sortedMemos.length === 0">まだメモは保存されていません。</p>
    <ul v-else class="memo-list">
      <!-- 各メモアイテムをボタンとして表示 -->
      <!-- sortedMemos を v-for に使用 -->
      <li v-for="memoItem in sortedMemos" :key="memoItem.id" class="memo-item-wrapper">
        <button @click="editMemo(memoItem.id, memoItem.text)" class="memo-item-button">
          <div class="memo-item-content">
            <div class="memo-header">
              <!-- IDの文字列をリンクにする -->
              <strong class="memo-id-group">
                <a :href="`https://x.com/${memoItem.id}`"
                   target="_blank"
                   rel="noopener noreferrer"
                   @click="handleIdLinkClick"
                   class="memo-id-link">
                  ID: {{ memoItem.id }}
                </a>
              </strong>
              <!-- タイムスタンプグループ -->
              <div class="memo-timestamps">
                <!-- ラベルを短縮し、日付を yy/MM/dd 形式で表示 -->
                <span class="memo-timestamp">更新: {{ formatShortDate(memoItem.timestamp) }}</span>
                <span class="memo-created-at">作成: {{ formatShortDate(memoItem.createdAt) }}</span>
              </div>
            </div>
            <p>{{ memoItem.text }}</p>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
h2 {
  color: var(--header-color);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1em;
  background-color: var(--memo-list-bg); /* 背景色をリストコンテナに合わせる */
  border: 1px solid var(--memo-list-border);
  border-radius: 8px;
  padding: 5px 10px; /* パディングを少し減らす */
}

.sort-controls label {
  margin-bottom: 0;
  font-size: 0.8em; /* フォントサイズを少し小さく */
  color: var(--label-color);
}

.sort-controls select {
  padding: 0.3em 0.5em; /* パディングを調整 */
  border: 1px solid var(--input-border);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
  font-size: 0.8em; /* フォントサイズを少し小さく */
  cursor: pointer;
}

/* メモ一覧のスタイル */
.memo-list-container {
  margin-top: 0; /* list-header-container にマージンを移動したので0に */
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.memo-item-button:hover {
  background-color: var(--memo-item-hover-bg);
  border-color: var(--memo-item-hover-border);
  box-shadow: 0 4px 8px var(--memo-item-hover-shadow);
}

.memo-item-content {
  flex-grow: 1;
  min-width: 0;
}

/* IDとタイムスタンプを含む行をフレックスボックスで配置 */
.memo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5px;
}

.memo-id-group {
  flex-shrink: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--memo-item-id-color);
  font-size: 1.1em;
}


.memo-timestamps {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 1;
  margin-left: 10px;
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

/* タイムスタンプのスタイル */
.memo-timestamp, .memo-created-at {
  font-size: 0.75em;
  color: var(--label-color);
  white-space: nowrap;
}

.memo-created-at {
  margin-top: 2px;
}
</style>
