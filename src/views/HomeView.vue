<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import useMemoStore from '../composables/useMemoStore';
// 新しいコンポーネントをインポート
import DataManagement from '../components/DataManagement.vue';
import MemoList from '../components/MemoList.vue';

// Twitter ID を保持するリアクティブ変数
const twitterId = ref('');
// 現在表示・編集中のメモの内容
const currentMemo = ref('');
// 現在表示・編集中のメモのタグ
const currentTags = ref<string[]>([]);
// useMemoStore から必要な関数を取得
const { saveMemo, getMemo, memos, deleteMemo, getMemosByTag, getAllUniqueTags } = useMemoStore();

// 全てのユニークなタグを保持するリアクティブ変数
const allUniqueTags = ref<string[]>([]);

// 現在選択されているタグ (フィルタリング用)
const selectedTag = ref<string | null>(null);

/**
 * タグでフィルタリングされたメモのリストを返す計算プロパティ
 */
const filteredMemos = computed(() => {
  if (selectedTag.value) {
    return getMemosByTag(selectedTag.value);
  } else {
    return memos.value;
  }
});

/**
 * MemoList コンポーネントからの filter-by-tag イベントハンドラ
 * @param tag フィルタリングするタグ
 */
const handleFilterByTag = (tag: string) => {
  selectedTag.value = tag;
};

/**
 * フィルタリングを解除する
 */
const clearFilter = () => {
  selectedTag.value = null;
};

// ★修正: 並び替えの基準となるリアクティブ変数に型アノテーションを追加
const sortKey = ref<'id' | 'timestamp' | 'createdAt'>('timestamp'); // デフォルトは最終更新日
const sortOrder = ref<'asc' | 'desc'>('desc'); // デフォルトは降順 (新しいものが上)

/**
 * 現在の Twitter ID に対応するメモを localStorage からロードし、currentMemo に設定する
 * twitterId.value は常に現在の Twitter ID を保持していることを前提とする
 */
const loadMemo = () => {
  const memo = getMemo(twitterId.value);
  currentMemo.value = memo?.text || '';
  currentTags.value = memo?.tags || [];
  allUniqueTags.value = getAllUniqueTags();
};

/**
 * 現在の Twitter ID と currentMemo の内容を localStorage に保存する
 * 保存完了のアラートは表示しない
 */
const saveCurrentMemo = () => {
  saveMemo(twitterId.value, currentMemo.value, currentTags.value);
};

/**
 * DataManagement コンポーネントからの import-success イベントハンドラ
 * メモデータが変更された可能性があるため、現在の ID のメモを再ロードする
 */
const handleImportSuccess = () => {
  loadMemo(); // 現在のIDのメモを再ロードしてUIを更新
};


/**
 * MemoList コンポーネントからの edit-memo イベントハンドラ
 * 選択されたメモの ID と内容を現在の入力フィールドに反映させる
 * @param id 編集対象のTwitter ID
 * @param text 編集対象のメモ内容
 */
const handleEditMemo = (id: string, text: string, tags: string[]) => {
  twitterId.value = id;
  currentMemo.value = text;
  currentTags.value = tags;
};

/**
 * 編集画面からの削除ボタンがクリックされた際の処理
 * ユーザーに確認を求め、現在のメモを削除する
 */
/**
 * 編集画面からの削除ボタンがクリックされた際の処理
 * ユーザーに確認を求め、現在のメモを削除する
 */
const handleDeleteCurrentMemo = () => {
  if (!twitterId.value) {
    alert('削除するIDが指定されていません。');
    return;
  }
  if (confirm(`ID: ${twitterId.value} のメモを削除しますか？`)) {
    deleteMemo(twitterId.value); // useMemoStore の deleteMemo 関数を呼び出す
    twitterId.value = ''; // 削除後、入力欄をクリア
    currentMemo.value = ''; // 削除後、テキストエリアをクリア
  }
};

const addTagToCurrent = (tag: string) => {
  if (!currentTags.value.includes(tag)) {
    currentTags.value.push(tag);
  }
};

const handleTagsInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let value = target.value;
  // 最後のカンマを削除し、トリムして配列に変換
  let tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);

  // 重複を排除
  currentTags.value = Array.from(new Set(tags));

  // フォーカスが外れたときに、入力が空でなく、かつ最後の文字がカンマでない場合にカンマを追加
  if (value.length > 0 && !value.endsWith(',')) {
    target.value = value + ',';
  }
};

/**
 * Twitter ID に基づいて Twitter プロフィールURLを生成する計算プロパティ
 */
const twitterProfileUrl = computed(() => {
  return twitterId.value ? `https://x.com/${twitterId.value}` : '#';
});

// コンポーネントがマウントされたときの処理 (ライフサイクルフック)
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);

  console.log('--- App Mounted ---');
  console.log('Full URL:', window.location.href);
  console.log('Query Parameters:', Array.from(urlParams.entries()));

  let sharedText = urlParams.get('text');
  if (sharedText) {
    sharedText = sharedText.split('?')[0];

    const match = sharedText.match(/(?:twitter|x)\.com\/(?:#!\/)?([a-zA-Z0-9_]+)/);
    let extractedId: string | null = null;

    if (match && match[1]) {
        extractedId = match[1];
    } else {
        extractedId = sharedText;
    }

    if (extractedId) {
      console.log('Shared Twitter ID found:', extractedId);
      twitterId.value = extractedId;
      loadMemo();
    } else {
      console.log('Could not extract Twitter ID from shared text:', sharedText);
    }
  } else {
    console.log('No shared text found.');
  }
  allUniqueTags.value = getAllUniqueTags();
});
</script>

<template>
  <div class="app-container">
    <h1>Twitterプロフィール メモ</h1>
    <div>
      <label for="twitter-id">Twitter ID:</label>
      <input type="text" id="twitter-id" v-model="twitterId" @input="loadMemo" placeholder="例: elonmusk">
      <div v-if="twitterId" class="twitter-profile-link-container">
        <a :href="twitterProfileUrl" target="_blank" rel="noopener noreferrer" class="twitter-profile-link">
          @{{ twitterId }} のプロフィールを見る
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="external-link-icon">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </div>

    <div v-if="twitterId">
      <label for="memo">メモ:</label>
      <textarea id="memo" v-model="currentMemo" placeholder="このプロフィールについてのメモ"></textarea>
      <label for="tags">タグ (カンマ区切り):</label>
      <input type="text" id="tags" :value="currentTags.join(', ') + (currentTags.length > 0 ? ', ' : '')" @blur="handleTagsInput" placeholder="例: Vue.js, Web開発">
      <div class="existing-tags">
        <span v-for="tag in allUniqueTags" :key="tag" class="existing-tag-item" @click="addTagToCurrent(tag)">
          #{{ tag }}
        </span>
      </div>
      <div class="edit-buttons">
        <button @click="saveCurrentMemo" class="save-button">保存</button>
        <button @click="handleDeleteCurrentMemo" class="delete-button">削除</button>
      </div>
    </div>
    <div v-else>
      Twitter ID を入力するとメモが表示されます。
    </div>

    <hr>

    <!-- MemoList コンポーネントに memos を props として渡し、イベントをハンドリング -->
    <div v-if="selectedTag" class="filter-info">
      <span>タグ: #{{ selectedTag }} でフィルタリング中</span>
      <button @click="clearFilter" class="clear-filter-button">フィルタ解除</button>
    </div>
    <MemoList
      :memos="filteredMemos"
      :sort-key="sortKey"
      :sort-order="sortOrder"
      @update:sort-key="sortKey = $event"
      @update:sort-order="sortOrder = $event"
      @edit-memo="handleEditMemo"
      @filter-by-tag="handleFilterByTag"
    />

    <hr>

    <DataManagement @import-success="handleImportSuccess" />
  </div>
</template>

<style scoped>
/* 全体のコンテナスタイル */
.app-container {
  background-color: var(--bg-color);
  color: var(--text-color);
  min-height: 100vh;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

h1 {
  color: var(--header-color);
}

label {
  display: block;
  margin-bottom: 0.5em;
  color: var(--label-color);
}

input[type="text"],
textarea {
  width: 100%;
  padding: 0.75em;
  margin-bottom: 1em;
  border: 1px solid var(--input-border);
  border-radius: 4px;
  box-sizing: border-box;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.3s ease;
}

input[type="text"]:focus,
textarea:focus {
  outline: none;
  border-color: var(--input-focus-border);
}

/* ボタンの共通スタイル */
button {
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: bold;
}

button:active {
  transform: translateY(1px);
}

.save-button {
  background-color: var(--button-save-bg);
  color: white;
}
.save-button:hover {
  background-color: var(--button-save-hover);
}

/* 編集画面の削除ボタン */
.delete-button {
  background-color: #dc3545; /* 赤色 */
  color: white;
  margin-right: 0;
}
.delete-button:hover {
  background-color: #c82333;
}

hr {
  margin: 2em 0;
  border: none;
  border-top: 1px solid var(--hr-color);
}

/* ボタンをまとめる新しいdivのスタイル */
.edit-buttons {
  display: flex;
  justify-content: flex-end; /* 右揃え */
  margin-bottom: 1em;
}

/* Twitterプロフィールリンクのスタイル */
.twitter-profile-link-container {
  margin-top: -0.5em;
  margin-bottom: 1.5em;
}

.twitter-profile-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.95em;
  font-weight: 500;
  padding: 5px 0;
  transition: color 0.3s ease;
}

.twitter-profile-link:hover {
  text-decoration: underline;
  color: var(--link-hover);
}

.external-link-icon {
  width: 14px;
  height: 14px;
  color: var(--link-color);
  transition: color 0.3s ease;
}

.filter-info {
  margin-top: 1em;
  margin-bottom: 1em;
  padding: 10px 15px;
  background-color: var(--filter-info-bg);
  border: 1px solid var(--filter-info-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9em;
  color: var(--filter-info-text);
}

.clear-filter-button {
  background-color: var(--button-clear-filter-bg);
  color: var(--button-clear-filter-text);
  padding: 5px 10px;
  font-size: 0.8em;
  margin-right: 0; /* 右側のマージンをリセット */
}

.clear-filter-button:hover {
  background-color: var(--button-clear-filter-hover);
}

.existing-tags {
  margin-top: 0.5em;
  margin-bottom: 1em;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.existing-tag-item {
  background-color: var(--tag-bg);
  color: var(--tag-text);
  padding: 5px 10px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background-color 0.2s ease;
}

.existing-tag-item:hover {
  background-color: var(--tag-hover-bg);
}
</style>
