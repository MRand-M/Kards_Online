const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

// 静态网站文件
app.use(express.static(__dirname));

// 测试服务器是否正常
app.get("/health", (req, res) => {
    res.send("OK");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
