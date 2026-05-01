# Sun-Panel

一个可以直接部署到 GitHub Pages 的个人导航页。页面是纯静态结构，不需要构建工具。

## 修改链接

打开 `app.js`，编辑 `panelConfig.groups` 里的 `title`、`subtitle`、`url`、`icon` 和 `accent` 即可。

## 伪后台

右上角齿轮按钮可以打开后台面板。默认账号是 `root`，默认密码是 `password`。

后台可以修改大标题、添加分组、修改或删除分组、给指定分组添加链接、按分组编辑/删除链接，也可以修改后台密码。分组管理、链接管理、修改密码默认折叠，点开后再操作。面板配置和修改后的密码都保存在当前浏览器的 `localStorage` 中。

这是 GitHub Pages 可用的纯前端伪后台，适合个人使用和演示；它不是服务端后台，不能当作真正的安全认证。

## 本地预览

直接双击打开 `index.html` 就能预览。也可以用 VS Code 的 Live Server 或任意静态服务器打开。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库，比如 `sun-panel`。
2. 把当前文件夹里的 `index.html`、`styles.css`、`app.js`、`assets/`、`README.md` 推送到仓库根目录。
3. 在 GitHub 仓库进入 `Settings` -> `Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. 分支选择 `main`，目录选择 `/(root)`，保存。
6. 等 GitHub Actions 完成后，就可以访问 Pages 提供的网址。
