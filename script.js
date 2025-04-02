document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const inputText = document.getElementById('input-text');
  const outputText = document.getElementById('output-text');
  const structName = document.getElementById('struct-name');
  const tagType = document.getElementById('tag-type');
  const convertBtn = document.getElementById('convert-btn');
  const copyBtn = document.getElementById('copy-btn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  // 当前选中的转换模式
  let currentMode = 'auto';
  
  // 新增：JSON字段命名样式选择
  const jsonStyle = document.getElementById('json-style');
  
  // 标签切换
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentMode = this.dataset.tab;
    });
  });
  
  // 转换按钮点击事件
  convertBtn.addEventListener('click', function() {
    const input = inputText.value.trim();
    if (!input) {
      outputText.textContent = '请输入有效的JSON或MySQL表结构';
      return;
    }
    
    const name = structName.value.trim() || 'MyStruct';
    const tags = tagType.value;
    const fieldStyle = jsonStyle ? jsonStyle.value : 'original'; // 获取字段命名样式
    
    try {
      let result;
      
      // 根据当前模式选择转换方法
      if (currentMode === 'auto') {
        // 自动检测
        if (isJSON(input)) {
          result = convertJSONToStruct(input, name, tags, fieldStyle);
        } else {
          result = convertMySQLToStruct(input, name, tags, fieldStyle);
        }
      } else if (currentMode === 'json') {
        // 强制按JSON处理
        result = convertJSONToStruct(input, name, tags, fieldStyle);
      } else {
        // 强制按MySQL处理
        result = convertMySQLToStruct(input, name, tags, fieldStyle);
      }
      
      outputText.textContent = result;
    } catch (error) {
      outputText.textContent = '转换出错: ' + error.message;
    }
  });
  
  // 复制按钮点击事件
  copyBtn.addEventListener('click', function() {
    const output = outputText.textContent;
    if (!output) {
      return;
    }
    
    navigator.clipboard.writeText(output)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 1500);
      })
      .catch(err => {
        console.error('复制失败: ', err);
      });
  });
  
  // 检查字符串是否是JSON
  function isJSON(str) {
    try {
      if (str.trim().startsWith('{') || str.trim().startsWith('[')) {
        JSON.parse(str);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  
  // 将JSON转换为Golang结构体
  function convertJSONToStruct(jsonStr, structName, tagType, fieldStyle) {
    const jsonObj = JSON.parse(jsonStr);
    
    // 对象数组的情况，取第一个元素
    const obj = Array.isArray(jsonObj) && jsonObj.length > 0 ? jsonObj[0] : jsonObj;
    
    let result = `type ${pascalCase(structName)} struct {\n`;
    
    // 添加字段
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = pascalCase(key);
      const fieldType = getGoType(value);
      
      // 根据选择的命名样式决定JSON标签中使用的字段名
      let jsonFieldName = key;
      if (fieldStyle === 'camel') {
        jsonFieldName = camelCase(key);
      } else if (fieldStyle === 'snake') {
        jsonFieldName = snakeCase(key);
      }
      
      // 生成标签
      let tag = '';
      if (tagType.includes('json')) {
        tag += `json:"${jsonFieldName}"`;
      }
      if (tagType.includes('gorm')) {
        if (tag) tag += ' ';
        tag += `gorm:"${key}"`;
      } else if (tagType.includes('db')) {
        if (tag) tag += ' ';
        tag += `db:"${key}"`;
      }
      
      if (tag) {
        tag = `\`${tag}\``;
      }
      
      result += `\t${fieldName} ${fieldType} ${tag}\n`;
    }
    
    result += '}';
    
    return result;
  }
  
  // 将MySQL表结构转换为Golang结构体
  function convertMySQLToStruct(sqlStr, structName, tagType, fieldStyle) {
    // 提取表名（如果有）
    const tableNameMatch = sqlStr.match(/CREATE\s+TABLE\s+[`'"]?(\w+)[`'"]?/i);
    const tableName = tableNameMatch ? tableNameMatch[1] : null;
    
    // 定义正则表达式来匹配字段，更准确地捕获COMMENT内容
    const fieldPattern = /[`'"]?(\w+)[`'"]?\s+([^\s,]+)(?:\(([^)]+)\))?(?:\s+UNSIGNED)?(?:\s+(?:NOT\s+NULL|NULL))?(?:\s+DEFAULT\s+(?:[^,]+))?(?:\s+COMMENT\s+['"]([^'"]+)['"])?/gi;
    
    let result = `type ${pascalCase(structName)} struct {\n`;
    
    // 添加表名的gorm标签
    if (tableName && tagType.includes('gorm')) {
      result = `// TableName 设置表名\nfunc (${pascalCase(structName)}) TableName() string {\n\treturn "${tableName}"\n}\n\n${result}`;
    }
    
    const fields = [];
    
    // 只处理第一个左括号"("之后，PRIMARY KEY之前的内容
    let startIndex = sqlStr.indexOf('(');
    if (startIndex === -1) {
      startIndex = 0; // 如果没有括号，则从头开始
    } else {
      startIndex++; // 移动到括号后一个字符
    }
    
    // 查找PRIMARY KEY的位置
    let endIndex = sqlStr.indexOf('PRIMARY KEY', startIndex);
    if (endIndex === -1) {
      // 如果没有PRIMARY KEY，则查找结尾括号
      endIndex = sqlStr.lastIndexOf(')');
      if (endIndex === -1) {
        endIndex = sqlStr.length; // 如果没有结尾括号，则处理到末尾
      }
    }
    
    // 提取需要处理的SQL部分
    const relevantSql = sqlStr.substring(startIndex, endIndex);
    
    // 需要忽略的关键字列表
    const ignoreKeywords = [
      'AUTO_INCREMENT', 
      'PRIMARY', 
      'KEY', 
      'INDEX', 
      'UNIQUE', 
      'CONSTRAINT'
    ];
    
    // 收集所有字段信息
    let match;
    // 使用逐行分析方法，确保能正确提取COMMENT
    const lines = relevantSql.split('\n');
    
    for (const line of lines) {
      // 跳过空行和PRIMARY KEY行
      if (!line.trim() || 
          line.trim().startsWith('PRIMARY KEY') || 
          line.trim().startsWith('KEY ') ||
          line.trim().startsWith('UNIQUE ') ||
          line.trim().startsWith('INDEX ')) {
        continue;
      }
      
      // 匹配字段定义行
      const fieldMatch = line.match(/[`'"]?(\w+)[`'"]?\s+([^\s,]+)(?:\(([^)]+)\))?/);
      if (!fieldMatch) continue;
      
      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const fieldLength = fieldMatch[3];
      
      // 检查是否是需要忽略的关键字
      if (ignoreKeywords.includes(fieldName.toUpperCase())) {
        continue;
      }
      
      // 提取注释
      let comment = null;
      const commentMatch = line.match(/COMMENT\s+['"]([^'"]+)['"]/i);
      if (commentMatch) {
        comment = commentMatch[1];
      }
      
      // 转换MySQL类型到Go类型
      const goType = mapMySQLTypeToGo(fieldType, fieldLength);
      
      fields.push({
        name: fieldName,
        type: goType,
        comment: comment
      });
    }
    
    // 生成字段
    for (const field of fields) {
      // 生成Go字段名（使用PascalCase）
      const goFieldName = pascalCase(field.name);
      
      // 根据选择的命名样式决定JSON标签中使用的字段名
      let jsonFieldName = field.name;
      if (fieldStyle === 'camel') {
        jsonFieldName = camelCase(field.name);
      } else if (fieldStyle === 'pascal') {
        jsonFieldName = pascalCase(field.name);
      }
      
      // 生成标签
      let tag = '';
      if (tagType.includes('json')) {
        tag += `json:"${jsonFieldName}"`;
      }
      
      if (tagType.includes('gorm')) {
        if (tag) tag += ' ';
        tag += `gorm:"${field.name}"`;
      } else if (tagType.includes('db')) {
        if (tag) tag += ' ';
        tag += `db:"${field.name}"`;
      }
      
      if (tag) {
        tag = `\`${tag}\``;
      }
      
      // 添加注释到行尾
      if (field.comment) {
        result += `\t${goFieldName} ${field.type} ${tag} // ${field.comment}\n`;
      } else {
        result += `\t${goFieldName} ${field.type} ${tag}\n`;
      }
    }
    
    result += '}';
    
    return result;
  }
  
  // 将MySQL类型映射到Go类型
  function mapMySQLTypeToGo(mysqlType, length) {
    const type = mysqlType.toLowerCase();
    
    if (type.includes('tinyint(1)')) return 'bool';
    if (type.includes('int')) return 'int64';
    if (type.includes('float') || type.includes('double') || type.includes('decimal')) return 'float64';
    if (type.includes('bool')) return 'bool';
    if (type.includes('varchar') || type.includes('text') || type.includes('char') || type.includes('enum')) return 'string';
    if (type.includes('date') || type.includes('time')) return 'string'; // 可以使用time.Time，但字符串更简单
    if (type.includes('blob')) return '[]byte';
    
    // 默认为字符串
    return 'string';
  }
  
  // 获取Go类型
  function getGoType(value) {
    if (value === null) return 'interface{}';
    
    const type = typeof value;
    
    switch (type) {
      case 'number':
        // 检查是否为整数
        return Number.isInteger(value) ? 'int64' : 'float64';
      case 'string':
        return 'string';
      case 'boolean':
        return 'bool';
      case 'object':
        if (Array.isArray(value)) {
          // 检查数组的第一个元素类型
          if (value.length > 0) {
            return '[]' + getGoType(value[0]);
          }
          return '[]interface{}';
        }
        // 是对象/映射
        return 'map[string]interface{}';
      default:
        return 'interface{}';
    }
  }
  
  // 转换为帕斯卡命名（首字母大写的驼峰）
  function pascalCase(str) {
    return str
      .split(/[_\-\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
  
  // 转换为驼峰命名（第一个单词首字母小写）
  function camelCase(str) {
    return str.split(/[_\-\s]/)
      .map((word, index) => {
        return index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }
  
  // 转换为蛇形命名
  function snakeCase(str) {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}); 