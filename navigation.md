# 基于Markdown的导航网站

这是一个基于HTML5 UP的"Read Only"模板开发的单页导航网站，通过解析Markdown文件动态生成导航和内容。

## 功能特点

- 📝 **Markdown驱动**: 通过编辑`content.md`文件即可更新网站内容
- 🎨 **响应式设计**: 完美适配电脑、平板和手机
- 🚀 **单页应用**: 流畅的页面切换体验
- 🔗 **智能解析**: 自动识别链接并生成卡片式展示
- 💫 **优雅动画**: 保留原模板的精美动画效果

## 文件结构

```
├── navigation.html          # 主页面文件
├── markdown-parser.js       # Markdown解析器
├── content.md              # 内容文件（你需要编辑的文件）
├── 18/                     # 原模板资源文件夹
│   ├── assets/
│   │   ├── css/main.css    # 样式文件
│   │   └── js/             # JavaScript文件
│   └── images/             # 图片资源
└── README-navigation.md    # 使用说明
```

## 使用方法

### 1. 启动本地服务器

由于浏览器的安全策略，需要通过HTTP服务器访问网站。你可以使用以下任一方法：

**Python 3:**
```bash
cd d:\db\Markdown\tools
python -m http.server 8000
```

**Python 2:**
```bash
cd d:\db\Markdown\tools
python -m SimpleHTTPServer 8000
```

**Node.js (需要先安装http-server):**
```bash
npm install -g http-server
cd d:\db\Markdown\tools
http-server -p 8000
```

### 2. 访问网站

在浏览器中打开: `http://localhost:8000/navigation.html`

### 3. 编辑内容

编辑`content.md`文件来更新网站内容。文件格式说明：

#### 基本格式

```markdown
## 导航标题

这里是该section的介绍文字。

### 子标题

普通文本内容...

[链接文本](链接地址) - 链接描述

**粗体文字**
*斜体文字*
`代码`

> 引用文字

- 列表项1
- 列表项2
```

#### 特殊功能

1. **H2标题作为导航**: 每个`## 标题`会自动成为右侧导航的一个项目
2. **链接卡片**: 格式为`[标题](链接) - 描述`的链接会自动渲染为卡片样式
3. **代码高亮**: 支持行内代码和代码块
4. **响应式布局**: 自动适配不同屏幕尺寸

## 自定义样式

如果需要修改样式，可以编辑`navigation.html`文件中的`<style>`部分，主要的CSS类包括：

- `.link-grid`: 链接网格容器
- `.link-card`: 链接卡片样式
- `.text-content`: 文本内容容器
- `.content-section`: 内容区域

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事项

1. 必须通过HTTP服务器访问，直接打开HTML文件会因为CORS策略无法加载Markdown文件
2. 修改`content.md`后刷新页面即可看到更新
3. 图片资源请放在`18/images/`目录下
4. 如需修改头像，替换`18/images/avatar.jpg`文件

## 故障排除

**问题**: 页面显示"加载失败"
**解决**: 确保`content.md`文件存在且格式正确，检查浏览器控制台的错误信息

**问题**: 样式显示异常
**解决**: 确保`18/assets/`目录完整，检查CSS文件路径

**问题**: 导航不工作
**解决**: 确保JavaScript文件正常加载，检查浏览器控制台的错误信息

## 技术栈

- HTML5 + CSS3
- JavaScript (ES6+)
- jQuery
- 原生Markdown解析
- 响应式设计

---

基于 [HTML5 UP](https://html5up.net) 的 "Read Only" 模板开发