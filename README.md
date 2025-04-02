# MySQL/JSON 转 Golang 结构体

这是一个浏览器扩展，可以将MySQL表结构或JSON数据转换为Golang结构体。

## 功能

- 将JSON数据转换为Golang结构体
- 将MySQL表结构转换为Golang结构体（支持GORM标签）
- 自动检测输入类型并进行相应转换
- 自定义结构体名称
- 自定义标签类型（json, gorm, db）
- 自定义JSON字段命名样式（原始、驼峰、帕斯卡、蛇形）
- 一键复制结果

## 安装方法

### Chrome浏览器

1. 下载并解压此项目
2. 在Chrome浏览器地址栏输入 `chrome://extensions/`
3. 打开右上角的 "开发者模式"
4. 点击 "加载已解压的扩展程序"
5. 选择解压后的项目文件夹

### Firefox浏览器

1. 下载并解压此项目
2. 在Firefox地址栏输入 `about:debugging#/runtime/this-firefox`
3. 点击 "临时载入附加组件"
4. 选择项目中的 `manifest.json` 文件

## 使用方法

1. 点击浏览器工具栏中的扩展图标打开转换界面
2. 粘贴JSON数据或MySQL表结构到输入框
3. 指定结构体名称（可选）
4. 选择标签类型和JSON字段命名样式
5. 点击 "转换" 按钮
6. 使用 "复制结果" 按钮复制生成的结构体代码

## 字段命名样式选项说明

- **原始风格**：保持与数据库字段名一致，例如 `user_name` 转换为 `json:"user_name"`
- **驼峰命名**：将下划线命名转为小驼峰，例如 `user_name` 转换为 `json:"userName"`
- **帕斯卡命名**：将下划线命名转为大驼峰，例如 `user_name` 转换为 `json:"UserName"`
- **蛇形命名**：确保使用下划线命名，例如 `userName` 转换为 `json:"user_name"`

## 示例

### JSON示例

输入:
```json
{
  "id": 1,
  "name": "Tom",
  "age": 25,
  "is_active": true,
  "created_at": "2023-01-01T00:00:00Z"
}
```

输出(使用原始风格):
```go
type User struct {
	Id int64 `json:"id" gorm:"id;primaryKey"`
	Name string `json:"name" gorm:"name"`
	Age int64 `json:"age" gorm:"age"`
	IsActive bool `json:"is_active" gorm:"is_active"`
	CreatedAt string `json:"created_at" gorm:"created_at"`
}
```

### MySQL示例

输入:
```sql
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE COMMENT '电子邮件',
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

输出(使用原始风格):
```go
// TableName 设置表名
func (Users) TableName() string {
	return "users"
}

type Users struct {
	Id int64 `json:"id" gorm:"id;primaryKey"`
	Username string `json:"username" gorm:"username"` // 用户名
	Email string `json:"email" gorm:"email"` // 电子邮件
	Password string `json:"password" gorm:"password"`
	CreatedAt string `json:"created_at" gorm:"created_at"`
	UpdatedAt string `json:"updated_at" gorm:"updated_at"`
}
```

## 开发

### 项目结构

```
├── manifest.json        // 扩展配置文件
├── popup.html           // 弹出窗口HTML
├── style.css            // 样式文件
├── script.js            // JavaScript逻辑
└── images/              // 图标文件
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 贡献

欢迎提交问题和功能请求！

## 许可证

MIT 