/* ========================================
 * 导航网站核心JavaScript文件
 * ========================================
 * 
 * 功能概述：
 * - Markdown文件解析和渲染
 * - 动态导航菜单生成
 * - 单页应用(SPA)路由管理
 * - 响应式内容展示
 * 
 * 主要组件：
 * - MarkdownParser: Markdown语法解析器
 * - ContentRenderer: 内容渲染引擎
 * - NavigationApp: 应用程序主控制器
 * 
 * 技术特性：
 * - 支持多种Markdown语法（标题、链接、表格、代码等）
 * - 自动生成卡片式链接布局
 * - 平滑滚动和导航切换
 * - 错误处理和用户反馈
 * ======================================== */

(function($) {
    'use strict';

    /* ========================================
     * 应用程序配置
     * ======================================== */
    const CONFIG = {
        markdownFile: 'contents.md',    // 默认Markdown数据文件
        defaultSection: 'home'          // 默认显示的内容section
    };

    /* ========================================
     * 全局变量
     * ======================================== */
    let sections = [];                  // 存储解析后的内容sections
    let currentSection = CONFIG.defaultSection; // 当前激活的section

    /* ========================================
     * Markdown解析器类
     * ========================================
     * 
     * 功能说明：
     * - 解析Markdown文本为结构化数据
     * - 支持H2标题作为导航section分割
     * - 处理链接、表格、代码块等语法
     * - 生成HTML格式的内容
     * 
     * 支持的Markdown语法：
     * - 标题 (H2-H4)
     * - 链接 [text](url)
     * - 特殊链接格式 [title](url) - description
     * - 表格 | col1 | col2 |
     * - 代码块 ```code```
     * - 行内代码 `code`
     * - 粗体 **text**
     * - 斜体 *text*
     * - 引用 > text
     * - 列表 - item 或 1. item
     * ======================================== */
    class MarkdownParser {
        constructor() {
            this.sections = [];             // 存储解析后的sections
        }

        /**
         * 主解析方法 - 将Markdown文本解析为sections
         * 
         * 解析流程：
         * 1. 按行分割Markdown文本
         * 2. 识别H2标题作为section分隔符
         * 3. 收集每个section的内容
         * 4. 调用parseContent处理section内容
         * 
         * @param {string} markdown - 原始Markdown文本
         * @returns {Array} 解析后的sections数组，每个section包含id、title、content
         */
        parse(markdown) {
            const lines = markdown.split('\n');
            let currentSection = null;
            let currentContent = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // 检测H2标题（作为section分隔符和导航项）
                if (line.startsWith('## ')) {
                    // 保存上一个section（如果存在）
                    if (currentSection) {
                        currentSection.content = this.parseContent(currentContent.join('\n'));
                        this.sections.push(currentSection);
                    }

                    // 创建新的section对象
                    const title = line.substring(3).trim();    // 移除'## '前缀
                    const id = this.generateId(title);
                    currentSection = {
                        id: id,
                        title: title,
                        content: ''
                    };
                    currentContent = [];
                } else if (currentSection) {
                    // 添加内容到当前section
                    currentContent.push(lines[i]);
                }
            }

            // 保存最后一个section
            if (currentSection) {
                currentSection.content = this.parseContent(currentContent.join('\n'));
                this.sections.push(currentSection);
            }

            return this.sections;
        }

        /**
         * 内容解析方法 - 将Markdown语法转换为HTML
         * 
         * 解析顺序（重要）：
         * 1. 特殊链接格式 [title](url) - description
         * 2. 普通链接 [text](url)
         * 3. 标题 H3、H4
         * 4. 表格
         * 5. 文本格式（粗体、斜体）
         * 6. 代码块和行内代码
         * 7. 引用和列表
         * 8. 段落处理
         * 
         * @param {string} content - 原始Markdown内容
         * @returns {string} 转换后的HTML字符串
         */
        parseContent(content) {
            let html = content;

            // 解析特殊链接格式：[标题](链接) - 描述
            // 这种格式会被转换为link-item数据，后续渲染为卡片
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)\s*-\s*(.+)/g, (match, title, url, desc) => {
                return `<div class="link-item" data-title="${title}" data-url="${url}" data-desc="${desc}"></div>`;
            });

            // 解析普通Markdown链接
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

            // 解析H3标题（章节标题）
            html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

            // 解析H4标题（子章节标题）
            html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');

            // 解析表格（调用专门的表格解析方法）
            html = this.parseTable(html);

            // 解析文本格式 - 粗体
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // 解析文本格式 - 斜体
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

            // 解析多行代码块
            html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

            // 解析行内代码
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

            // 解析引用块
            html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

            // 解析无序列表（支持 -, *, + 标记）
            html = html.replace(/^[-*+] (.+)$/gm, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

            // 解析有序列表（数字 + 点号）
            html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

            // 解析段落（不是标题、列表、引用、代码块、div的行）
            html = html.replace(/^(?!<[hul]|<blockquote|<pre|<div)(.+)$/gm, '<p>$1</p>');

            // 清理多余的空行和换行符
            html = html.replace(/^\s*$/gm, '');
            html = html.replace(/\n+/g, '\n');

            return html.trim();
        }

        /**
         * 生成section的唯一ID
         * 
         * 处理步骤：
         * 1. 转换为小写
         * 2. 保留字母、数字、中文字符，其他字符替换为连字符
         * 3. 合并多个连续的连字符
         * 4. 移除首尾的连字符
         * 5. 限制长度为20个字符
         * 
         * @param {string} title - section标题
         * @returns {string} 生成的唯一ID
         */
        generateId(title) {
            return title.toLowerCase()                          // 转小写
                .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')      // 非字母数字中文替换为-
                .replace(/-+/g, '-')                          // 合并多个连字符
                .replace(/^-|-$/g, '')                        // 移除首尾连字符
                .substring(0, 20);                           // 限制长度
        }

        /**
         * 表格解析方法 - 处理Markdown表格语法
         * 
         * 表格格式：
         * | 列1 | 列2 | 列3 |
         * |-----|-----|-----|
         * | 数据1 | 数据2 | 数据3 |
         * 
         * 解析流程：
         * 1. 识别表格行（以|开始和结束）
         * 2. 第一行作为表头
         * 3. 跳过分隔行（第二行）
         * 4. 其余行作为数据行
         * 
         * @param {string} html - 包含表格的HTML内容
         * @returns {string} 转换后的HTML（表格转为<table>标签）
         */
        parseTable(html) {
            // 匹配连续的表格行（每行以|开始和结束）
            const tableRegex = /(\|[^\n]+\|\n)+/g;
            
            return html.replace(tableRegex, (match) => {
                const rows = match.trim().split('\n');
                if (rows.length < 2) return match;
                
                let tableHtml = '<table>';
                
                // 处理表头（第一行）
                const headerCells = rows[0].split('|').filter(cell => cell.trim());
                if (headerCells.length > 0) {
                    tableHtml += '<thead><tr>';
                    headerCells.forEach(cell => {
                        tableHtml += `<th>${cell.trim()}</th>`;
                    });
                    tableHtml += '</tr></thead>';
                }
                
                // 跳过分隔行（第二行），处理数据行（从第三行开始）
                if (rows.length > 2) {
                    tableHtml += '<tbody>';
                    for (let i = 2; i < rows.length; i++) {
                        const cells = rows[i].split('|').filter(cell => cell.trim());
                        if (cells.length > 0) {
                            tableHtml += '<tr>';
                            cells.forEach(cell => {
                                tableHtml += `<td>${cell.trim()}</td>`;
                            });
                            tableHtml += '</tr>';
                        }
                    }
                    tableHtml += '</tbody>';
                }
                
                tableHtml += '</table>';
                return tableHtml;
            });
        }

        /**
         * 转义HTML字符
         * @param {string} text - 需要转义的文本
         * @returns {string} 转义后的文本
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * 解析行内Markdown
         * @param {string} text - 文本内容
         * @returns {string} 解析后的HTML
         */
        parseInlineMarkdown(text) {
            let html = text;
            
            // 解析链接
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
            
            // 解析粗体
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            
            // 解析斜体
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
            
            // 解析行内代码
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            return html;
        }
    }

    /* ========================================
     * 内容渲染器类
     * ========================================
     * 
     * 功能说明：
     * - 将解析后的数据渲染为DOM元素
     * - 生成动态导航菜单
     * - 创建内容sections
     * - 处理特殊的链接卡片布局
     * 
     * 渲染特性：
     * - 自动识别链接项并生成卡片布局
     * - 支持普通文本内容渲染
     * - 响应式网格系统
     * - 平滑的section切换
     * ======================================== */
    class ContentRenderer {
        constructor() {
            this.$main = $('#main');                    // 主内容容器
            this.$nav = $('#navigation-menu');          // 导航菜单容器
        }

        /**
         * 渲染导航菜单 - 根据sections生成导航链接
         * 
         * 生成过程：
         * 1. 清空现有导航菜单
         * 2. 为每个section创建导航链接
         * 3. 第一个section默认设为激活状态
         * 4. 设置正确的href属性用于页面内跳转
         * 
         * @param {Array} sections - 解析后的sections数组
         */
        renderNavigation(sections) {
            this.$nav.empty();

            sections.forEach((section, index) => {
                const $li = $('<li>');
                const $a = $('<a>')
                    .attr('href', `#${section.id}`)
                    .text(section.title)
                    .addClass(index === 0 ? 'active' : '');
                
                $li.append($a);
                this.$nav.append($li);
            });
        }

        /**
         * 渲染内容sections - 创建页面的主要内容区域
         * 
         * 渲染流程：
         * 1. 移除加载提示
         * 2. 为每个section创建DOM结构
         * 3. 设置第一个section为激活状态
         * 4. 调用renderSectionContent处理具体内容
         * 
         * @param {Array} sections - 解析后的sections数组
         */
        renderSections(sections) {
            // 移除加载section
            $('#loading').remove();

            sections.forEach((section, index) => {
                const $section = $('<section>')
                    .attr('id', section.id)
                    .addClass('content-section')
                    .addClass(index === 0 ? 'active' : '');

                const $container = $('<div>').addClass('container');
                const $header = $('<header>').addClass('major');
                const $title = $('<h2>').text(section.title);
                
                $header.append($title);
                $container.append($header);

                // 解析并渲染内容
                const $content = this.renderSectionContent(section.content);
                $container.append($content);

                $section.append($container);
                this.$main.append($section);
            });
        }

        /**
         * 渲染单个section的内容 - 智能识别内容类型并选择渲染方式
         * 
         * 渲染逻辑：
         * 1. 检查是否包含link-item（特殊链接格式）
         * 2. 如果有link-item，渲染为卡片网格布局
         * 3. 如果没有，渲染为普通文本内容
         * 4. 支持混合内容（文本 + 链接卡片）
         * 
         * @param {string} content - 解析后的HTML内容
         * @returns {jQuery} 渲染完成的内容DOM元素
         */
        renderSectionContent(content) {
            const $wrapper = $('<div>').addClass('text-content');
            
            // 检查内容中是否包含特殊的链接项标记
            const linkItems = content.match(/<div class="link-item"[^>]*><\/div>/g);
            
            if (linkItems && linkItems.length > 0) {
                // 渲染为响应式链接卡片网格
                const $grid = $('<div>').addClass('link-grid');
                
                // 遍历每个链接项，创建对应的卡片
                linkItems.forEach(item => {
                    const titleMatch = item.match(/data-title="([^"]*)"/);   // 提取标题
                    const urlMatch = item.match(/data-url="([^"]*)"/);       // 提取URL
                    const descMatch = item.match(/data-desc="([^"]*)"/);     // 提取描述
                    
                    if (titleMatch && urlMatch && descMatch) {
                        // 创建链接卡片DOM结构
                        const $card = $('<div>').addClass('link-card');
                        const $cardTitle = $('<h4>').text(titleMatch[1]);
                        const $cardDesc = $('<p>').text(descMatch[1]);
                        const $cardLink = $('<a>')
                            .attr('href', urlMatch[1])
                            .attr('target', '_blank')          // 新窗口打开
                            .text('访问链接 →');
                        
                        $card.append($cardTitle, $cardDesc, $cardLink);
                        $grid.append($card);
                    }
                });
                
                // 移除原始的link-item标记，保留其他文本内容
                const cleanContent = content.replace(/<div class="link-item"[^>]*><\/div>/g, '');
                if (cleanContent.trim()) {
                    $wrapper.html(cleanContent);        // 添加文本内容
                }
                $wrapper.append($grid);                 // 添加链接卡片网格
            } else {
                // 没有特殊链接项，渲染为普通文本内容
                $wrapper.html(content);
            }
            
            return $wrapper;
        }
    }

    /* ========================================
     * 导航应用程序主控制器
     * ========================================
     * 
     * 功能说明：
     * - 应用程序的入口和主控制器
     * - 协调Markdown解析和内容渲染
     * - 管理应用程序生命周期
     * - 处理错误和用户反馈
     * 
     * 核心流程：
     * 1. 加载Markdown文件
     * 2. 解析内容为结构化数据
     * 3. 渲染导航和内容
     * 4. 初始化交互功能
     * 5. 错误处理和用户提示
     * ======================================== */
    class NavigationApp {
        constructor() {
            this.parser = new MarkdownParser();        // Markdown解析器实例
            this.renderer = new ContentRenderer();     // 内容渲染器实例
            this.sections = [];                        // 存储解析后的sections
        }

        /**
         * 应用程序初始化方法 - 应用启动的入口点
         * 
         * 初始化流程：
         * 1. 异步加载Markdown文件
         * 2. 解析Markdown内容为sections
         * 3. 验证解析结果
         * 4. 渲染导航菜单和内容
         * 5. 初始化交互功能
         * 6. 错误处理和用户提示
         * 
         * @async
         * @throws {Error} 当文件加载失败或解析失败时抛出错误
         */
        async init() {
            try {
                // 步骤1: 异步加载Markdown数据文件
                const markdown = await this.loadMarkdownFile(CONFIG.markdownFile);
                
                // 步骤2: 解析Markdown内容为结构化数据
                this.sections = this.parser.parse(markdown);
                
                // 步骤3: 验证解析结果
                if (this.sections.length === 0) {
                    throw new Error('没有找到有效的内容sections');
                }
                
                // 步骤4: 渲染用户界面
                this.renderer.renderNavigation(this.sections);  // 渲染导航菜单
                this.renderer.renderSections(this.sections);    // 渲染内容区域
                
                // 步骤5: 初始化交互功能
                this.initNavigation();
                
                console.log('导航网站初始化完成');
            } catch (error) {
                console.error('初始化失败:', error);
                this.showError(error.message);
            }
        }

        /**
         * 异步加载Markdown文件 - 从服务器获取数据文件
         * 
         * 加载过程：
         * 1. 使用fetch API发起HTTP请求
         * 2. 检查响应状态
         * 3. 读取文本内容
         * 4. 错误处理和异常抛出
         * 
         * @param {string} filename - Markdown文件名（相对路径）
         * @returns {Promise<string>} 返回文件的文本内容
         * @throws {Error} 当文件不存在或网络错误时抛出异常
         */
        async loadMarkdownFile(filename) {
            try {
                const response = await fetch(filename);
                if (!response.ok) {
                    throw new Error(`无法加载文件: ${filename}`);
                }
                return await response.text();
            } catch (error) {
                throw new Error(`加载markdown文件失败: ${error.message}`);
            }
        }

        /**
         * 初始化导航交互功能 - 设置页面导航和滚动行为
         * 
         * 功能设置：
         * 1. 重新初始化scrolly插件（平滑滚动）
         * 2. 设置导航链接点击事件
         * 3. 实现section切换功能
         * 4. 更新导航状态和内容显示
         * 
         * 交互特性：
         * - 平滑滚动到目标section
         * - 响应式导航行为
         * - 导航状态同步
         */
        initNavigation() {
            // 重新初始化scrolly插件 - 提供平滑滚动体验
            $('.scrolly').scrolly({
                speed: 1000,                            // 滚动动画速度
                offset: function() {                    // 滚动偏移量计算
                    if (breakpoints.active('<=medium'))  // 中等屏幕及以下
                        return $('#titleBar').height();  // 考虑标题栏高度
                    return 0;                          // 大屏幕无偏移
                }
            });

            // 设置导航链接的section切换功能
            const $navLinks = $('#nav a');              // 所有导航链接
            const $sections = $('.content-section');    // 所有内容sections

            $navLinks.on('click', function(e) {
                const $this = $(this);
                const targetId = $this.attr('href').substring(1); // 获取目标section ID
                
                // 更新导航链接的激活状态
                $navLinks.removeClass('active');
                $this.addClass('active');
                
                // 更新内容section的显示状态
                $sections.removeClass('active');
                $(`#${targetId}`).addClass('active');
            });
        }

        /**
         * 显示错误信息 - 向用户展示友好的错误提示
         * 
         * 错误处理：
         * 1. 替换加载提示内容
         * 2. 显示具体错误信息
         * 3. 提供解决建议
         * 4. 保持良好的用户体验
         * 
         * @param {string} message - 具体的错误信息
         */
        showError(message) {
            const $loading = $('#loading .loading');
            $loading.html(`
                <h2>加载失败</h2>
                <p>${message}</p>
                <p>请检查是否存在 <code>contents.md</code> 文件</p>
            `);
        }
    }

    /* ========================================
     * 应用程序启动入口
     * ======================================== */
    
    // 页面DOM加载完成后初始化应用程序
    $(document).ready(function() {
        const app = new NavigationApp();           // 创建应用实例
        
        // 延迟初始化，确保所有CSS、JS资源完全加载
        setTimeout(() => {
            app.init();                           // 启动应用程序
        }, 500);                                 // 500ms延迟确保资源就绪
    });

})(jQuery);