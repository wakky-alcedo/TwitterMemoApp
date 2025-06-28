<script setup lang="ts">
import useMemoStore from '../composables/useMemoStore'; // deleteMemo を使用するためにインポート

// props の定義: 親コンポーネントから memos 配列を受け取る
const props = defineProps<{
  memos: Array<{ id: string; text: string; timestamp: string; createdAt: string }>;
}>();

// 親コンポーネントへのイベント発行を定義
const emit = defineEmits(['edit-memo']);

// useMemoStore から deleteMemo 関数を取得
const { deleteMemo } = useMemoStore();

/**
 * 日付文字列 (yyyy/MM/dd) を yy/MM/dd 形式にフォーマットするヘルパー関数
 * @param dateString yyyy/MM/dd 形式の日付文字列
 * @returns yy/MM/dd 形式の短い日付文字列
 */
const formatShortDate = (dateString: string): string => {
  // Dateオブジェクトは YYYY-MM-DD 形式の文字列を推奨するため、ハイフンに変換
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

/**
 * 削除ボタンがクリックされた際の処理
 * ユーザーに確認を求め、メモを削除する
 * @param id 削除するメモの Twitter ID
 * @param event クリックイベント
 */
const handleDeleteClick = (id: string, event: MouseEvent) => {
  event.stopPropagation(); // 親要素（メモボタン）のクリックイベントを発火させない

  if (confirm(`ID: ${id} のメモを削除しますか？`)) { // 削除確認のダイアログ
    deleteMemo(id); // useMemoStore の deleteMemo 関数を呼び出す
    alert('メモを削除しました。'); // 削除完了通知
  }
};
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
          <!-- 削除ボタンをコンテンツの右端に配置 -->
          <button @click="handleDeleteClick(memoItem.id, $event)" class="delete-button" title="このメモを削除">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
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
  display: flex; /* ★修正: flex を使用してコンテンツと削除ボタンを横並びにする */
  justify-content: space-between; /* コンテンツと削除ボタンを両端に配置 */
  align-items: center; /* 垂直方向中央揃え */
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.memo-item-button:hover {
  background-color: var(--memo-item-hover-bg);
  border-color: var(--memo-item-hover-border);
  box-shadow: 0 4px 8px var(--memo-item-hover-shadow);
}

.memo-item-content {
  flex-grow: 1; /* コンテンツが利用可能なスペースを占める */
  min-width: 0; /* flexアイテムの最小幅設定 */
}

/* IDとタイムスタンプを含む行をフレックスボックスで配置 */
.memo-header {
  display: flex;
  justify-content: space-between; /* IDグループを左、タイムスタンプグループを右に配置 */
  align-items: flex-start; /* 上揃え (タイムスタンプが2行になる可能性を考慮) */
  margin-bottom: 5px;
}

.memo-id-group {
  flex-shrink: 1; /* 縮小を許可 */
  min-width: 0; /* flexアイテムの最小幅設定 */
  white-space: nowrap; /* IDが折り返さないように */
  overflow: hidden; /* はみ出した場合に隠す */
  text-overflow: ellipsis; /* はみ出した場合に「...」で表示 */
  color: var(--memo-item-id-color);
  font-size: 1.1em;
}


.memo-timestamps {
  display: flex;
  flex-direction: column; /* 日付を縦に並べる */
  align-items: flex-end; /* 右揃え */
  flex-shrink: 1; /* 縮小を許可 */
  margin-left: 10px; /* IDグループとの間隔 */
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
  font-size: 0.75em; /* IDより小さく */
  color: var(--label-color); /* 目立ちすぎない色 */
  white-space: nowrap; /* 折り返さない */
}

.memo-created-at {
  margin-top: 2px; /* 最終更新日との間隔 */
}

/* ★追加: 削除ボタンのスタイル */
.delete-button {
  background-color: transparent; /* 背景なし */
  border: none;
  color: #dc3545; /* 赤色 */
  cursor: pointer;
  padding: 5px; /* クリックしやすいようにパディング */
  margin-left: 15px; /* コンテンツとの間隔 */
  flex-shrink: 0; /* 縮小しない */
  transition: color 0.3s ease, transform 0.1s ease;
}

.delete-button:hover {
  color: #c82333; /* ホバー時の色を濃く */
  transform: scale(1.1); /* ホバー時に少し拡大 */
}

.delete-button svg {
  vertical-align: middle; /* アイコンの垂直位置調整 */
}

h2 {
  color: var(--header-color);
}
</style>
