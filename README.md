# Premium TypeScript Calculator (TS Calc)

**TypeScript** と **Vite** で構築された、洗練されたデザインと豊富な機能を備えた電卓ウェブアプリケーションです。グラスモフィズム（ガラス風デザイン）を取り入れたモダンなUI、滑らかなアニメーション、ダークモード/ライトモードの切り替え、関数電卓モード、および計算履歴機能を搭載しています。

## ✨ 主な機能

- **モダンなグラスモフィズムUI**: 美しく、レスポンシブで滑らかなアニメーションを備えたデザイン。
- **2つのテーマ**: ダークモードとライトモードを簡単に切り替え可能。
- **関数電卓モード**: 展開可能なパネルで以下の高度な計算をサポート：
  - 三角関数 (sin, cos, tan) と角度単位の切り替え (Degree / Radian)。
  - 定数 ($\pi$, $e$) の入力。
  - べき乗と累乗根 ($x^y$, $x^2$, $x^3$, $\sqrt{x}$, $\sqrt[3]{x}$)。
  - 対数 ($\log$, $\ln$)。
- **計算履歴**: 過去の計算結果を一覧で確認・管理。
- **キーボード操作**: 標準的な電卓入力に対応したキーボードショートカット。

## 🚀 はじめに

### 前提条件

- Node.js (v18 以上推奨)
- npm (または yarn / pnpm)

### インストールと実行方法

1. **リポジトリのクローン**（まだ行っていない場合）:
   ```bash
   git clone https://github.com/dodoco314/TypescriptKadai.git
   cd TypescriptKadai
   ```

2. **依存関係のインストール**:
   ```bash
   npm install
   ```

3. **開発サーバーの起動**:
   ```bash
   npm run dev
   ```
   ターミナルに表示されるローカルサーバーのURL（通常は `http://localhost:5173`）をブラウザで開きます。

4. **本番用ビルドの作成**:
   ```bash
   npm run build
   ```

## 🛠️ 使用技術

- **フレームワーク/バンドラー**: [Vite](https://vitejs.dev/)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **スタイリング**: CSS (カスタムプロパティ、Flexbox/Grid、グラスモフィズム)
- **アイコン**: [Feather Icons](https://feathericons.com/)

---
TypeScript Web アプリケーション開発プロジェクト
