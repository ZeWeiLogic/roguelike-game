# 肉鸽幸存者 - PWA 游戏项目

## 项目概述

一款 PWA 动作肉鸽游戏，类似《元气骑士》，使用 Canvas 2D 渲染，纯 JavaScript 开发，无需外部图片素材（程序化生成角色、武器、道具）。

**技术栈：**
- Vite + Vite PWA Plugin（构建工具）
- 纯 JavaScript ES6+（游戏逻辑）
- Canvas 2D（渲染引擎）
- Cloudflare Pages（部署）
- GitHub（代码托管）

---

## 目录结构

```
roguelike-game/
├── src/                    # 源代码
│   ├── main.js             # 游戏入口
│   ├── Game.js             # 游戏主控制器
│   ├── Player.js           # 玩家角色
│   ├── Enemy.js            # 敌人
│   ├── Bullet.js           # 子弹
│   ├── Item.js             # 道具/掉落
│   ├── ProceduralGenerator.js  # 程序化图像生成
│   ├── StageManager.js     # 关卡/房间管理
│   ├── ShopSystem.js       # 商店系统
│   └── InputManager.js     # 输入管理
├── public/                 # 静态资源（PWA 图标）
├── dist/                   # 构建输出（自动生成）
├── index.html              # 入口 HTML
├── vite.config.js          # Vite 配置
└── package.json            # 依赖
```

---

## 本地开发

### 1. 安装依赖

```bash
cd C:/Users/admin/Documents/Project/roguelike-game
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`（或终端显示的端口）

### 3. 构建生产版本

```bash
npm run build
```

输出到 `dist/` 目录

### 4. 本地预览生产版本

```bash
npm run preview
```

---

## 代码提交与部署流程

### 方式一：手动部署（当前使用）

#### 步骤 1：本地构建

```bash
npm run build
```

#### 步骤 2：部署到 Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=roguelike-game --commit-dirty=true
```

#### 步骤 3：提交代码到 GitHub

```bash
git add .
git commit -m "描述本次修改"
git push
```

> **注意**：`--commit-dirty=true` 表示 wrangler 会忽略未提交的更改直接部署。

---

### 方式二：GitHub 自动部署（推荐）

当代码 push 到 GitHub 后，Cloudflare Pages 会**自动**检测并部署。

**设置步骤：**

1. 打开 https://pages.cloudflare.com
2. 点击 **Create a project** → **Import GitHub project**
3. 授权 Cloudflare 访问 GitHub
4. 选择 `roguelike-game` 仓库
5. 设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. 点击 **Save and Deploy**

之后每次 `git push` 后，Cloudflare 会自动构建并部署。

---

## Cloudflare Wrangler CLI 使用

### 安装 Wrangler

```bash
npm install -g wrangler
```

### 登录

```bash
npx wrangler login
```

会打开浏览器授权。

### 验证登录状态

```bash
npx wrangler whoami
```

### 查看项目列表

```bash
npx wrangler pages project list
```

### 部署命令

```bash
npx wrangler pages deploy <目录> --project-name=<项目名>
```

### 查看部署历史

```bash
npx wrangler pages deployment list --project-name=roguelike-game
```

---

## 游戏操作说明

| 操作 | PC | 手机 |
|------|-----|------|
| 移动 | WASD / 方向键 | 触摸屏幕下半部分虚拟摇杆 |
| 射击 | 自动射击 | 自动射击 |
| 进入商店 | 屏幕出现"商店"按钮时点击，或按 E | 点击"商店"按钮 |
| 关闭商店 | ESC | 点击空白处 |
| 开始游戏 | 点击/按空格/回车 | 点击屏幕 |
| 进入下一房间 | W/上 | 门开启后自动进入 |

---

## 游戏机制

### 房间系统
- 每 5 间出现商店
- 每 20 间出现 BOSS
- 击败所有敌人后门打开

### 商店升级
- 生命强化：+25 最大生命
- 攻击力强化：+5 攻击
- 移动速度：+0.5 速度
- 攻击速度：-100ms 攻击间隔
- 暴击几率：+5% 暴击率
- 恢复生命：+50 HP

### 道具掉落
- 金币（60%）- 用于商店购买
- 血包（25%）- 恢复 20 HP
- 武器箱（15%）- 额外金币

---

## 常见问题

### Q: 部署后页面没更新？
强制刷新或清除缓存。Cloudflare 可能需要几分钟更新。

### Q: PWA 无法安装到桌面？
- 尝试用 Chrome/Safari 打开
- 小米浏览器可能不支持，尝试微信或夸克浏览器
- 确保图标是 PNG 格式（不是 SVG）

### Q: 手机上无法开始游戏？
确保允许页面通知/声音权限，或者触摸屏幕任意位置开始。

---

## 相关链接

- **游戏地址**: https://roguelike-game.pages.dev/
- **GitHub 仓库**: https://github.com/ZeWeiLogic/roguelike-game
- **Cloudflare Pages**: https://pages.cloudflare.com
- **Zeabur**（备用部署）: https://zeabur.com

---

## 开发规范

1. **提交前测试**：每次 commit 前确保 `npm run build` 成功
2. **描述清晰**：commit 信息说明改了什么
3. **分支策略**：直接 push 到 master（当前单人开发）
4. **敏感信息**：不要在代码中硬编码 API token 等