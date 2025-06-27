# Twitter Profile Memo App

TwitterプロフィールのURLに対してメモを保存・管理できるPWA（Progressive Web App）です。

## 🎯 プロジェクトの特徴

- **Flutter移行対応設計**: データロジックをComposable関数として分離し、将来の移行を容易に
- **完全オフライン動作**: localStorageを使用してオフラインでも利用可能
- **PWA対応**: スマートフォンのホーム画面に追加して、ネイティブアプリのように使用可能
- **レスポンシブデザイン**: PC・タブレット・スマートフォンに対応

## 🏗️ アーキテクチャ

```
src/
├─ composables/
│   └─ useMemoStore.ts      # データ保存/取得ロジック（Flutter移行対応）
├─ views/
│   └─ HomeView.vue         # UI部分（使い捨て可能）
├─ App.vue                  # アプリケーションルート
└─ main.ts                  # エントリポイント
```

### 設計原則

1. **データロジックとUIの完全分離**
   - `useMemoStore.ts`にすべてのビジネスロジックを集約
   - UIコンポーネントは状態表示と操作のみを担当

2. **Flutter移行の容易さ**
   - Composable関数の構造をFlutterのProvider/Repositoryパターンに変換可能
   - localStorage操作を1つのクラスに集約（FlutterではHive/SQLiteに置換）

3. **将来の拡張性**
   - クラウド同期、検索機能、タグ分類などの追加要件に対応可能な設計
   - エクスポート/インポート機能で他のストレージシステムとの互換性確保

## 🚀 セットアップ

### 前提条件
- Node.js 18.0.0以上
- npm 9.0.0以上

### インストール
```bash
npm install
```

### 開発サーバー起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

## 📱 機能

### 基本機能
- TwitterプロフィールURLの入力（twitter.com/username、x.com/username対応）
- メモの保存・編集・削除
- 保存済みメモの一覧表示
- データのエクスポート

### PWA機能
- オフライン動作
- ホーム画面への追加
- アプリライクなUI/UX

## 🔄 Flutter移行ガイド

### 1. データレイヤーの移行
```typescript
// Vue (useMemoStore.ts)
class LocalStorageAdapter {
  static save(data: MemoStore): boolean { ... }
  static load(): MemoStore { ... }
}
```
↓
```dart
// Flutter
class LocalStorageAdapter {
  static Future<bool> save(Map<String, MemoData> data) async { ... }
  static Future<Map<String, MemoData>> load() async { ... }
}
```

### 2. 状態管理の移行
- Vue Composable → Flutter Provider/Riverpod
- Reactive references → StateNotifier/ChangeNotifier

### 3. UI層の再実装
- Vue SFC → Flutter Widget
- CSS → Flutter ThemeData/Styling

## 🛠️ 将来の拡張予定

### データ機能
- [ ] クラウド同期（Firebase/Supabase）
- [ ] バックアップ・復元機能
- [ ] タグ・分類機能
- [ ] 検索・フィルタリング

### UI/UX機能
- [ ] ダークモード
- [ ] 履歴・最近見たユーザー
- [ ] ピン留め・お気に入り
- [ ] Markdown対応

### 外部連携
- [ ] Twitter API連携
- [ ] 他SNSプラットフォーム対応
- [ ] 共有機能（LINE、Slack）

## 🔧 技術スタック

- **フロントエンド**: Vue 3 + TypeScript
- **ビルドツール**: Vite
- **PWA**: vite-plugin-pwa
- **スタイリング**: CSS3 (Scoped)
- **ストレージ**: localStorage
- **状態管理**: Vue Composition API

## 📄 ライセンス

MIT License