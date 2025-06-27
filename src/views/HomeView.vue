<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'; // computed を再度インポート
import useMemoStore from '../composables/useMemoStore';

// Twitter ID を保持するリアクティブ変数
const twitterId = ref('');
// 現在表示・編集中のメモの内容
const currentMemo = ref('');
// useMemoStore から必要な関数を取得
const { saveMemo, getMemo, getAllMemos, importMemos, memos } = useMemoStore(); // memos ref も取得

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

// 計算プロパティ: twitterId に基づいて Twitter プロフィールURLを生成
const twitterProfileUrl = computed(() => {
  // twitterId が空でない場合にのみURLを生成
  return twitterId.value ? `https://x.com/${twitterId.value}` : '#';
});

// コンポーネントがマウントされたときの処理
onMounted(async () => {
  // ブラウザの URLSearchParams を使って共有されたクエリパラメータをチェック
  const urlParams = new URLSearchParams(window.location.search);

  console.log('--- App Mounted ---');
  console.log('Full URL:', window.location.href);
  console.log('Query Parameters:', Array.from(urlParams.entries()));

  // Twitter から共有された URL が 'text' パラメータに含まれている
  let sharedText = urlParams.get('text');
  if (sharedText) {
    // クエリパラメータ（例: ?t=...）を削除
    sharedText = sharedText.split('?')[0];

    // URL から Twitter ID を抽出する正規表現
    // twitter.com/ または x.com/ の後に続くユーザー名部分をキャプチャ
    const match = sharedText.match(/(?:twitter|x)\.com\/(?:#!\/)?([a-zA-Z0-9_]+)/);
    let extractedId: string | null = null;

    if (match && match[1]) {
        extractedId = match[1]; // 正規表現で抽出された ID
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
  <h1>Twitterプロフィール メモ</h1>
  <div>
    <label for="twitter-id">Twitter ID:</label>
    <input type="text" id="twitter-id" v-model="twitterId" @input="loadMemo" placeholder="例: elonmusk">
    <!-- Twitter ID が入力されていればリンクを表示 -->
    <div v-if="twitterId" class="twitter-profile-link-container">
      <a :href="twitterProfileUrl" target="_blank" rel="noopener noreferrer" class="twitter-profile-link">
        @{{ twitterId }} のプロフィールを見る
        <!-- 外部リンクアイコン (Lucide Reactのexternal-linkアイコンのSVG) -->
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
    <button @click="saveCurrentMemo">保存</button>
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
      <li v-for="memoItem in memos" :key="memoItem.id" class="memo-item">
        <strong>ID: {{ memoItem.id }}</strong>
        <p>{{ memoItem.text }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* 基本的なスタイル */
label {
  display: block;
  margin-bottom: 0.5em;
}

input[type="text"], /* type="url" から type="text" に変更 */
textarea {
  width: 100%;
  padding: 0.5em;
  margin-bottom: 1em;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* ボタンのスタイル */
button {
  padding: 0.75em 1.5em;
  background-color: #007bff; /* 青系 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px; /* ボタン間のスペース */
  transition: background-color 0.3s ease; /* ホバーアニメーション */
}

button:hover {
  background-color: #0056b3; /* ホバー時の色 */
}

/* 区切り線のスタイル */
hr {
  margin: 2em 0; /* 上下の余白 */
  border: none;
  border-top: 1px solid #eee; /* 薄い灰色の線 */
}

/* データ管理ボタンのコンテナスタイル */
.data-management-buttons {
  margin-top: 1em;
  display: flex; /* ボタンを横並びにする */
  gap: 10px; /* ボタン間の隙間 */
}

/* インポートボタンのカスタムスタイル */
.import-button {
  display: inline-block; /* ボタンのように振る舞わせる */
  padding: 0.75em 1.5em;
  background-color: #28a745; /* 緑系 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  line-height: 1; /* テキストの垂直方向の位置を調整 */
  text-align: center;
  vertical-align: middle;
  transition: background-color 0.3s ease; /* ホバーアニメーション */
}

.import-button:hover {
  background-color: #218838; /* ホバー時の色 */
}

/* メモ一覧のスタイル */
.memo-list-container {
  margin-top: 1em;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  background-color: #f9f9f9;
}

.memo-list {
  list-style: none; /* リストの点を削除 */
  padding: 0;
  margin: 0;
}

.memo-item {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.memo-item:last-child {
  margin-bottom: 0; /* 最後の子要素の下マージンを削除 */
}

.memo-item strong {
  color: #007bff;
  display: block; /* IDとメモ内容を分けて表示 */
  margin-bottom: 5px;
}

.memo-item p {
  margin: 0; /* 段落のデフォルトマージンを削除 */
  color: #333;
}

/* Twitterプロフィールリンクのスタイル */
.twitter-profile-link-container {
  margin-top: -0.5em; /* 入力欄との間隔を調整 */
  margin-bottom: 1em; /* 下の要素との間隔 */
}

.twitter-profile-link {
  display: inline-flex; /* テキストとアイコンを横並びにする */
  align-items: center; /* 垂直方向中央揃え */
  gap: 5px; /* テキストとアイコンの間のスペース */
  color: #007bff; /* リンクの色 */
  text-decoration: none; /* 下線なし */
  font-size: 0.9em;
  font-weight: 500;
  padding: 5px 0; /* クリックしやすいようにパディング */
}

.twitter-profile-link:hover {
  text-decoration: underline; /* ホバー時に下線 */
}

.external-link-icon {
  width: 14px;
  height: 14px;
  color: #007bff; /* アイコンの色 */
}
</style>
