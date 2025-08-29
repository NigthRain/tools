/**
 * Markdown解析器和导航网站核心功能
 * 解析markdown文件并动态生成导航和内容
 */

(function($) {
    'use strict';

    // 配置
    const CONFIG = {
        markdownFile: 'content.md', // 默认markdown文件名
        defaultSection: 'home' // 默认显示的section
    };

    // 全局变量
    let sections = [];
    let currentSection = CONFIG.defaultSection;

    /**
     * 简单的Markdown解析器
     * 支持基本的markdown语法
     */
    class MarkdownParser {
        constructor() {
            this.sections = [];
        }

        /**
         * 解析markdown文本
         * @param {string} markdown - markdown文本
         * @returns {Array} 解析后的sections数组
         */
        parse(markdown) {
            const lines = markdown.split('\n');
            let currentSection = null;
            let currentContent = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // 检测H2标题（作为导航项）
                if (line.startsWith('## ')) {
                    // 保存上一个section
                    if (currentSection) {
                        currentSection.content = this.parseContent(currentContent.join('\n'));
                        this.sections.push(currentSection);
                    }

                    // 创建新section
                    const title = line.substring(3).trim();
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
         * 解析section内容
         * @param {string} content - 原始内容
         * @returns {string} 解析后的HTML
         */
        parseContent(content) {
            let html = content;

            // 解析链接格式：[标题](链接) - 描述
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)\s*-\s*(.+)/g, (match, title, url, desc) => {
                return `<div class="link-item" data-title="${title}" data-url="${url}" data-desc="${desc}"></div>`;
            });

            // 解析普通链接
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

            // 解析H3标题
            html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

            // 解析H4标题
            html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');

            // 解析粗体
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // 解析斜体
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

            // 解析代码块
            html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

            // 解析行内代码
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

            // 解析引用
            html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

            // 解析无序列表
            html = html.replace(/^[-*+] (.+)$/gm, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

            // 解析有序列表
            html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

            // 解析段落
            html = html.replace(/^(?!<[hul]|<blockquote|<pre|<div)(.+)$/gm, '<p>$1</p>');

            // 清理空行
            html = html.replace(/^\s*$/gm, '');
            html = html.replace(/\n+/g, '\n');

            return html.trim();
        }

        /**
         * 生成section ID
         * @param {string} title - 标题
         * @returns {string} ID
         */
        generateId(title) {
            return title.toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .substring(0, 20);
        }
    }

    /**
     * 内容渲染器
     */
    class ContentRenderer {
        constructor() {
            this.$main = $('#main');
            this.$nav = $('#navigation-menu');
        }

        /**
         * 渲染导航菜单
         * @param {Array} sections - sections数组
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
         * 渲染内容sections
         * @param {Array} sections - sections数组
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
         * 渲染section内容
         * @param {string} content - HTML内容
         * @returns {jQuery} 渲染后的内容元素
         */
        renderSectionContent(content) {
            const $wrapper = $('<div>').addClass('text-content');
            
            // 检查是否包含链接项
            const linkItems = content.match(/<div class="link-item"[^>]*><\/div>/g);
            
            if (linkItems && linkItems.length > 0) {
                // 渲染为链接网格
                const $grid = $('<div>').addClass('link-grid');
                
                linkItems.forEach(item => {
                    const titleMatch = item.match(/data-title="([^"]*)"/);  
                    const urlMatch = item.match(/data-url="([^"]*)"/);  
                    const descMatch = item.match(/data-desc="([^"]*)"/);  
                    
                    if (titleMatch && urlMatch && descMatch) {
                        const $card = $('<div>').addClass('link-card');
                        const $cardTitle = $('<h4>').text(titleMatch[1]);
                        const $cardDesc = $('<p>').text(descMatch[1]);
                        const $cardLink = $('<a>')
                            .attr('href', urlMatch[1])
                            .attr('target', '_blank')
                            .text('访问链接 →');
                        
                        $card.append($cardTitle, $cardDesc, $cardLink);
                        $grid.append($card);
                    }
                });
                
                // 移除原始链接项标记，添加其他内容
                const cleanContent = content.replace(/<div class="link-item"[^>]*><\/div>/g, '');
                if (cleanContent.trim()) {
                    $wrapper.html(cleanContent);
                }
                $wrapper.append($grid);
            } else {
                // 渲染为普通文本内容
                $wrapper.html(content);
            }
            
            return $wrapper;
        }
    }

    /**
     * 应用程序主类
     */
    class NavigationApp {
        constructor() {
            this.parser = new MarkdownParser();
            this.renderer = new ContentRenderer();
            this.sections = [];
        }

        /**
         * 初始化应用
         */
        async init() {
            try {
                // 加载markdown文件
                const markdown = await this.loadMarkdownFile(CONFIG.markdownFile);
                
                // 解析内容
                this.sections = this.parser.parse(markdown);
                
                if (this.sections.length === 0) {
                    throw new Error('没有找到有效的内容sections');
                }
                
                // 渲染内容
                this.renderer.renderNavigation(this.sections);
                this.renderer.renderSections(this.sections);
                
                // 初始化导航功能
                this.initNavigation();
                
                console.log('导航网站初始化完成');
            } catch (error) {
                console.error('初始化失败:', error);
                this.showError(error.message);
            }
        }

        /**
         * 加载markdown文件
         * @param {string} filename - 文件名
         * @returns {Promise<string>} markdown内容
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
         * 初始化导航功能
         */
        initNavigation() {
            // 重新初始化scrolly功能
            $('.scrolly').scrolly({
                speed: 1000,
                offset: function() {
                    if (breakpoints.active('<=medium'))
                        return $('#titleBar').height();
                    return 0;
                }
            });

            // 添加section切换功能
            const $navLinks = $('#nav a');
            const $sections = $('.content-section');

            $navLinks.on('click', function(e) {
                const $this = $(this);
                const targetId = $this.attr('href').substring(1);
                
                // 更新导航状态
                $navLinks.removeClass('active');
                $this.addClass('active');
                
                // 更新section显示状态
                $sections.removeClass('active');
                $(`#${targetId}`).addClass('active');
            });
        }

        /**
         * 显示错误信息
         * @param {string} message - 错误信息
         */
        showError(message) {
            const $loading = $('#loading .loading');
            $loading.html(`
                <h2>加载失败</h2>
                <p>${message}</p>
                <p>请检查是否存在 <code>content.md</code> 文件</p>
            `);
        }
    }

    // 页面加载完成后初始化应用
    $(document).ready(function() {
        const app = new NavigationApp();
        
        // 延迟初始化，确保所有资源加载完成
        setTimeout(() => {
            app.init();
        }, 500);
    });

})(jQuery);