# USTC 操作系统原理与设计 实验文档

所有实验文档位于 [./docs](./docs/) 目录中，每个实验单独存放独立的子目录，文档中使用的图片存放在相应子目录的 assets 目录里。目录与实验对应如下：

* [vmlab](./docs/vmlab/)：虚拟机和 Linux 基本环境准备。
* [syscalllab](./docs/syscalllab/)：为 Linux 内核添加系统调用。
* [shelllab](./docs/shelllab/)：实现简单的 Shell。
* [malloclab](./docs/malloclab/)：实现简单的内存分配器。
* [ohlab](./docs/ohlab/)：OpenHarmony实现简单的端侧推理。

另外，[todo.md](./docs/todo.md) 中记录了一些待完成事项。

书写规范：

* 注意图片引用使用相对路径而不是绝对路径。

## 生成和测试

本项目使用 MkDocs 构建。使用下面命令可生成静态网站：

```bash
mkdocs build
```

使用下面命令在本地运行网站，进行测试：

```bash
mkdocs serve -a localhost:8000   # 可将8000改为其它端口
```



## 致谢

本文档参考了以下项目：

* [计算机系统结构系列实验文档](https://soc.ustc.edu.cn/)
* [USTC VLab 使用文档](https://vlab.ustc.edu.cn/docs/)（[仓库](https://github.com/USTC-vlab/docs)）
