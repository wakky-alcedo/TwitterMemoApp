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
// useMemoStore から必要な関数を取得
// memos ref も取得することで、useMemoStore 内部の状態を直接リアクティブに利用できる
const { saveMemo, getMemo, memos } = useMemoStore(); // getAllMemos, importMemos は DataManagement に移動

/**
 * 現在の Twitter ID に対応するメモを localStorage からロードし、currentMemo に設定する
 * twitterId.value は常に現在の Twitter ID を保持していることを前提とする
 */
const loadMemo = () => {
  currentMemo.value = getMemo(twitterId.value);
};

/**
 * 現在の Twitter ID と currentMemo の内容を localStorage に保存する
 * 保存後、ユーザーにアラートで保存完了を通知する
 */
const saveCurrentMemo = () => {
  saveMemo(twitterId.value, currentMemo.value);
  // ユーザーへのフィードバック
  alert('メモを保存しました！');
};

/**
 * DataManagement コンポーネントからの import-success イベントハンドラ
 * メモデータが変更された可能性があるため、現在の ID のメモを再ロードする
 */
const handleImportSuccess = () => {
  alert('メモがインポートされました！UIを更新します。');
  loadMemo(); // 現在のIDのメモを再ロードしてUIを更新
};

/**
 * MemoList コンポーネントからの edit-memo イベントハンドラ
 * 選択されたメモの ID と内容を現在の入力フィールドに反映させる
 * @param id 編集対象のTwitter ID
 * @param text 編集対象のメモ内容
 */
const handleEditMemo = (id: string, text: string) => {
  twitterId.value = id;
  currentMemo.value = text;
  alert(`ID: ${id} のメモを編集モードにしました。`);
};

/**
 * Twitter ID に基づいて Twitter プロフィールURLを生成する計算プロパティ
 * twitterId が空でない場合にのみ有効な URL を生成し、空の場合は '#' を返す
 */
const twitterProfileUrl = computed(() => {
  // twitterId が空でない場合にのみURLを生成
  return twitterId.value ? `https://x.com/${twitterId.value}` : '#';
});

// コンポーネントがマウントされたときの処理 (ライフサイクルフック)
onMounted(async () => {
  // ブラウザの URLSearchParams を使って、URL のクエリパラメータを解析
  const urlParams = new URLSearchParams(window.location.search);

  // デバッグ用のコンソールログ
  console.log('--- App Mounted ---');
  console.log('Full URL:', window.location.href);
  console.log('Query Parameters:', Array.from(urlParams.entries()));

  // Twitter から共有された URL が 'text' パラメータに含まれていることを想定
  let sharedText = urlParams.get('text');
  if (sharedText) {
    // 共有された URL にクエリパラメータ（例: ?t=...）が含まれている場合、それらを削除
    sharedText = sharedText.split('?')[0];

    // URL から Twitter ID を抽出する正規表現
    // 'twitter.com/' または 'x.com/' の後に続くユーザー名部分をキャプチャする
    // '#!/' のようなハッシュバン形式にも対応
    const match = sharedText.match(/(?:twitter|x)\.com\/(?:#!\/)?([a-zA-Z0-9_]+)/);
    let extractedId: string | null = null;

    if (match && match[1]) {
        extractedId = match[1]; // 正規表現で抽出された ID を使用
    } else {
        // もし URL 形式でなく、単なる ID 文字列が直接渡された場合など、そのまま ID として扱う
        // ここでさらに厳密なバリデーションを追加することも可能
        extractedId = sharedText;
    }

    if (extractedId) {
      console.log('Shared Twitter ID found:', extractedId);
      twitterId.value = extractedId; // 抽出した ID を twitterId にセット
      loadMemo(); // その ID のメモをロードして表示
      // 共有パラメータを URL から削除し、クリーンな URL にする (ユーザー体験向上のため任意だが推奨)
      // window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      console.log('Could not extract Twitter ID from shared text:', sharedText);
    }
  } else {
    console.log('No shared text found.'); // 共有テキストが見つからなかった場合
  }
});
</script>

<template>
  <div class="app-container">
    <h1>Twitterプロフィール メモ</h1>
    <div>
      <label for="twitter-id">Twitter ID:</label>
      <!-- Twitter ID の入力フィールド -->
      <!-- input type="url" から type="text" に変更済み -->
      <input type="text" id="twitter-id" v-model="twitterId" @input="loadMemo" placeholder="例: elonmusk">
      <!-- Twitter ID が入力されていればプロフィールへのリンクを表示 -->
      <div v-if="twitterId" class="twitter-profile-link-container">
        <a :href="twitterProfileUrl" target="_blank" rel="noopener noreferrer" class="twitter-profile-link">
          @{{ twitterId }} のプロフィールを見る
          <!-- 外部リンクを示す SVG アイコン (Lucide Reactのexternal-linkアイコンを参考に埋め込み) -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="external-link-icon">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </div>

    <!-- メモ入力・保存セクション。Twitter ID が入力されている場合にのみ表示 -->
    <div v-if="twitterId">
      <label for="memo">メモ:</label>
      <textarea id="memo" v-model="currentMemo" placeholder="このプロフィールについてのメモ"></textarea>
      <button @click="saveCurrentMemo" class="save-button">保存</button>
    </div>
    <div v-else>
      Twitter ID を入力するとメモが表示されます。
    </div>

    <hr> <!-- 区切り線 -->

    <!-- データ管理コンポーネントを配置し、イベントをハンドリング -->
    <DataManagement @import-success="handleImportSuccess" />

    <hr> <!-- 区切り線 -->

    <!-- メモリストコンポーネントを配置し、memos を props として渡し、イベントをハンドリング -->
    <MemoList :memos="memos" @edit-memo="handleEditMemo" />
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

/* 保存ボタンのスタイル */
.save-button {
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: bold;
  background-color: var(--button-save-bg);
  color: white;
}
.save-button:hover {
  background-color: var(--button-save-hover);
}
.save-button:active {
  transform: translateY(1px);
}


hr {
  margin: 2em 0;
  border: none;
  border-top: 1px solid var(--hr-color);
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
</style>
