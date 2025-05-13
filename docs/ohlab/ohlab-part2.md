# 移动操作系统与端侧AI推理初探-端侧推理应用实现（Part2）

## 实验目的

- 了解AI的基础概念，了解什么是端侧AI推理
- 学会交叉编译出动态链接库并且在应用开发时使用

## 实验环境

- OS:
  - 交叉编译：Ubuntu 24.04.4 LTS
  - OH 应用开发：Windows
  
- Platform : VMware

## 实验时间安排

> 注：此处为实验发布时的安排计划，请以课程主页和课程群内最新公告为准
>
> 注: 所有的实验所需要的素材都可以在睿客网盘链接：https://rec.ustc.edu.cn/share/dfbc3380-2b3c-11f0-aee2-27696db61006 中找到。
>
> 此次实验只有两周时间，本文档为第二阶段的实验文档，阅读完毕后可以在第一阶段的基础上开始做第二阶段的实验。

-  5.16晚实验课，讲解实验、检查实验
-  5.23晚实验课，检查实验
-  5.30晚实验课，补检查实验

## 友情提示/为什么要做这个实验？

- **本实验难度并不高，几乎没有代码上的要求，只是让大家了解完整的移动应用开发流程，并在此过程中，体会移动操作系统与我们之前使用的桌面/服务端操作系统的不同。**
- 如果同学们遇到了问题，请先查询在线文档，也欢迎在文档内/群内/私聊助教提问。在线文档地址：[https://docs.qq.com/sheet/DU1JrWXhKdFFpWVNR](https://docs.qq.com/sheet/DU1JrWXhKdFFpWVNR)
  - 为了提供足够的信息，方便助教助教更快更好地解答你的疑问，我们推荐你阅读（由LUG撰写的）[提问指南](https://lug.ustc.edu.cn/wiki/doc/howtoask/)。**当然，这并不是必须的，你可以随时提问，助教都会尽可能提供帮助。**



# 实验内容简介

> 本节提供对本次实验的概览，让大家能更好地理解本次实验要做什么，目标是什么。实验的具体步骤可以参考本文档后面章节。

本次实验中，我们将在提供的 DAYU200 开发板上，运行 OpenHarmony 操作系统，并开发能运行在该开发板上和 OpenHarmony 上的大模型推理应用。为了实现这个目标，需要依次完成以下几个任务：

1. 将 OpenHarmony 系统安装到开发板上并运行。

2. 安装并配置 OpenHarmony 应用的开发环境，成功开发并在开发板上运行一个示例应用。

3. 完成大语言模型推理应用的开发，其中包括：

   * 通过交叉编译，将大模型推理框架（Llama.cpp）编译为能够在开发板上使用的动态链接库。

   * 调用上述库，完成应用，并运行在开发板上。

在上一阶段中，我们已经完成了前两个目标。在这一阶段，我们将学习如何使用第三方库，并通过交叉编译，生成能在开发板上使用的动态链接库。最后，我们将调用编译好的动态链接库，在开发板上实现端侧推理功能。



# 第一部分：第三方库的编译与使用

我们本次实验的目标，是在开发板上实现大模型推理应用。然而，很明显，我们是操作系统课程，大部分同学也没有系统学习过人工智能和大语言模型的相关知识。要求大家在一周内学习并实现大语言模型推理，显然是不现实的。

> 相信很多同学已经使用过了一些主流的大模型（如国内的 DeepSeek、豆包、千问，国外的 ChatGPT、Claude、Gemini等）和使用这些大模型开发的工具和应用（如 Github Copilot 等）。但大家对大模型的原理可能还不太了解。虽然本实验不涉及大模型的具体原理，但我们还是写了一篇简短的介绍，感兴趣的同学可以阅读[附录A](#附录A: 大模型推理与 llama.cpp 简介)。
>
> 大模型系统的优化也是我们课题组近年的研究方向之一，欢迎感兴趣的同学联系[李永坤老师](http://staff.ustc.edu.cn/~ykli/)，加入我们。(●'◡'●)

幸运的是，在计算机领域，我们可以常常可以使用前人已经完成的工作。甚至，对于开源软件，我们还能拿到软件源代码，只要遵守开源协议，我们就能对软件做出修改，增添功能，或者移植到我们想要的平台。

> 在计算机领域，在已经存在的库/软件基础上做改进甚至是被鼓励的。“不重复造轮子”是计算机领域的常被提及的原则。当然，“重复造轮子”本身是很好的学习过程，我们之前的实验也通过重新“制造” Shell、内存分配器，学习了操作系统相关知识。

在本次实验中，我们就将直接使用著名的大模型推理框架 [llama.cpp](https://github.com/ggml-org/llama.cpp/tree/master)，来实现我们的大模型推理功能。不过，在深入研究Llama.cpp之前，让我们首先在熟悉的Ubuntu系统上，学习一下什么是动态链接库，以及如何编译和使用一个像Llama.cpp这样的实际第三方库。


## 1.1 什么是动态链接库 (Dynamic Link Libraries / Shared Libraries)？

在软件开发中，“库 (Library)”是一系列预先编写好的、可重用代码的集合，它们提供了特定的功能，例如数学计算、文件操作、网络通信等。开发者可以在自己的程序中调用这些库提供的功能，而无需从头编写所有代码。

链接库主要有两种形式：静态链接库和动态链接库。

1. 静态链接库 (Static Libraries)：

    - 在程序**编译链接**阶段，静态库的代码会被完整地复制并合并到最终生成的可执行文件中。
    - **优点：** 程序部署简单，因为它不依赖外部库文件；所有代码都在一个文件里。
    - **缺点：**
        - 体积大： 如果多个程序都使用了同一个静态库，那么每个程序都会包含一份库代码的副本，导致总体磁盘占用和内存占用增加。
        - 更新困难： 如果静态库更新了（比如修复了一个bug），所有使用了该库的程序都需要重新编译链接才能使用新版本的库。
    - 在Linux中，静态库通常以 .a (archive) 为后缀。

2. 动态链接库 (Dynamic Link Libraries / Shared Libraries)：

    - 动态库的代码并**不会**在编译时复制到可执行文件中。相反，可执行文件中只包含了对库中函数和变量的引用（或称为“存根”）。
    - 当程序运行时，操作系统会负责在内存中查找、加载所需的动态库，并将程序中的引用指向实际的库代码。
    - **优点：**
        - 代码共享，节省资源： 多个程序可以共享内存中同一份动态库的实例，减少了磁盘占用和物理内存的消耗。
        - 独立更新： 动态库可以独立于使用它的程序进行更新。只要库的接口保持兼容，更新后的库可以被所有依赖它的程序自动使用，无需重新编译这些程序。
        - 模块化： 使得大型软件可以被分解成多个更小、更易于管理的模块。
    - **缺点：**
        - 运行时依赖： 程序运行时必须能够找到并加载其依赖的动态库文件，否则无法运行（可能会出现“找不到.so文件”的错误）。
        - 版本兼容性问题 (DLL Hell / SO Hell)： 如果不同程序依赖同一动态库的不同版本，且这些版本不兼容，可能会导致问题。
    - 在Linux（包括Ubuntu）和OpenHarmony（标准系统）中，动态链接库通常以 .so (shared object) 为后缀。在Windows中，它们则以 .dll (dynamic-link library) 为后缀。

**Llama.cpp 项目的核心部分就可以被编译成一个动态链接库 (libllama.so)，然后其提供的各种示例程序（如 main, Llama-Demo等）会调用这个库来实现具体功能。本次实验，我们将首先在Ubuntu上体验这个过程**

## 1.2 使用 Llama.cpp 体验动态链接库的编译与使用 (Ubuntu环境)
在上一节，我们了解了动态链接库的基本概念。现在，我们将以Llama.cpp为例，在Ubuntu环境下，一步步将其核心代码编译成一个动态链接库。Llama.cpp项目支持使用多种构建系统，其中CMake是一个强大且跨平台的选择，非常适合管理C++项目的编译。

### 1.2.1 Llama.cpp 简介与源代码获取
Llama.cpp 是一个用纯C/C++编写的开源项目，旨在高效地在多种硬件平台（包括CPU）上运行Llama系列以及其他架构的大型语言模型（LLM）。它的主要优势在于性能优化、支持模型量化（减小模型体积和内存占用）以及良好的跨平台兼容性，使其非常适合在资源相对受限的端侧设备上进行LLM推理。

- 通过压缩包下载：
1. 使用`wget`下载Llama.cpp压缩包

    ```sh
    $ cd ~/oslab
    $ wget https://git.ustc.edu.cn/KONC/oh_lab/-/raw/main/llama.cpp.zip
    ```
2. 解压Llama.cpp压缩包,解压后得到llama.cpp文件夹

    ```sh
    $ unzip llama.cpp.zip
    ```

- 第二种方式(通过git下载)：

1. 安装git

    ```sh
    $ sudo apt-get install git
    ```

2. 下载Llama.cpp

    ```sh
    $ git clone https://github.com/ggml-org/llama.cpp.git
    ```
    这会在当前目录下创建一个名为 llama.cpp 的文件夹，其中包含所有源代码。

### 1.2.2 Cmake简介

CMake本身不是一个编译器，而是一个构建系统生成器。它读取名为 `CMakeLists.txt` 的配置文件（由项目开发者编写），并根据其中的指令为你当前的平台和工具链生成实际的构建脚本（例如Linux上的Makefiles或Ninja文件）。然后，你再使用这些生成的脚本来编译项目。

> 我们曾在Lab1中学习过怎么使用makefile文件来进行自动化编译。当我们的项目很复杂时，手写 Makefile 也会变得非常麻烦，而且不方便动态修改。这时候，我们就可以通过编写 `CMakeLists.txt` 来让 CMake 帮我们自动生成 Makefile。（当然，CMake 本身也可能变得很复杂，于是，还有一些简化 CMakeLists 编写的工具，套娃了。）

**优点：**

- 跨平台： 同一份CMakeLists.txt通常可以在多个操作系统和编译器上工作。
- 依赖管理： 能较好地处理项目内和项目间的依赖关系。
- 灵活性： 支持复杂的构建配置和自定义选项。

### 1.2.2 使用Cmake在 Ubuntu 上编译 Llama.cpp 动态链接库 (libllama.so)

我们将采用“out-of-source build”（在源代码目录之外进行构建）的方式，这是一种良好的CMake实践，可以保持源代码目录的整洁。

> 简单说，就是把编译过程的中间文件，和最后生成的结果，都放在单独的目录下。

> 虽然如上一节所言，CMake不仅能生成Makefile，但为了简洁起见，以下都暂时认为，CMake就是用来生成（和调用）Makefile的工具，这也是CMake最常见的用法。

1. 运行CMake配置项目：
    确保您当前位于 llama.cpp 的根目录下。执行以下命令：

    ```Bash
    cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF -DLLAMA_CURL=OFF
    ```
    命令的核心是`cmake -S . -B build`，意思是从当前目录（`.`）读取配置（也就是`CMakeLists.txt`文件），在`build`目录下生成一个`Makefile`，剩余的部分规定了一些具体的编译选项。
    具体而言，每个参数的意义是：

    - `-S .`: (Source Directory) 指定CMake的从当前目录（`.`）读取配置，以生成相应的`Makefile`。
    - `-B build`: (Build Directory)  指定CMake生成构建系统文件以及后续编译产物的目录为当前目录下的 `build` 子目录（简单说，把生成结果全部放在`build`目录下）。如果 `build` 目录不存在，CMake 会自动创建它。
    - `-DCMAKE_BUILD_TYPE=Release`: 指定构建类型为Release，会开启优化（例如，为`gcc`添加`-O2`等优化选项），生成的库性能更好。如果需要调试，可以使用Debug。
    - `-DLLAMA_BUILD_TESTS=OFF` 和 `-DLLAMA_BUILD_EXAMPLES=OFF`: 这两个参数是库的编译选项。CMakeLists 允许库作者提供自定义选项，让使用者根据自己的需求进行选择。这两个选项的意思分别是“不编译测试”以及“不编译示例程序”，因为我们当前的目标只是生成`libllama.so`库文件，并且后续会单独编译我们自己的llama-Demo.cpp。
    - `-DLLAMA_CURL=OFF`：也是一个编译选项，意义是不使用`CURL`库。（有时候，库可以根据是否有其它某些库，来提供不同的功能。这里我们为了避免安装更多的依赖，关闭该选项。）
    
    如果配置成功，终端会显示相关信息，并且build目录下会生成`Makefile`（和其他一些文件）。
    




3. 执行编译与安装：
    在build目录下，执行以下命令：

    a. 首先，编译 llama 库目标：

    ```bash 
    cmake --build build -j$(nproc)
    ```
    * `--build build` : 告诉CMake执行目录（即build目录）下的构建脚本。
    * `-j$(nproc)`: (可选) 使用所有可用的CPU核心并行编译，以加快速度。

    > 实际上，`cmake --build build`会让cmake进入`build`目录，然后自动调用`make`。

    b.  然后，执行安装命令：

    此命令会将已编译好的目标（根据CMakeLists.txt中的install规则，包括libllama.so和头文件llama.h）安装到指定的 --prefix 下。
    ```bash 
    cmake --install build --prefix "build/install"
    ```
    * `--install build`: 执行构建目录`build`中的安装规则。
    * `--prefix "build/install"`: 指定安装路径的前缀。因为我们当前在 `llama.cpp` 目录下，这会在 `build/` 内部创建一个名为 `install` 的子目录 (即 `llama.cpp/build/install/`)，并将库文件安装到 `llama.cpp/build/install/lib/`，头文件安装到 `llama.cpp/build/install/include/`。

    > 实际上，`cmake --install build`会让cmake进入`build`目录，然后帮助我们调用`make install`，并添加合适的参数，将编译好的文件复制到指定位置。

4. 查找并验证编译产物：
    编译成功后，libllama.so 文件通常会生成在`llama.cpp/build/install/lib` 目录下。

    ``` Bash
    ls -l install/lib/libllama.so 
    file install/lib/libllama.so
    ```
    file 命令的输出应该类似：`libllama.so: ELF 64-bit LSB shared object, x86-64, version 1 (GNU/Linux), dynamically linked, ...`，表明它是一个为当前Ubuntu x86-64架构编译的动态链接库。

现在，我们已经拥有了在Ubuntu上本地编译好的libllama.so。

> 如果你仔细观察，会发现`build/install`目录下生成了三个子目录，分别是`bin`、`lib`和`include`。实际上，三个目录都是编译后的产物，每个目录存放的内容如下：
>
> `bin`：一些编译好的可执行文件，用于将模型转换为llama.cpp需要的格式等。在调用库时用不到。
>
> `lib`：实际上编译出的动态链接库。编译出的`.so`文件其实不止一个，每个都包含了一些函数，它们相互之间可能还会调用。因此，需要用到所有这些`.so`文件，才能正常使用库。（由于所有需要的库文件都在该目录，下一步中，我们会将把该目录指定为需要查找的存放动态链接库的目录。）
>
> `include`：在写代码时，我们必须要`#include`合适的头文件，来告诉我们可以使用哪些函数。该目录就是存放 llama.cpp 所提供的头文件，这些头文件内定义的函数，与生成的`.so`文件里的函数是对应的。因此，我们可以通过`#include`这些头文件，来使用`.so`文件里的对应函数。

### 1.2.3 在 Ubuntu 上编译 Llama.cpp 示例程序(llama-Demo.cpp)

接下来，我们将编译提供的llama-Demo.cpp文件。这个程序是一个独立的C++应用，它将通过调用我们刚刚编译的libllama.so库来实现加载模型和执行推理的功能。（提供gguf模型文件与prompt，llama-Demo.cpp文件将提供的prompt续写生成一段话）

> 在实际工作流程中，该`llama-Demo.cpp`文件就是由同学们编写的，用来调用llama库的代码。（而llama库则是直接从网上下载的，他人提供的库。）然而，考虑到实验难度，在本次实验中，助教帮大家写好了这个文件。
>
> 同学们可能会问，如果是自己使用时，我怎么知道要怎么调用库中的函数，用哪个函数呢？这就要阅读库所附带的文档了。通常，库作者同时会提供一个库的说明（或者示例程序），通过阅读这些说明，能够学习到库的用法。例如，llama.cpp的示例程序可以在源码中的`examples`目录下找到。助教的`llama-Demo.cpp`就是按照其中的`simple/simple.cpp`修改得到的。

#### 1.2.3.1 下载并编译llama-Demo.cpp
假设我们已经将llama-Demo.cpp放到了一个工作目录，例如`~/oslab/llama-Demo.cpp`。并且，llama.cpp的源代码位于`~/oslab/llama.cpp/`，我们编译好的libllama.so位于`~/oslab/llama.cpp/build/install/lib`，得到的头文件位于``~/oslab/llama.cpp/build/install/include``。

1. 下载llama-Demo.cpp并进入llama-Demo.cpp所在目录：
    ```Bash
    cd ~/oslab/
    wget https://git.ustc.edu.cn/KONC/oh_lab/-/raw/main/llama-Demo.cpp
    ```
2. 执行编译命令： 
    ```Bash
    g++ -o llama-Demo llama-Demo.cpp \
    -I./llama.cpp/build/install/include \
    -L./llama.cpp/build/install/lib \
    -lllama \
    -std=c++17
    ```
    参数解析：
    - `-o llama-Demo`: 指定输出可执行文件的名称为llama-Demo。
    - `-I./llama.cpp/build/install/include`: 指定头文件的搜索路径(相对路径)。
    - `-L./llama.cpp/build/install/lib`: 指定库文件的搜索路径(相对路径)。
    - `-lllama`: (小写L) 告诉链接器链接名为llama的库（即libllama.so）。（你可以把`-lllama`断句为`-l`和`llama`，虽然它们必须要连着写。意思是链接（link）llama 库。看到这句话的编译器会自动寻找名字为`libllama.so`或`.a`的文件，并从中寻找函数的实现。）
    - `-std=c++17`: 指定C++标准版本为C++17。
    
    > 从这一步的参数中也可以看出，C/C++中使用第三方库需要两类文件：**头文件**和**库文件**。头文件定义了函数的接口，库文件内存放了函数的实现（机器码）。

#### 1.2.3.2 运行llama-Demo

1. 添加环境变量(意味着程序运行时从哪里找到动态链接库)

    ```Bash
    # 注意修改lib的路径
    export LD_LIBRARY_PATH=~/oslab/llama.cpp/build/install/lib:$LD_LIBRARY_PATH
    ```
    - `export`: 用于设置环境变量。
    - `LD_LIBRARY_PATH`: 一个环境变量，用于指定动态链接库的搜索路径。
    - `~/oslab/llama.cpp/build/install/lib`: 指定的库文件路径。指向了我们刚刚生成的库的路径。存放了需要的所有`.so`文件。
    - `:$LD_LIBRARY_PATH`: 保留原有的`LD_LIBRARY_PATH`值。（在环境变量中，我们常常用`:`来连接多个路径。例如，当我们要查找两个路径`./a`和`./b`时，会写成`./a:./b`。这里用冒号连接了原来的`LD_LIBRARY_PATH`，意思是查找完提供的路径，还要查找原来环境变量中的路径。）
      - 为什么还要查找原来的路径呢？实际上任何C/C++程序都会自动链接一些库文件。比如标准库，里面提供了类似`printf`之类的语言自带函数。

2. 使用wget下载模型文件,选择其一即可
    ```Bash
    # Tinystories模型，用于生成一个小故事，大小为668MB
    wget https://git.ustc.edu.cn/KONC/oh_lab/-/raw/main/tinystories2.Q4_K_M.gguf
    # qwen3.0-0.6B模型，用于通用任务,大小为379MB
    wget https://git.ustc.edu.cn/KONC/oh_lab/-/raw/main/Qwen3-0.6B-Q4_K_M.gguf
    ```
    
3. 运行llama-Demo
    ```sh
    # `model.gguf`为模型文件路径，当前假设模型文件与可执行文件在同一目录下，`n_predict`为生成的长度，`prompt`为用户输入的提示，程序会根据提示续写出一段话。
    $ ./llama-Demo -m ./model.gguf [-n n_predict] [prompt]
    ```

如果执行成功应该能看到程序加载模型后，根据提示开始生成文本，这证明了llama-Demo成功调用了动态链接库libllama.so中的功能。示例输出如下所示：
```bash
    $ ./llama-Demo -m ./Qwen3-0.6B-Q4_K_M.gguf -n 128 "I'm a student from USTC, My student ID is PB23011000"
    ... # 各种配置信息
    I'm a student from USTC,My student ID is PB230110001, and I'm a student in the 2023-2024 academic year. I'm interested in studying in the field of Computer Science. I want to know if I can get a scholarship for the 2023-2024 academic year. I need to apply for the scholarship, and I need to provide the following information: my student ID, my name, my major, my academic year, and my current status. Please help me to fill out the application form. I need to know if I can get a scholarship for the 2023-2024 academic
    ... # 性能信息
```

#### 1.2.3.3 llama-Demo.cpp 工作流程

这一节中，我们将简要的介绍`llama-Demo.cpp`的代码。由于AI推理实际上是个涉及多个函数调用的复杂过程，我们并不会非常完整地介绍代码中的每一个细节，同学们也不需要完全理解本节的介绍，只需要知道**这份代码通过调用llama.cpp库中提供的函数，实现了运行下载的GGUF模型，并续写用户提供的提示词的功能**。

你可以在[附录C](#附录C: llama-Demo.cpp代码说明)中找到更细节的说明。

> 如果你还想了解更多，可以参考llama.cpp源码中`include/llama.h`中的注释，`examples/`中的样例程序，以及[llama.cpp 的Github仓库]([ggml-org/llama.cpp: LLM inference in C/C++](https://github.com/ggml-org/llama.cpp))。

llama-Demo.cpp的主要工作流程如下：

- 包含 llama.h 头文件以使用Llama.cpp库的API。
    ```cpp
    #include "llama.h"
    ```
    
    > 整份代码中，所有以小写`llama_`开头的函数，都是`llama.h`中定义的函数。这种统一的命名格式是库作者的良好习惯，能有效避免和其它库的函数出现命名冲突。
    
- 调用`ParseArgs`函数，解析命令行参数，获取模型文件路径、用户提示以及输出的长度设置。
  
    ```cpp
    int main(int argc, char **argv) {
        std::string prompt = "Hello world";
        std::string model_path;
        int n_predict = 128; //  Default number of tokens to predict
        // Parse command line arguments
        ParseArgs(argc, argv, model_path, prompt, n_predict);
        ...
    }
    ```
    
- 加载指定的GGUF模型，并且获取词汇表。其中`LoadModel`函数中，又调用了多个`llama_`的库中函数，实现模型加载，并返回模型指针（`llama_model`类型也是`llama.h`中定义的）。
  
    > GGUF是llama.cpp使用的模型格式。不同框架可能使用不同模型格式。
    
    ```cpp
    int main(int argc, char **argv){
        ...
        // initialize the model
        llama_model* model = LoadModel(model_path);
        //get vocab
        const llama_vocab * vocab = llama_model_get_vocab(model);
        ...
    }
    ```
    
- 对用户提示进行分词 (Tokenization)。
  
    > “tokenization” 通常是大语言模型处理的第一步，和传统NLP的分词不同，它实际上是把文本转成一个个向量组成的列表，每个“词元”(token)对应一个向量。
    >
    > `std::vector`是C++中提供的一种“容器”，你可以认为是长度可以变化的数组，和上面说的向量也不是一回事。
    
    ```cpp
    int main(int argc, char **argv){
        ...
        // tokenize the prompt
        std::vector<llama_token> prompt_tokens = TokenizePrompt(vocab, prompt);
        ...
    }
    ```
    
- 初始化推理上下文 (Context) 和采样器 (Sampler)。
  
    > 也是模型推理中需要的步骤。
    
    ```cpp
    int main(int argc, char **argv){
        ...
        // initialize the context
        int n_prompt = prompt_tokens.size(); // number of prompt
        llama_context * ctx = InitializeContext(model, n_prompt, n_predict);
        // initialize the sampler
        llama_sampler * smpl = InitializeSampler();
        ...
    }
    ```
    
- 执行推理循环，逐个生成词元 (Token)，并将词元转换回文本输出。
  
    > `GenerateTokens`函数里是个循环，每循环一次生成一个词元（token）。我们平时网上用大模型，会发现模型输出是一个个词往外吐的，这并不是网页为了好看做的美化，而是因为大模型真的是一个个词生成输出的。
    
    ```cpp
    int main(int argc, char **argv){
        ...
        // generate tokens
        GenerateTokens(prompt_tokens, ctx, vocab, smpl, n_prompt, n_predict);
        ...
    }
    ```
    
- 打印性能信息并且释放资源。
  
    > 又调用了好多 llama.cpp 中的函数。
    
    ```cpp
    int main(int argc, char **argv) {
        ...
        // print performance
        fprintf(stderr, "\n");
        llama_perf_sampler_print(smpl);
        llama_perf_context_print(ctx);
        fprintf(stderr, "\n");
    
        // free the resources
        llama_sampler_free(smpl);
        llama_free(ctx);
        llama_model_free(model);
    }
    ```



# 第二部分 通过交叉编译跨架构生成库文件

## 2.1 交叉编译的概念

在第一部分，我们在 Ubuntu 内体验了如何使用第三方库编写程序，然而，要在移动设备（在本次实验中，也就是我们的开发板）上使用第三方库，还没有那么简单，我们还需要解决两个关键问题：

1. 移动设备处理器的体系结构与主机不同，编译出来的库无法直接使用。
2. 移动设备应用开发模式（如开发语言）不同，需要跨语言调用。

在这一部分中， 我们将通过**交叉编译**技术解决第一个问题，而第二个问题则留到下一部分讨论。

首先，我们需要理解，为什么处理器体系结构（包括指令集）不同，会给第三方库的使用带来问题。在上一部分中，我们知道，Linux 中第三方库会被编译为`.so`格式的动态链接库。可以想象，为了正常调用，`.so`文件里实际上**存储了库函数执行所需的机器码**（当然，还包括一些其它信息）。不同指令集的机器码不一样，因此，为 `x86_64` 指令集编译的库文件自然没法用于ARM架构的硬件上（即使上面都运行着Linux内核）。

因此，为了让开发板能使用 llama.cpp 库，我们需要用我们的电脑，编译出使用 ARM （具体而言，`armeabi-v7a`）架构的动态库。而这种“在一种体系结构的平台上，编译出另一种体系结构平台上可执行代码”的过程，就被称为**交叉编译**。（例如，从使用`x86_64`的我们的电脑上，编译出使用的`armeabi-v7a`的开发板能执行的动态库。）

> **为什么不在开发板上编译？**
>
> 看了上面的介绍，同学们可能还有疑问。既然主机和开发板架构不同，那我们直接使用开发板编译不就可以了吗？为什么一定要在主机上完成交叉和编译呢？
>
> 实际上，在嵌入式系统和移动设备开发中，交叉编译非常普遍且必要，主要原因包括：
>
> 1. **目标机资源受限**： 像 DAYU200 这样的开发板或许多嵌入式设备，其处理器性能、内存大小、存储空间都远不如桌面PC（例如，有些嵌入式设备只有几MB内存）。在这些设备上直接进行大型项目（如操作系统内核、复杂的 C++ 应用如 Llama.cpp）的编译会非常缓慢，甚至因资源不足而无法完成。
> 2. **目标机缺乏开发环境**： 很多目标设备可能没有安装编译器、链接器、库文件等完整的开发工具链。它们被设计为运行特定应用，而不是进行软件开发。(OpenHarmony中没有开发工具链)
> 3. **开发效率和便利性**： 开发者通常更习惯在功能强大、工具齐全的PC上进行代码编写、调试和项目管理。交叉编译使得开发者可以在熟悉的开发环境中为资源受限或环境不同的目标设备构建软件。
> 4. **特定架构需求：** 有些软件就是为特定非主流架构设计的，开发者可能没有该架构的物理机器用于本地编译。（我开发一个跨平台库，难道还需要把世界上所有存在的架构的计算机都买一台吗？）

## 2.2 准备交叉编译所需的工具（OpenHarmony Native SDK）

本次实验的核心任务之一是交叉编译 C++ 代码库（Llama.cpp）。这个过程需要在 Linux 环境下进行，并且需要一套特定的交叉编译工具链和 OpenHarmony 系统库/头文件（统称为 Native SDK 或 Toolchain）。这套工具运行在您的 Ubuntu 系统上，但其编译产生的目标代码是运行在 DAYU200 (arm32 架构) 上的 OpenHarmony 系统。

1. 使用wget下载OpenHarmony Native SDK

    下载地址：https://git.ustc.edu.cn/KONC/oh_lab/-/raw/main/native-linux-x64-5.0.3.135-Release.zip

  备用地址：https://rec.ustc.edu.cn/share/dfbc3380-2b3c-11f0-aee2-27696db61006 （选择`第二阶段素材 -> native-linux-x64.zip`）

2. 解压，注意解压目录，后续需要使用（我们后续假设解压路径是`~/ohlab/`）
```sh
$ unzip native-linux-x64-5.0.3.135-Release.zip
```

> 这里估计又会有疑问，在3.1步中明明下载过SDK，为什么这里还需要下载SDK?
>
> 最主要原因为Linux和Windows使用的链接库不同，在开发板运行的OpenHarmony的内核是Linux，所以我们需要在Linux上编译出链接库使用，并且我们这里只使用了Native SDK，即编译CPP程序需要的工具，而在3.1步中，我们还下载了编译前端的SDK。


> 还有同学可能会好奇，这个“Native SDK”里，到底**包含了什么**呢？
>
> 实际上，这里的 SDK （也即第一阶段所说的妙妙小工具），包含了一系列编译所需要的工具、库文件、配置等等。例如`gcc`这样的编译器；`make`, `cmake`这样的配置工具；`libstdc++.so`（标准C++库）这样的库文件等。这些工具、文件都是为特定架构生成的，因此与 Ubuntu 中我们用`apt`安装的那些不一样。OH 的 SDK 还包含了用于鸿蒙系统的编译配置，我们下面也会使用到。

## 2.3 交叉编译应用过程

在前面的步骤中，我们了解了交叉编译的概念，并在 Ubuntu 系统上准备了 OpenHarmony Native SDK，其中包含了针对 DAYU200 开发板（arm32架构）的交叉编译工具链和系统库。现在，我们将实践一个简单的交叉编译过程，同样，我们以之后将会使用的 llama.cpp 为例。

### 2.3.1 使用 SDK 中的 CMake 进行交叉编译

#### 2.3.1.1 使用SDK中的`cmake`生成`Makefile`

在第一阶段中，我们演示了使用`cmake`编译 llama.cpp 的过程。实际上，交叉编译的过程几乎一样，我们只需要将编译使用的`cmake`，换成刚刚下载的 `SDK` 中的 `cmake`即可。具体而言，步骤如下：

1. 确认你的 SDK 的路径，以及其中`cmake`的位置。

假设你的 SDK 路径为 `~/ohlab/native-linux-x64-5.0.3.135-Release`，你应该可以在该目录下`./native/build-tools/cmake/bin/`处找到`cmake`程序。例如，运行如下指令（注意替换路径）：

```bash
cd ~/ohlab/native-linux-x64-5.0.3.135-Release
./native/build-tools/cmake/bin/cmake --version
```

可以得到类似输出：

```bash
cmake version 3.28.2

CMake suite maintained and supported by Kitware (kitware.com/cmake).
```

2. 进入你的`llama.cpp`源码路径。

```bash
cd llama.cpp  # 请自行修改路径
```

3. 使用 SDK 中的 `cmake` 编译 `llama.cpp`。

该过程和第一部分类似，只是需要将`cmake`命令，换成前面确认过的，SDK中的`cmake`的路径，并增加一些额外配置。

由于完整路径可能很长，我们可以通过定义环境变量来避免重复书写完整路径，如下：

```bash
# 定义环境变量，注意将改行改成你自己的路径，请使用绝对路径以避免出错。
export OHOS_SDK_ROOT="/home/[username]/ohlab/native-linux-x64-5.0.3.135-Release"

# 使用对应的cmake编译文件（以下是一个命令，'\'在bash中表示命令没写完，下一行可以继续写。这条命令太长了，分行写看起来好看。你想写在同一行也是可以的。注意'\'字符后面不能有空格。）
${OHOS_SDK_ROOT}/build-tools/cmake/bin/cmake \
	-S . \
    -B build-ohos \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_TOOLCHAIN_FILE=${OHOS_SDK_ROOT}/build/cmake/ohos.toolchain.cmake \
    -DOHOS_ARCH=armeabi-v7a \
    -DCMAKE_CXX_FLAGS="-Wno-c++11-narrowing" \
    -DGGML_NATIVE=OFF \
    -DGGML_OPENMP=OFF \
    -DLLAMA_BUILD_TESTS=OFF \
    -DLLAMA_CURL=OFF
```

这一步和 [1.2.2](#1.2.2 使用Cmake在 Ubuntu 上编译 Llama.cpp 动态链接库 (libllama.so))节第二步类似，但明显，我们命令长了很多，添加了许多选项。

> 回顾一下，1.2.2节的命令是：
>
> `cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF -DLLAMA_CURL=OFF`

我们来具体分析一下命令发生了哪些变化：

- `${OHOS_SDK_ROOT}/build-tools/cmake/bin/cmake`: 我们使用了一个完整的路径名（`${OHOS_SDK_ROOT}`会被替换成我们通过`export`定义的变量），指定使用 OpenHarmony SDK 中自带的 CMake 可执行文件，而不是直接使用`cmake`命令。
- `-B build-ohos32`: 类似`-B build`，只是这次将编译的中间文件和结果放在`build-ohos32`而不是`build`目录下，方便我们查找。
- `-DCMAKE_TOOLCHAIN_FILE=${OHOS_SDK_ROOT}/build/cmake/ohos.toolchain.cmake`: **该参数是交叉编译的核心。**`-DCMAKE_TOOLCHAIN_FILE`会让`cmake`从指定的文件里读取用到的工具的位置（例如编译器`gcc`，和`make`等）。后面的文件是SDK中已经写好的，编译到OpenHarmony的特定配置，它指定了使用 SDK 中的`gcc`进行编译。
- `-DOHOS_ARCH=armeabi-v7a`: 这个参数用于指定目标CPU架构为 `armeabi-v7a` (ARM 32位架构)。上一个参数的文件内会读取该参数。
- `-DCMAKE_CXX_FLAGS="-Wno-c++11-narrowing"`：这个参数为GCC添加了一个编译标志，告诉GCC允许范围缩小的强制类型转换。（这是因为我们目标架构是32位的，llama.cpp没考虑这种情况，存在一些把64位整数转换成32位的情况。不加这个参数会导致编译错误。）
- `-DGGML_NATIVE=OFF`、`-DGGML_OPENMP=OFF`：这俩也是编译选项，我们又关了一些东西，因为开发板上没有特定的依赖库。（我们几乎把所有能关的选项都关了。）

如果命令成功运行，那和之前一样`build-ohos32`下会生成`Makefile`。（和上一阶段类似。）

#### 2.3.1.2 生成并“安装”库文件

这个过程和上一阶段类似，只是把`cmake`换成了`SDK`中的`cmake`罢了。

1. 编译Llama.cpp生成动态链接库与头文件:

   ```sh
   ${OHOS_SDK_ROOT}/build-tools/cmake/bin/cmake  --build build-ohos --config Release -j
   ${OHOS_SDK_ROOT}/build-tools/cmake/bin/cmake --install build-ohos --prefix "build-ohos/install"
   ```

   （注意，这一次，我们把生成的库文件和头文件，安装到了`build-ohos/install`里。）

2. 查找编译产物：

   编译成功后，生成的库文件和可执行文件位于刚刚指定的安装目录里，如：

   - 动态链接库 libllama.so 可能位于：`build-ohos/install/lib`。
   - 头文件可能位于：`build-ohos32/install/include`。 请检查这些常见位置。例如：

   ```sh
   # ls -l build-ohos32/install/lib
   cmake  libggml-base.so  libggml-cpu.so  libggml.so  libllama.so  libllava_shared.so  libmtmd_shared.so  pkgconfig
   # ls -l build-ohos32/install/include
   ggml-alloc.h   ggml-blas.h  ggml-cpp.h  ggml-cuda.h  ggml-kompute.h  ggml-opt.h  ggml-sycl.h    gguf.h       llama.h ggml-backend.h  ggml-cann.h  ggml-cpu.h  ggml.h       ggml-metal.h    ggml-rpc.h  ggml-vulkan.h  llama-cpp.h
   ```

3. 验证编译产物

为了确认我们确实交叉编译出了32位 ARM架构的库文件，我们可以使用 `file` 命令检查生成的 `libllama.so` 文件，确认它的架构：

```bash
# 在Ubuntu宿主机上，使用 file 命令检查生成的 libllama.so 和 main 文件，确认它们的架构：
$ file build-ohos/install/lib/libllama.so
build-ohos/install/lib/libllama.so: ELF 32-bit LSB shared object, ARM, EABI5 version 1 (SYSV), dynamically linked, BuildID[sha1]=9b36a4f7b3365492d0c566681e81b6aebaafcb8d, with debug_info, not stripped
```

输出应明确指出它们是为 `ARM32` 架构（例如上面的`ARM,EABI5`）。

完成这些步骤后，你已经成功将 llama.cpp 交叉编译为可以在目标设备（ 架构为armeabi-v7a 的 OpenHarmony 系统）上运行的库了。**真不容易，恭喜你！**

下一阶段，我们会尝试在应用开发中，使用这个编译好的库。



# 第三部分：将 Llama.cpp 集成到应用中

> 由于我们课程毕竟不是 ArkTS 语言学习或者 OpenHarmony 应用开发。本节还是几乎不需要大家完成代码。以介绍流程和引发大家兴趣为主。

## 3. 1 在 OpenHarmony 应用中调用 C++ 代码

还记得第一阶段中你创建的那个以自己学号命名的 DevEco Studio 中的项目吗？创建项目时，我们选择了 Native C++ 项目，但第一阶段运行时，好像并没有出现什么跟 C++ 有关的内容。

实际上，作为 Native C++ 的模板应用，这个项目中隐藏了在ArkTS中调用C++函数的示例。下面，我们将介绍这个例子，简单了解 OpenHarmony 应用调用 C++ 函数的思路。

> [!NOTE]
>
> 接下来的内容将在 Windows 中进行，请打开DevEco，开启你之前创建的项目。（或新建一个 Native C++项目。）

### 3.1.1 Native C++ 代码结构介绍

>  在上一阶段，我们虽然通过修改项目配置文件，将一个应用运行在了开发板上，但并没有对项目结构做太多介绍。这一节，我们将首先介绍项目的代码结构。

我们可以在DevEco左侧的项目目录中看到项目大体结构。为了简单起见，我们只关注对开发应用最重要的代码部分（其余部分留给感兴趣的同学自行探索吧）。项目主要代码均存放在`entry/src/main`这个目录底下，如图，可以看到，目录下有3个子目录和一个文件。

<img src="./assets/image-20250513223421181.png" alt="image-20250513223421181" style="zoom:50%;" />

这些目录和文件主要功能如下：

* `cpp`: 存放项目的 C++ 代码，和编译所需的`CMakeLists.txt`、给ArkTS提供的接口等。
* `ets`: 存放项目的 ArkTS 代码。`ets/pages/Index.ets`可以被认为是项目的入口。
* `resources`: 存放项目的资源文件。
* `module.json5`: 该模块（`entry`）的主要配置。

> **什么是资源文件？**
>
> 移动应用中，为了安全起见（大家都不想其它不经允许，读取你的微信聊天记录吧），每个应用都运行在“沙盒”之中，只能看到自己应用需要的一小部分文件。（联系课上所学的“虚拟内存空间”，你可以认为，移动应用也有一个“虚拟文件空间”。）但应用本身就会用到许多文件，例如作为背景的图片、音效等等。为了方便应用使用这些文件，项目中会指定一个目录，专门存放这些文件，这些文件能被应用看到，称为资源文件。（这里解释其实没那么严谨，大家意会吧^_^）
>
> **什么是模块？**
>
> 一个应用其实可以有多个“模块”组成，每个模块都有自己独立的依赖库等，方便管理。我们的示例应用中只有一个模块`entry`，即应用的入口模块，你可以认为，应用一打开就会进入这个`entry`模块中`Index.ets`所描述的页面。相当于OH应用中的主进程、main函数了。

### 3.1.2 尝试调用 C++ 函数

项目中，其实已经给我们定义好了一个C++函数`Add`，和它的ArkTS接口函数`add`，功能是将两个数字相加。

> 怎么定义的？具体定义在`src/main/cpp/napi_init.cpp`这个文件中，如果你想了解，可以参考[附录D](#附录D: Native C++ 应用中 C++ 函数定义)。

相当于，只要我们在 ArkTS 代码中调用 `add` 函数，应用后台经过一系列神奇转换后，就会调用 C++ 函数 `Add` 执行运算，并返回结果。我们现在就来尝试这一点。

打开`src/ets/pages/Index.ets`，还记得阶段一中你们修改为学号的一行吗？现在，将其修改为：

```typescript
this.message = testNapi.add(2, 3).toString();
```

这里`testNapi.add(2, 3)`会调用C++函数，将两个参数相加，并返回结果`5`，而`toString`将把结果转成字符串。然后，这个字符串被赋值给`this.message`。

然后，我们运行previewer（参考阶段一），再试试应用功能吧。

> 注意，运行Previewer需要使用Release版本，即，将下图下拉框改为图中的选项（上面的entry）：
>
> <img src="./assets/image-20250513232313625.png" alt="image-20250513232313625" style="zoom:50%;" />

点击"Hello World"，文字变成如下：

<img src="./assets/image-20250513232354639.png" alt="image-20250513232354639" style="zoom:33%;" />

这样我们就成功调用了C++函数啦，欢呼~

> 我猜读到这里，大部分同学可能仍然很迷茫，我在哪里，我在干什么，这和C++有什么关系。如果这样，助教表示很抱歉。确实，这次实验涉及的背景知识过多，从 Cmake 到库的使用，从交叉编译到移动应用开发，从 OpenHarmony 到 llama.cpp 。助教已经尽力尝试让大家理解发生了什么了，如果没能做到，我们再次表示抱歉。
>
> 其实这次实验不止是操作系统，更像是一次计算机学科工具的导论，我们希望这次实验能至少激发大家对某一部分的兴趣，或者对某些工具、流程留下一些印象。如果你没有理解，没关系，也不要气馁，这不是你的错，跟着步骤做一遍实验就可以啦。作为计算机系的学生，在未来几年，实验中的很多概念、工具你还会遇到很多次，你有很多机会不断加深对它们的理解。所以，放轻松吧。
>
> 当然，如果理解了其中某些东西，我们也由衷为你感到高兴，祝贺你！
>
> 虽然说了那么多，但实验其实还没有结束，不过后续没有想让大家理解的内容啦。助教们把完整的大模型推理应用写好了（虽然很简陋），大家跟着步骤安装使用就好了。当然，我们还是会尽力尝试解释我们在其中做了什么，感兴趣的同学可以尝试了解。



## 3.2 实现 OpenHarmony 大模型推理应用

本阶段的目的是实现能在开发板上运行的大模型推理应用。即将 llama.cpp 的编译产物集成到 Demo 应用中。

理论上，根据我们两个阶段的所有前置知识，再加上一点点新知识，本阶段的任务是有可能完成的。实践中，因为背景知识过多，代码较为复杂，我们不要求大家理解具体的实现流程。我们会提供实现好的源代码，你只需要把文件夹替换掉，并按第一阶段中的方法，将项目运行到开发板上即可。

### 3.2.1 新建项目并替换代码

1. 新建 Native C++ 项目。（参考 第一阶段 3.2.1 节，项目名自定，请记住项目位置，下一步需要找到该项目。）

2. （在Windows中）打开项目所在目录，删除项目中的 `entry` 文件夹，替换为助教提供的`entry`文件夹。

   `entry`文件夹的下载方式：

   * 下载链接：https://rec.ustc.edu.cn/share/dfbc3380-2b3c-11f0-aee2-27696db61006 （选择 `第二阶段素材 -> entry.zip`）
   * 解压后替换原`entry`文件夹。

### 3.2.2 将交叉编译所需文件复制到项目中

1. 在`entry/libs`文件夹下创建`armeabi-v7a`文件夹。如下图，你可以右键`libs`，选择`New`->`Directory`，然后输入文件夹的名字。
  ![create folder](./assets/3.2.3/1.png)
2. 将 2.3.1 节中，在Ubuntu里交叉编译好的库文件，复制到`armeabi-v7a`文件夹下。注意，你需要复制`llama.cpp/build-ohos/install/libs`下所有的`.so`文件。
  
3. 类似第一步，在`entry/src/main/cpp`目录下创建`include`文件夹，将3.1.2中编译得到的头文件（.h文件）复制到该文件夹下。注意，你需要复制`llama.cpp/build-ohos/install/include`下的所有文件。
6. 构建应用并且在开发板上运行,上面输入框可以输入提示词，效果如下所示：
![alt text](./assets/Llama效果.jpg)

> 这里效果很差，原因是我们为了大家的体验，选用了特别小的Tinystory模型，该模型将会生成一个小故事，如果你对如何运行其他可以使用的模型比较感兴趣，查看附录E即可。

# 第四部分：第二阶段实验内容与检查标准

## 4.1 实验内容

1. 使用`cmake`编译`llama.cpp`第三方库，并成功用其编译并运行`llama-Demo.cpp`，能够运行并获得输出。（参考[第一部分](#第一部分：第三方库的编译与使用)。）
2. 交叉编译llama.cpp得到32位的动态链接库`libllama.so,libggml-base.so,libggml-cpu.so,libggml.so,libllama.so,libllava_shared.so`与头文件（参考[第二部分](#第二部分 通过交叉编译跨架构生成库文件)。）
3. 成功在自己的项目中，成功调用C++函数。（参考[3.1节](#3. 1 在 OpenHarmony 应用中调用 C++ 代码)。）
4. 成功在开发板上运行大模型推理应用。（参考[3.2节](#3.2 实现 OpenHarmony 大模型推理应用)。）


## 4.2 实验评分标准

本次实验共 10 分，第二阶段满分为 6 分，实验检查要求和评分标准如下：

1. 成功编译动态链接库，并运行`llama-Demo`，得到输出。（2分）
2. 成功交叉编译，得到`.so`库文件，并用`file`命令验证其架构。（2分）
3. 成功在OpenHarmony应用中调用C++函数，在previewer中，实现点击Hello World变为5的效果。（1分）
4. 成功在开发板上运行大模型推理应用。（1分）

# 附录

## 附录A: 大模型推理与 llama.cpp 简介

欢迎来到实验的AI探索部分！在本部分，我们将初步接触人工智能（AI）在端侧设备（如我们的DAYU200开发板）上进行推理的概念和实践。由于大家可能之前没有系统学习过AI，我们会从最基本的概念开始。（由于我们是操作系统课程，所以不会很详细(°°)～）

## 1.1 人工智能（AI）原理简介

你可能经常听到“人工智能”或“AI”这个词，它听起来可能很复杂，但其核心思想其实并不难理解。

### 1.1.1 什么是人工智能？

简单来说，人工智能的目标是让计算机能够像人一样思考、学习、决策和解决问题。我们希望机器能够执行那些通常需要人类智能才能完成的任务，比如识别图像、理解语言、下棋、驾驶汽车等。

### 1.1.2 机器学习 (Machine Learning, ML) - AI的核心驱动力

目前实现AI最主要和最成功的方法之一是机器学习 (ML)。与传统编程中我们明确告诉计算机每一步该怎么做不同，机器学习的核心思想是让计算机从数据中“学习”。

- 打个比方： 想象一下教一个小孩识别猫。你不会去精确描述猫的每一根胡须或毛发的数学模型，而是会给她看很多猫的图片（这些图片就是“数据”）。通过观察足够多的例子，小孩的大脑会自己总结出猫的共同特征（比如有尖耳朵、胡须、特定的脸型等——这就是“学习”或“训练模型”的过程）。之后，当你给她看一张新的、她以前没见过的猫的图片时，她也能认出来（这就是“预测”或“推理”）。
- 机器学习就是让计算机做类似的事情：我们给计算机提供大量的数据（比如成千上万张标记为“猫”或“狗”的图片），并使用特定的算法，让计算机自动从这些数据中找出规律和模式，形成一个“模型 (Model)”。

### 1.1.3 深度学习 (Deep Learning, DL) - 更强大的机器学习

深度学习是机器学习的一个分支，它使用一种叫做“人工神经网络 (Artificial Neural Networks)”的复杂数学结构，特别是包含许多层（所以叫“深度”）的神经网络。这些网络的设计灵感来源于人脑神经元的连接方式。深度学习在处理复杂数据（如图像、语音、自然语言文本）方面表现得尤其出色，近年来许多AI的突破都得益于深度学习。我们本次实验接触的语言模型就是一种基于深度学习的大语言模型。

总而言之，AI（尤其是通过机器学习和深度学习）使计算机能够通过分析数据来学习和做出智能的响应，而不仅仅是执行预先编程好的指令。

## 1.2 什么是 AI 推理 (Inference)？

在机器学习（包括深度学习）的生命周期中，通常有两个主要阶段：

1. **训练 (Training)**：

- 这是“学习”的阶段，就像前面例子里小孩看图识猫，或者学生备考学习知识的过程。
- 在这个阶段，我们会用海量的标注数据（例如，数百万张图片及其对应的标签，或者TB级的文本数据）来“喂”给一个初始的、未学习的AI模型。
- 通过特定的学习算法，模型会调整其内部参数，以使其能够对输入数据做出正确的响应（例如，正确分类图片，或理解文本的含义）。
- 训练过程通常需要非常强大的计算资源（如高性能GPU集群）和很长的时间（几天、几周甚至几个月）。
- 训练的最终产出是一个“训练好的模型 (Trained Model)” ——可以把它看作是包含了从数据中学到的所有知识和规律的“大脑”文件。

2. **推理 (Inference)**：

- 这是“使用”或“应用”的阶段，就像小孩识别一张新的猫图片，或者学生运用所学知识解答考试题目。
- 在这个阶段，我们把新的、未曾见过的数据（例如，用户上传的一张照片，或者用户输入的一段文字）输入到已经训练好的模型中。
- 模型会利用它在训练阶段学到的知识和规律，对这些新数据进行处理，并给出一个预测、判断或输出（例如，识别出照片中的物体，或者根据输入的文字生成一段新的文字）。
- 推理过程通常比训练过程快得多，对计算资源的要求也低得多，使其可以在计算能力相对较弱的设备上运行。

本实验的核心在于“推理”：我们将使用一个已经训练好的型语言模型 (TinyStory/Qwen)，并在我们的DAYU200开发板上运行它，让它对我们输入的文本进行处理并生成回应。我们不涉及模型的训练过程。

## 1.3 什么是 AI 推理框架 (Inference Framework)？

当你有了一个训练好的AI模型后，要在实际设备上高效地运行它进行推理，直接操作原始模型文件可能会非常复杂和低效。这时，AI推理框架就派上了用场。

AI推理框架是一套专门设计用来简化和优化在各种硬件平台上部署和执行已训练模型进行推理的软件工具包或库。

它的主要作用包括：

- 模型加载与解析： 能够读取和理解不同格式的训练好的模型文件（例如，TensorFlow产生的.pb文件，PyTorch的.pt文件，MindSpore的.ms文件，或者像Llama.cpp使用的.gguf格式）。
- 性能优化： 针对目标硬件（如CPU、GPU、NPU——DAYU200上就有NPU）进行深度优化，以加快推理速度、减少内存占用和降低功耗。这可能包括图优化、算子融合、量化、使用特定硬件加速指令等技术。
- 硬件抽象： 为上层应用提供统一的API接口，屏蔽底层不同硬件的差异。开发者不需要针对每种硬件都写一套不同的代码。
- 跨平台支持： 很多框架支持将模型部署到多种操作系统（Windows, Linux, Android, iOS, OpenHarmony等）和多种硬件架构上。
- 易用性： 简化了模型部署的流程，让应用开发者可以更容易地将AI能力集成到自己的应用中。

## 1.4 我们实验中接触到的推理工具/框架：

- Llama.cpp: https://github.com/ggml-org/llama.cpp

  - 这是一个非常优秀的开源项目，专门用于在CPU上高效运行Llama系列及其他大型语言模型 (LLM)。
  - 它的主要特点是用纯C/C++编写，追求极致的性能和最小的依赖，非常适合交叉编译到各种端侧设备和嵌入式系统上（比如我们的DAYU200）。
  - 它支持多种量化技术，可以将原本非常庞大的LLM模型压缩到几GB甚至几百MB，同时尽量保持较好的性能，使得在普通PC和资源受限的设备上运行LLM成为可能。
  - 在本次实验中，我们将把Llama.cpp编译成一个库，并在OpenHarmony应用中调用它来实现语言模型的推理。

- MindSpore Lite：

  - 这是华为昇思MindSpore AI计算框架的轻量化版本，专门用于在端侧设备和物联网设备上进行高效推理。
  - 我们会提供一个使用MindSpore Lite的Demo。MindSpore Lite支持多种硬件后端（CPU、GPU、以及华为自研的NPU），能够加载MindSpore训练出的模型（.ms格式）以及转换自其他框架（如TensorFlow Lite、ONNX）的模型。
  - 它提供了Java和C++等多种语言的API，方便开发者在Android、iOS、OpenHarmony等系统上集成AI能力。

可以把推理框架想象成一个高度专业的“引擎室管理员”，它知道如何最高效地启动和运行一个复杂的“AI引擎”（即训练好的模型），并确保它在特定的“船只”（即你的硬件设备）上表现最佳。



## 1.5 端侧 AI (On-Device AI)推理 与应用开发简介

### 1.5.1 什么是端侧AI推理？

“端侧AI” (On-Device AI 或 Edge AI) 指的是直接在终端用户设备（如智能手机、平板电脑、智能手表、物联网设备、或者我们实验中的DAYU200开发板）上本地执行AI模型的推理过程，而不是将数据发送到远程的云服务器进行处理。

> 这也是我们课题组的一个研究方向，欢迎感兴趣的同学联系[李永坤老师](http://staff.ustc.edu.cn/~ykli/)，然后加入我们(●'◡'●)

### 1.5.2 端侧AI推理的优势

- 低延迟 (Low Latency)： 数据处理在本地进行，无需网络传输，响应速度更快，对于需要实时反馈的应用（如实时语音识别、动态手势识别）至关重要。
- 隐私保护 (Privacy Protection)： 敏感数据（如个人照片、录音）无需上传到云端，保留在用户本地设备上，更好地保护了用户隐私。
- 离线可用 (Offline Capability)： 即使在没有网络连接或网络不稳定的情况下，AI功能依然可以正常使用。
- 节省带宽与成本 (Bandwidth & Cost Saving)： 减少了大量数据上传下载所需的网络带宽，也可能降低了对云端计算资源的依赖，从而节省成本。

> 其实最主要的是省钱💴还有隐私保护。

### 1.5.3 端侧AI推理的挑战：

- 资源限制： 端侧设备的计算能力（CPU、GPU、NPU性能）、内存、存储空间以及电池续航都远不如云服务器。
- 模型大小与效率： 需要对AI模型进行高度优化和压缩（如量化），使其能够在资源受限的设备上高效运行，同时尽量不损失太多精度。

> 在本次实验中，我们将体验到量化对模型大小和性能的影响,也会体会到内存和计算能力带来的限制。

### 1.5.4 端侧AI应用开发流程（简化版）

1. 选择或训练AI模型： 根据应用需求选择合适的预训练模型（例如，是图像分类、目标检测、还是自然语言理解）。在本次实验中，我们直接使用已经训练好的TinyStories模型。
2. 优化与量化： 对模型进行量化（如INT8量化），减小模型大小，提高在端侧设备上的运行效率。
3. 应用集成与开发：

  - 在你的应用程序代码中（对于Llama.cpp，我们将在C++层面操作），调用推理框架提供的API：
  - 加载优化后的模型文件。
  - 准备输入数据（例如，对图像进行预处理，或将用户文本编码成模型需要的格式）。
  - 执行推理，获取模型输出。
  - 对模型输出进行后处理，并呈现给用户或用于后续逻辑。

> 在本次实验中，我们将会提供完整的推理代码，同学们只需要编译出推理框架Llama.cpp的动态链接库放到项目代码中即可，如果你对推理的具体逻辑感兴趣，也可以阅读源代码来调整应用的逻辑。


<div STYLE="page-break-after: always;"></div>

## 附录B: 编写自己的库

第一部分中，我们学习了如何使用一个第三方动态链接库。同学们可能会好奇，我们如何编写自己的库，并发布给别人呢？本节附录就来简单介绍该过程。为了作为简单起见，我们将演示如何编写只包含一个函数`minus_numbers_in_lib`的库`mylib`。

为了实现该库，我们需要两个文件`mylib.cpp`和`mylib.h`，前者提供函数的实现，后者定义函数的接口。

1. 创建源代码文件：
   打开终端，创建一个名为`mylib.cpp`的文件，在该文件中编写一个简单的减法函数如下：

    ```cpp
   // 使用 extern "C" 可以防止 C++ 编译器的名称修饰 (name mangling),
   // 使得这些函数更容易被 C 语言或其他语言调用, 或者在不同 C++ 编译器间保持一致性。
   // 对于纯 C++ 内部使用, 且主程序也用同一编译器编译时, 这并非总是必需, 但作为库导出是一种良好实践。
   extern "C" {
       double minus_numbers_in_lib(double a,double b) {
           return a - b;
       }
   }
    ```

2. 为库创建头文件(mylib.h):

   在同一文件夹创建`mylib.h`，声明库中的函数:

   ```cpp
   #ifndef MYLIB_H
   #define MYLIB_H
   
   #ifdef __cplusplus
   extern "C" {
   #endif
   
   // 声明库中导出的函数
   double minus_numbers_in_lib(double a,double b)
   
   #ifdef __cplusplus
   }
   #endif
   
   #endif // MYLIB_H
   ```

3. 将源代码交叉编译为动态链接库 (.so 文件):

   使用以下命令即可：

   ```bash
   g++ -shared -fPIC mylib.cpp -o libmylib.so
   ```

   为了让其他人更方便使用你的库，你可以将该编译过程写入`Makefile`。当你的库更复杂，有着更多配置选项时，你可以编写`CMakeLists.txt`让`cmake`为你生成`Makefile`。当然，你还可以让 AI 来帮你编写`CMakeLists.txt`……（套娃中）。

   `Makefile`、`CMakeLists.txt`等的编写超出了讨论范围，你可以自行查询。

## 附录A: llama.cpp的使用

我们在实验中为了实验的体验，使用了极小的小故事文本生成模型，名字叫做[TinyStory](https://huggingface.co/afrideva/Tinystories-gpt-0.1-3m-GGUF),其由于模型太小，所以产生文本的效果有点差。

那么同学就要问了，有没有表现更好一点的模型呢？答案是：有的兄弟，有的。

我们推荐qwen2的0.5B模型（当然其他的GGUF模型也可以，不过要考虑开发板只有2G运存）。
### A.0 创建交换分区
在运行大型应用程序，尤其是像Llama.cpp这样的大语言模型时，我们可能会遇到开发板物理内存（RAM）不足的情况。为了让系统在这种情况下依然能够运行（尽管性能可能会有所下降），我们可以配置“交换分区”。

**什么是交换分区？**
交换分区 (Swap Space)，常被称为“虚拟内存”的一部分，是操作系统在硬盘或其他持久性存储设备（在DAYU200上通常是eMMC内部存储）上划分出来的一块区域。
- 工作原理： 当系统的物理内存 (RAM) 即将耗尽时，操作系统会将RAM中一些暂时不活跃的数据（称为“内存页”）临时移动到交换空间中，从而释放出物理内存给当前更需要的活动进程使用。当那些被移到交换空间的数据再次需要被访问时，操作系统会再将它们从交换空间读回到RAM中。
- 目的：
    - 扩展可用内存： 使得系统能够运行比实际物理内存更大的程序或同时运行更多的程序。
    - 防止内存溢出 (Out-Of-Memory, OOM)： 在物理内存完全用尽时，避免系统因无法分配内存而直接崩溃或杀死重要进程。

**如何创建交换分区？**

```sh
# hdc shell 进入开发板执行
cd data/llama_file

# 在2GB的dayu200上加swap交换空间
# 新建一个空的ram_ohos文件
touch ram_ohos
# 创建一个用于交换空间的文件（8GB大小的交换文件）
dd if=/dev/zero of=/data/ram_ohos bs=1G count=8
# 设置文件权限，以确保所有用户可以读写该文件：
chmod 777 /data/ram_ohos
# 将文件设置为交换空间：
mkswap /data/ram_ohos
# 启用交换空间：
swapon /data/ram_ohos
# 查看内存空间:
free -m
```

### A.1 使用qwen2的0.5B模型
> 如果你只是想要尝试一下，并不想自己构建，直接下载睿客网盘中第二阶段素材中的Demo即可（https://rec.ustc.edu.cn/share/dfbc3380-2b3c-11f0-aee2-27696db61006 中的`qwen-Demo.hap`）
1. 下载qwen2的0.5B模型，下载地址：https://huggingface.co/Qwen/Qwen2-0.5B-Instruct-GGUF/tree/main ，下载其中qwen2-0_5b-instruct-q4_0.gguf即可
2. 将其放入`entry/src/main/resources/resfile`文件夹下
3. 修改`entry/src/main/ets/pages/Index.ets`，修改其中的`modelName`变量为:
    ```js
    @State modelName: string = 'qwen2-0_5b-instruct-q4_0.gguf';
    ```
4. 重新构建应用运行即可（由于加载模型时间过长，可能会存在appfreeze导致应用闪退，这是正常现象，真正感兴趣联系助教）效果如下所示：
![alt text](./assets/效果图.jpg)

## 附录C: llama-Demo.cpp代码说明
本附录旨在简要介绍实验中提供的 llama-Demo.cpp 示例程序。这个程序是一个基于命令行的C++应用，它调用 Llama.cpp 库（即我们编译的 libllama.so）来加载一个大型语言模型（LLM），并根据用户输入的提示（prompt）进行文本推理生成。

理解这个示例程序的工作流程有助于我们了解如何通过API与第三方库进行交互，以实现复杂的功能。

### 主要函数说明
以下是对 llama-Demo.cpp 中关键函数功能的简要说明。为简洁起见，部分实现细节将用 ... 表示。

- 头文件导入
    ```cpp
    #include "llama.h" // 引入Llama.cpp库的公共头文件
    
    #include <cstdio>   // 用于标准输入输出，如printf
    #include <cstring>  // 用于字符串操作，如strcmp
    #include <string>   // 用于std::string类
    #include <vector>   // 用于std::vector类
    ```
- 打印程序使用方法与命令行参数解析
    ```cpp
    // 打印程序使用方法
    static void print_usage(int, char ** argv) {
        ...
    }
    
    // 解析命令行参数
    void ParseArgs(int argc, char** argv, 
                std::string& model_path, std::string& prompt, int& n_predict){
                    ...
    }
    ```
- 加载GGUF模型文件
    ```cpp
    llama_model* LoadModel(const std::string& model_path) {
        // 设置模型加载参数
        llama_model_params model_params = llama_model_default_params();
        // model_params.n_gpu_layers = 0; // 可设置GPU层数，0表示纯CPU。代码中是99，表示尝试全GPU。
        model_params.n_gpu_layers = 99; 
        // 加载模型
        llama_model* model = llama_model_load_from_file(model_path.c_str(), model_params);
        if (model == nullptr) {
            fprintf(stderr, "%s: error: unable to load model from '%s'\n", __func__, model_path.c_str());
            exit(1); // 加载失败则退出
        }
        printf("Model loaded successfully: %s\n", model_path.c_str());
        return model;
    }
    ```
-  对用户提示进行分词 (Tokenization)。
    ```cpp
    std::vector<llama_token> TokenizePrompt(const llama_vocab* vocab, const std::string& prompt) {
        // 先估算最大token数量，然后实际进行分词
        // llama_tokenize的参数: vocab, 输入字符串, 长度, 输出buffer, buffer大小, 是否加BOS, 是否特殊处理
        // ... (如代码中所示，先调用一次获取长度，再调用一次填充) ...
        const int n_tokens_estimated = -llama_tokenize(vocab, prompt.c_str(), prompt.size(), nullptr, 0, true, true);
        std::vector<llama_token> prompt_tokens(n_tokens_estimated);
        int n_tokens_actual = llama_tokenize(vocab, prompt.c_str(), prompt.size(), prompt_tokens.data(), prompt_tokens.size(), true, true);
    
        if (n_tokens_actual < 0 || n_tokens_actual > n_tokens_estimated ) { // 出错或数量不对
            fprintf(stderr, "%s: error: failed to tokenize the prompt or size mismatch\n", __func__);
            exit(1);
        }
        prompt_tokens.resize(n_tokens_actual); // 调整为实际token数
        return prompt_tokens;
    }
    ```
- 初始化上下文与采样器
    ```cpp
    // 初始化推理上下文(context)
    llama_context* InitializeContext(llama_model* model, int n_prompt_tokens, int n_predict) {
        llama_context_params ctx_params = llama_context_default_params();
        // 设置上下文窗口大小，必须能容纳提示和生成的最大token数
        ctx_params.n_ctx = n_prompt_tokens + n_predict; 
        ctx_params.n_batch = n_prompt_tokens; // 初始批处理大小可以设为提示的长度
        // ... 
        ctx_params.no_perf = false; // 开启性能计数
    
        llama_context* ctx = llama_init_from_model(model, ctx_params);
        if (ctx == nullptr) {
            fprintf(stderr, "%s: error: unable to create Llama context\n", __func__);
            exit(1);
        }
        return ctx;
    }
    
    // 初始化采样器(sampler)
    llama_sampler* InitializeSampler() {
        auto sparams = llama_sampler_chain_default_params();
        sparams.no_perf = false; // 开启性能计数
        // ... (可以修改sparams来调整采样策略，例如温度、top_k, top_p等) ...
        llama_sampler* smpl = llama_sampler_chain_init(sparams);
        if (smpl == nullptr) {
            fprintf(stderr, "%s: error: Failed to create sampler chain\n", __func__);
            exit(1);
        }
        // 向采样链中添加一个贪心采样器 (总是选择概率最高的token)
        // 也可以添加其他采样器，如 llama_sampler_init_top_k(), llama_sampler_init_top_p() 等
        llama_sampler_chain_add(smpl, llama_sampler_init_greedy());
        return smpl;
    }
    ```
- 文本生成函数
    ```cpp
    void GenerateTokens(std::vector<llama_token>& prompt_tokens, llama_context* ctx,
                        const llama_vocab* vocab, llama_sampler* smpl, 
                        int n_prompt /*初始提示token数*/, int n_predict /*要生成的最大token数*/) {
    
        // 1. 准备包含提示的初始批处理 (batch)
        llama_batch batch = llama_batch_get_one(prompt_tokens.data(), n_prompt, 0, 0); 
        int n_current_pos = 0; // 当前序列中已处理（解码）的token数量
    
        // 2. 主生成循环
        // 循环直到达到预测长度，或者遇到序列结束符(EOG)，或者解码失败
        // 代码中循环条件是: n_pos + batch.n_tokens < n_prompt + n_predict
        // 这里的n_pos在代码中是外部循环变量，与batch.n_tokens结合控制总长度。
        for (int n_pos = 0; n_pos + batch.n_tokens < n_prompt + n_predict; ) {
            // 2a. 解码当前批次 (处理tokens)
            // 第一次循环时，batch中是完整的prompt；后续循环时，batch中是上一步生成的单个token。
            if (llama_decode(ctx, batch) != 0) { // 返回0代表成功
                fprintf(stderr, "%s : failed to eval tokens, return code %d\n", __func__, 1);
                break; 
            }
            n_pos += batch.n_tokens; // 更新已处理的token总数
    
            // 2b. 从模型输出中采样下一个token
            llama_token new_token_id = llama_sampler_sample(smpl, ctx, -1); // -1表示从当前上下文最后一个有效token的logits采样
    
            // 2c. 检查是否是生成结束标记 (End Of Generation)
            if (llama_vocab_is_eog(vocab, new_token_id)) {
                // printf("\n[EOG]"); // 遇到结束符，停止生成
                break;
            }
    
            // 2d. 将新生成的token转换为文本并打印
            char buf[128];
            int n = llama_token_to_piece(vocab, new_token_id, buf, sizeof(buf), 0, true);
            if (n < 0) {
                fprintf(stderr, "%s: error: failed to convert token to piece\n", __func__);
            }
            std::string s(buf, n);
            printf("%s", s.c_str());
            fflush(stdout);
            // 2e. 准备下一个批处理，只包含新生成的token，用于下一次迭代
            batch = llama_batch_get_one(&new_token_id, 1);
        }
    }
    ```

## 附录D: Native C++ 应用中 C++ 函数定义

我们在正文中调用了 add 函数，号称其会调用实现在 `entry/src/main/cpp`里的加法函数。可具体怎么实现的呢？

如正文所说，项目C++相关代码，存放在`entry/src/main/cpp`目录中，查看该目录，发现目录下有名叫`napi_init.cpp`的C++文件。打开文件，内容如下（省略部分内容）：

```cpp
#include "napi/native_api.h"

static napi_value Add(napi_env env, napi_callback_info info)
{
	// ...
    return sum;
}

EXTERN_C_START
static napi_value Init(napi_env env, napi_value exports)
{
    napi_property_descriptor desc[] = {
        { "add", nullptr, Add, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}
EXTERN_C_END

// ...

```

文件里有两个奇怪的函数，一个叫`Add`，看名字是个加法，但内容很复杂，参数和返回值都看不明白。一个叫`Init`只看得出里面有一行`"add"`什么的。

实际上，这里的`Add`函数，就是我们实际调用的 C++ 函数。而`Init`函数中的下面这行，就是告诉应用，`"add"`这个`ArkTS`函数，对应到了`Add`这个C++函数。

```cpp
// 这个数组是 napi_property_descriptor 结构体数组
// 每一行代表一个ArkTS函数和C++函数的映射。其它地方我们不管，第一个"add"代表ArkTS函数的名字（字符串），第三个"Add"代表C++函数（不是字符串，而是函数名，或者相当于函数指针。）
    napi_property_descriptor desc[] = {
        { "add", nullptr, Add, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
```



再仔细看`Add`函数的内部，调用了很多`napi_`开头的函数。实际上，这些函数就是负责把`add`函数的ArkTS格式的参数，转换成C++能够读取的参数。例如：

```cpp
    double value0;
    napi_get_value_double(env, args[0], &value0);
```

这两行，将`add`函数的第一个参数（`args[0]`），转换为C++中的`double`，并存放在`value0`变量中。

而下面两行相反：

```cpp
    napi_value sum;
    napi_create_double(env, value0 + value1, &sum);
```

创建一个类型为`double`的ArkTS变量`sum`，将`value0 + value1`的值，存入`sum`中。（后续该值被返回，作为`add`函数调用的结果。）

> 如果你还好奇，这些转换是怎么进行的。你可以发现，这些函数都是`napi_`开头的，是不是和我们用的`llama_`系列函数有点像？对的，这个C++文件引用了`#include "napi/native_api.h"`这个头文件。这实际上是OpenHarmony提供的Native API库的一部分。这个C++文件，实际上就是调用了OpenHarmony SDK中的 Native API 库中的函数，实现了 C++ 变量和ArkTS变量间的转换。
>
> 至于具体转换的原理，作为库的使用者，我们是不需要掌握的。这就是调用库的好处。

实际上，只在C++中定义这个函数还不行，我们还需要在ArkTS中声明这个函数存在，这部分代码在`entry/src/main/cpp/types/libentry/Index.d.ts`文件中，只有一行：

```typescript
export const add: (a: number, b: number) => number;
```

这里是ArkTS的函数定义的语法，说明我们“导出”了一个`add`函数，有两个参数`a`和`b`，它们都是数字，函数的返回值也是数字。简单说，这行类似下面的C代码：

```c
extern const int add(int a, int b);
```

是不是理解了呢？就是定义了一个函数罢了。

这样两边都定义之后，通过NAPI库在后台的一系列操作，就能实现ArkTS应用调用C++啦！