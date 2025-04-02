# MySQL/JSON 转 Golang 结构体 - 安装指南

## 安装前准备

在安装此扩展之前，你需要：

1. 一个支持浏览器扩展的现代浏览器（Chrome, Firefox, Edge等）
2. 下载并解压此项目的所有文件

## 生成图标

在使用之前，你需要生成图标文件：

1. 你可以使用 `images/icon.svg` 作为基础
2. 生成三个不同尺寸的PNG图标：
   - icon16.png (16x16像素)
   - icon48.png (48x48像素)
   - icon128.png (128x128像素)
3. 将这些图标放置在 `images` 目录下

你可以使用在线工具（如 https://convertio.co/svg-png/）或图形设计软件来完成这一步骤。

## Chrome浏览器安装方法

1. 打开Chrome浏览器
2. 在地址栏输入 `chrome://extensions/` 并回车
3. 在右上角打开 "开发者模式"（Developer mode）开关
4. 点击 "加载已解压的扩展程序"（Load unpacked）按钮
5. 选择本项目的根目录（包含manifest.json的目录）
6. 扩展将被安装并显示在你的工具栏中

## Firefox浏览器安装方法

1. 打开Firefox浏览器
2. 在地址栏输入 `about:debugging#/runtime/this-firefox` 并回车
3. 点击 "临时载入附加组件"（Load Temporary Add-on）按钮
4. 打开本项目目录并选择 `manifest.json` 文件
5. 扩展将被临时安装

注意：在Firefox中，临时附加组件会在浏览器关闭后被移除。

## Microsoft Edge安装方法

1. 打开Edge浏览器
2. 在地址栏输入 `edge://extensions/` 并回车
3. 打开左下角的 "开发人员模式"（Developer mode）开关
4. 点击 "加载解压缩的扩展"（Load unpacked）按钮
5. 选择本项目的根目录
6. 扩展将被安装并显示在你的工具栏中

## 验证安装

安装完成后，你应该能在浏览器工具栏看到扩展图标。点击图标将打开转换工具界面。

## 故障排除

如果扩展安装后不显示或不能正常工作：

1. 确保所有文件都已正确解压到项目目录中
2. 检查图标文件是否放置在正确的位置
3. 尝试重新加载扩展
4. 查看浏览器的开发者控制台是否有错误消息

如果问题仍然存在，请检查项目的README文件或提交问题。 