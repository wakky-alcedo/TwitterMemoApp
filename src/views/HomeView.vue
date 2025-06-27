<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import useMemoStore from '../composables/useMemoStore';

// Twitter ID を保持するリアクティブ変数
const twitterId = ref('');
// 現在表示・編集中のメモの内容
const currentMemo = ref('');
// useMemoStore から必要な関数を取得
const { saveMemo, getMemo, getAllMemos, importMemos, memos } = useMemoStore();

/**
 * 現在の Twitter ID に対応するメモを localStorage からロードし、currentMemo に設定する
 */
const loadMemo = () => {
  // twitterId.value は常に現在の Twitter ID を保持している
  currentMemo.value = getMemo(twitterId.value);
};

/**
 * 現在の Twitter ID と currentMemo の内容を localStorage に保存する
 */
const saveCurrentMemo = () => {
  saveMemo(twitterId.value, currentMemo.value);
  // ユーザーへのフィードバック
  alert('メモを保存しました！');
};

/**
 * 全てのメモデータを JSON 形式でエクスポートし、ファイルとしてダウンロードさせる
 */
const exportData = () => {
  const allMemos = getAllMemos(); // 全てのメモデータを取得
  if (allMemos.length === 0) {
    alert('保存されているメモがありません。');
    return;
  }
  // JSON データを見やすいように整形して文字列化
  const dataStr = JSON.stringify(allMemos, null, 2);
  // Blob オブジェクトを作成し、application/json タイプを指定
  const blob = new Blob([dataStr], { type: 'application/json' });
  // Blob から一時的な URL を生成
  const url = URL.createObjectURL(blob);
  // ダウンロードリンクを作成
  const a = document.createElement('a');
  a.href = url;
  a.download = 'twitter_memos_backup.json'; // ダウンロード時のファイル名を指定
  // リンクを DOM に一時的に追加し、クリックをシミュレートしてダウンロードを開始
  document.body.appendChild(a);
  a.click();
  // 使用済みの一時 URL を解放し、DOM からリンクを削除
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('メモをエクスポートしました！');
};

/**
 * ファイルからメモデータを読み込み、localStorage にインポートする
 * @param event ファイル選択イベント
 */
const importData = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]; // 選択されたファイルを取得
  if (!file) {
    alert('ファイルが選択されていません。');
    return;
  }

  const reader = new FileReader();
  // ファイル読み込み完了時の処理
  reader.onload = (e) => {
    try {
      // 読み込んだ内容を JSON としてパース
      const parsedData = JSON.parse(e.target?.result as string);
      // useMemoStore の importMemos 関数を呼び出し、インポートを実行
      if (importMemos(parsedData)) {
        alert('メモをインポートしました！現在のIDのメモを再表示します。');
        // インポート後、現在の入力中の ID に対応するメモを再ロードして UI を更新
        loadMemo();
      } else {
        alert('インポートするデータの形式が正しくありません。');
      }
    } catch (error) {
      // JSON パースエラーやその他のエラーを捕捉
      alert('ファイルの読み込み中にエラーが発生しました。JSON形式のファイルであることを確認してください。');
      console.error('File import error:', error);
    }
    // 同じファイルを再度選択できるように、ファイル入力要素の値をリセット
    (event.target as HTMLInputElement).value = '';
  };
  // ファイルをテキストとして読み込み開始
  reader.readAsText(file);
};

/**
 * メモ一覧の項目をクリックした際に、そのIDとメモ内容を入力欄にロードして編集可能にする
 * @param id メモのTwitter ID
 * @param text メモの内容
 */
const editMemo = (id: string, text: string) => {
  twitterId.value = id;
  currentMemo.value = text;
  alert(`ID: ${id} のメモを編集モードにしました。`);
};

/**
 * Twitter ID に基づいて Twitter プロフィールURLを生成する計算プロパティ
 */
const twitterProfileUrl = computed(() => {
  return twitterId.value ? `https://x.com/${twitterId.value}` : '#';
});

/**
 * メモ一覧でIDリンクがクリックされた際に、イベントのバブリングを停止して編集モードに切り替わらないようにする
 * @param event クリックイベント
 */
const handleIdLinkClick = (event: MouseEvent) => {
  event.stopPropagation(); // 親要素（メモボタン）のクリックイベントを発火させない
};

// コンポーネントがマウントされたときの処理
onMounted(async () => {
  // ブラウザの URLSearchParams を使って共有されたクエリパラメータをチェック
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
        // もしURL形式でなく、単なるID文字列が直接渡された場合など
        // ここでは単純にそのままIDとして扱うが、厳密なバリデーションも可能
        extractedId = sharedText;
    }

    if (extractedId) {
      console.log('Shared Twitter ID found:', extractedId);
      twitterId.value = extractedId; // 抽出した ID を twitterId にセット
      loadMemo(); // その ID のメモをロード
      // URL から共有パラメータを削除し、クリーンな URL にする (任意だが推奨)
      // window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      console.log('Could not extract Twitter ID from shared text:', sharedText);
    }
  } else {
    console.log('No shared text found.');
  }
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
      <button @click="saveCurrentMemo" class="save-button">保存</button>
    </div>
    <div v-else>
      Twitter ID を入力するとメモが表示されます。
    </div>

  <hr> <!-- 区切り線を追加 -->

    <h2>データ管理</h2>
    <div class="data-management-buttons">
    <button @click="exportData">メモをエクスポート</button>
    <!-- ファイル入力要素を隠し、ラベルをクリック可能にしてスタイルを適用 -->
      <label class="import-button">
        メモをインポート
        <input type="file" @change="importData" accept=".json" style="display: none;">
      </label>
    </div>

  <hr> <!-- 区切り線を追加 -->

    <h2>保存済みメモ一覧</h2>
    <div class="memo-list-container">
      <p v-if="memos.length === 0">まだメモは保存されていません。</p>
      <ul v-else class="memo-list">
        <!-- 各メモアイテムをボタンとして表示 -->
        <li v-for="memoItem in memos" :key="memoItem.id" class="memo-item-wrapper">
          <button @click="editMemo(memoItem.id, memoItem.text)" class="memo-item-button">
            <div class="memo-item-content">
              <!-- IDの文字列をリンクにする -->
              <strong>ID: <a :href="`https://x.com/${memoItem.id}`" target="_blank" rel="noopener noreferrer" @click="handleIdLinkClick" class="memo-id-link">{{ memoItem.id }}</a></strong>
              <p>{{ memoItem.text }}</p>
            </div>
            <!-- 必要に応じて編集アイコンなどを追加することも可能 -->
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* 全体のコンテナとダークテーマの基本設定 */
.app-container {
  background-color: #1a202c; /* ダークチャコール */
  color: #e2e8f0; /* 明るいグレーブルー */
  min-height: 100vh; /* 画面全体を覆う */
  padding: 20px;
  font-family: 'Inter', sans-serif; /* Google FontsのInterを使用 */
}

h1, h2 {
  color: #a0aec0; /* 見出しの色を明るめに */
}

label {
  display: block;
  margin-bottom: 0.5em;
  color: #a0aec0;
}

input[type="text"], /* type="url" から type="text" に変更 */
textarea {
  width: 100%;
  padding: 0.75em; /* パディングを少し増やす */
  margin-bottom: 1em;
  border: 1px solid #4a5568; /* 暗いボーダー */
  border-radius: 8px; /* 角を丸く */
  box-sizing: border-box;
  background-color: #2d3748; /* 暗い背景 */
  color: #e2e8f0;
  transition: border-color 0.3s ease;
}

input[type="text"]:focus,
textarea:focus {
  outline: none;
  border-color: #63b3ed; /* フォーカス時のボーダー色 */
}

/* ボタンのスタイル */
button {
  padding: 0.75em 1.5em;
  background-color: #007bff; /* 青系 */
  color: white;
  border: none;
  border-radius: 8px; /* 角を丸く */
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: bold;
}

button:active {
  transform: translateY(1px); /* クリック時の押し込みエフェクト */
}

.save-button {
  background-color: #4299e1; /* 青 */
  color: white;
}
.save-button:hover {
  background-color: #3182ce;
}

.export-button {
  background-color: #ecc94b; /* 黄色/ゴールド */
  color: #1a202c; /* ダーク系の文字色 */
}
.export-button:hover {
  background-color: #d69e2e;
}

.import-button {
  display: inline-block;
  padding: 0.75em 1.5em;
  background-color: #68d391; /* 明るい緑 */
  color: #1a202c;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  line-height: 1;
  text-align: center;
  vertical-align: middle;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: bold;
}
.import-button:hover {
  background-color: #48bb78;
}
.import-button:active {
  transform: translateY(1px);
}

hr {
  margin: 2em 0;
  border: none;
  border-top: 1px solid #4a5568; /* 暗い区切り線 */
}

.data-management-buttons {
  margin-top: 1em;
  display: flex;
  gap: 10px;
}

/* Twitterプロフィールリンクのスタイル */
.twitter-profile-link-container {
  margin-top: -0.5em;
  margin-bottom: 1.5em; /* 下の要素との間隔を少し広げる */
}

.twitter-profile-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #63b3ed; /* 明るい青のリンク色 */
  text-decoration: none;
  font-size: 0.95em; /* 少し大きく */
  font-weight: 500;
  padding: 5px 0;
  transition: color 0.3s ease;
}

.twitter-profile-link:hover {
  text-decoration: underline;
  color: #4299e1; /* ホバー時の色 */
}

.external-link-icon {
  width: 14px;
  height: 14px;
  color: #63b3ed; /* アイコンの色 */
  transition: color 0.3s ease;
}

/* メモ一覧のスタイル */
.memo-list-container {
  margin-top: 1em;
  border: 1px solid #4a5568; /* 暗いボーダー */
  border-radius: 8px;
  padding: 15px;
  background-color: #2d3748; /* 暗い背景 */
}

.memo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.memo-item-wrapper {
  margin-bottom: 10px; /* 各メモボタン間のスペース */
}
.memo-item-wrapper:last-child {
  margin-bottom: 0;
}

.memo-item-button {
  width: 100%; /* 親要素の幅いっぱいに広げる */
  background-color: #4a5568; /* メモアイテムの暗い背景 */
  border: 1px solid #667eea; /* 少し紫がかった青のボーダー */
  color: #e2e8f0; /* 明るい文字色 */
  text-align: left; /* テキストを左揃え */
  padding: 15px; /* パディングを増やす */
  border-radius: 8px; /* 角を丸く */
  box-shadow: 0 4px 8px rgba(0,0,0,0.2); /* 影を濃く */
  display: block; /* ブロック要素として配置 */
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.memo-item-button:hover {
  background-color: #5a67d8; /* ホバー時の色（少し明るい青紫） */
  border-color: #7b8de6;
  box-shadow: 0 6px 12px rgba(0,0,0,0.3);
}

.memo-item-content strong {
  color: #63b3ed; /* IDの色 */
  display: block;
  margin-bottom: 5px;
  font-size: 1.1em;
}

.memo-item-content p {
  margin: 0;
  color: #cbd5e0; /* メモ内容の色 */
  font-size: 0.95em;
}

/* メモアイテム内のIDリンクのスタイル */
.memo-id-link {
  color: #63b3ed; /* IDのリンク色 */
  text-decoration: none; /* 下線なし */
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.memo-id-link:hover {
  text-decoration: underline; /* ホバー時に下線 */
  color: #4299e1; /* ホバー時の色 */
}
</style>
