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

## 开发流程（完整自动化）

### 标准开发流程

```bash
# 1. 本地开发测试
npm run dev

# 2. 修改代码后，本地构建测试
npm run build
npm run preview   # 预览生产版本

# 3. 确认没问题后，提交代码
git add .
git commit -m "描述本次修改"
git push

# 4. GitHub push 后，Cloudflare Pages 会自动检测并部署
# 无需手动部署，https://roguelike-game.pages.dev/ 会自动更新
```

### 手动部署（不推荐，仅用于紧急情况）

```bash
# 构建 + 手动部署到 Cloudflare Pages
npm run build && npx wrangler pages deploy dist --project-name=roguelike-game --commit-dirty=true
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

## 部署说明

### Cloudflare Pages 自动部署

项目已配置 GitHub + Cloudflare Pages 联动：

1. 代码 push 到 GitHub `master` 分支
2. Cloudflare Pages **自动**检测到 push
3. Cloudflare Pages **自动**运行 `npm run build`
4. 构建完成后**自动**部署到 `https://roguelike-game.pages.dev/`

### 部署流程图

```
本地修改代码
    ↓
npm run build (本地测试)
    ↓
npm run preview (预览确认)
    ↓
git add . → git commit → git push
    ↓
GitHub 收到 push
    ↓
Cloudflare Pages 自动构建部署
    ↓
https://roguelike-game.pages.dev/ 更新
```

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

### 部署命令（手动部署用）

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
| 移动 | WASD / 方向键 | 触摸屏幕左侧虚拟摇杆 |
| 射击 | 自动射击 | 自动射击 |
| 进入商店 | 按 E / 点击商店按钮 | 点击商店按钮 |
| 关闭商店 | ESC / 点击关闭按钮 | 点击关闭按钮 |
| 开始游戏 | 点击/按空格/回车 | 点击屏幕 |
| 进入下一房间 | W/上 | 门开启后自动进入 |

---

## 游戏机制

### 房间系统
- 横板模式，左侧虚拟摇杆
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

### Q: Cloudflare Pages 没自动部署？
检查 GitHub 仓库是否已连接 Cloudflare Pages，在 Cloudflare Dashboard 查看部署状态。

---

## 相关链接

- **游戏地址**: https://roguelike-game.pages.dev/
- **GitHub 仓库**: https://github.com/ZeWeiLogic/roguelike-game
- **Cloudflare Pages**: https://pages.cloudflare.com

---

## 开发规范

1. **提交前测试**：每次 commit 前确保 `npm run build` 成功
2. **描述清晰**：commit 信息说明改了什么
3. **分支策略**：直接 push 到 master（当前单人开发）
4. **敏感信息**：不要在代码中硬编码 API token 等
5. **完整流程**：修改 → 本地构建测试 → 预览确认 → commit → push → 自动部署