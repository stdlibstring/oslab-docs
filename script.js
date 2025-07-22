class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        
        this.bindEvents();
        this.generateFood();
        this.loadHighScore();
        this.draw();
    }
    
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            const key = e.key.toLowerCase();
            
            // 防止蛇反向移动
            if ((key === 'w' || key === 'arrowup') && this.dy !== 1) {
                this.dx = 0;
                this.dy = -1;
            } else if ((key === 's' || key === 'arrowdown') && this.dy !== -1) {
                this.dx = 0;
                this.dy = 1;
            } else if ((key === 'a' || key === 'arrowleft') && this.dx !== 1) {
                this.dx = -1;
                this.dy = 0;
            } else if ((key === 'd' || key === 'arrowright') && this.dx !== -1) {
                this.dx = 1;
                this.dy = 0;
            } else if (key === ' ' || key === 'p') {
                this.togglePause();
            }
        });
        
        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('saveScore').addEventListener('click', () => this.saveScore());
        document.getElementById('showLeaderboard').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('closeLeaderboard').addEventListener('click', () => this.hideLeaderboard());
        
        // 游戏结束界面的回车键
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveScore();
            }
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.updateScore();
        this.generateFood();
        this.hideGameOver();
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseBtn').textContent = this.gamePaused ? '继续' : '暂停';
        
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }
    
    restartGame() {
        this.hideGameOver();
        this.startGame();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        setTimeout(() => {
            this.clearCanvas();
            this.moveSnake();
            this.drawFood();
            this.drawSnake();
            
            this.gameLoop();
        }, 150);
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#f0f8ff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格线
        this.ctx.strokeStyle = '#e6f3ff';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    moveSnake() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // 检查撞墙
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // 检查撞到自己
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.generateFood();
        } else {
            this.snake.pop();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#2d5016' : '#4CAF50';
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            // 蛇头眼睛
            if (index === 0) {
                this.ctx.fillStyle = '#fff';
                const eyeSize = 3;
                const eyeOffset = 6;
                
                if (this.dx === 1) { // 向右
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset + 6, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset + 6, segment.y * this.gridSize + 13, eyeSize, eyeSize);
                } else if (this.dx === -1) { // 向左
                    this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 13, eyeSize, eyeSize);
                } else if (this.dy === -1) { // 向上
                    this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                } else if (this.dy === 1) { // 向下
                    this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 13, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 13, eyeSize, eyeSize);
                } else { // 默认眼睛位置
                    this.ctx.fillRect(segment.x * this.gridSize + 4, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 4, eyeSize, eyeSize);
                }
            }
        });
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }
    
    drawFood() {
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4,
            this.gridSize - 4
        );
        
        // 食物装饰
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 5,
            this.food.y * this.gridSize + 5,
            3,
            3
        );
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        const highScore = this.getHighScore();
        if (this.score > highScore) {
            this.saveHighScore(this.score);
            document.getElementById('highScore').textContent = this.score;
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.gamePaused = false;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '暂停';
        
        document.getElementById('finalScore').textContent = this.score;
        this.showGameOver();
    }
    
    showGameOver() {
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('playerName').focus();
    }
    
    hideGameOver() {
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('playerName').value = '';
    }
    
    saveScore() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('请输入您的姓名');
            return;
        }
        
        const leaderboard = this.getLeaderboard();
        leaderboard.push({
            name: playerName,
            score: this.score,
            date: new Date().toLocaleDateString('zh-CN')
        });
        
        // 按分数排序并保留前10名
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.splice(10);
        
        this.saveLeaderboard(leaderboard);
        this.hideGameOver();
        
        alert('分数已保存!');
    }
    
    showLeaderboard() {
        const leaderboard = this.getLeaderboard();
        const listContainer = document.getElementById('leaderboardList');
        
        if (leaderboard.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #718096;">暂无排行榜数据</p>';
        } else {
            listContainer.innerHTML = leaderboard.map((entry, index) => `
                <div class="leaderboard-item">
                    <div>
                        <span style="margin-right: 10px;">${index + 1}.</span>
                        <span class="player-name">${entry.name}</span>
                        <small style="color: #718096; margin-left: 10px;">${entry.date}</small>
                    </div>
                    <span class="player-score">${entry.score}</span>
                </div>
            `).join('');
        }
        
        document.getElementById('leaderboard').classList.remove('hidden');
    }
    
    hideLeaderboard() {
        document.getElementById('leaderboard').classList.add('hidden');
    }
    
    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore') || '0');
    }
    
    saveHighScore(score) {
        localStorage.setItem('snakeHighScore', score.toString());
    }
    
    loadHighScore() {
        const highScore = this.getHighScore();
        document.getElementById('highScore').textContent = highScore;
    }
    
    getLeaderboard() {
        const data = localStorage.getItem('snakeLeaderboard');
        return data ? JSON.parse(data) : [];
    }
    
    saveLeaderboard(leaderboard) {
        localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
    }
    
    draw() {
        this.clearCanvas();
        this.drawFood();
        this.drawSnake();
    }
}

// 初始化游戏
let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new SnakeGame();
    
    // 添加触摸支持（移动端）
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!game.gameRunning || game.gamePaused) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && game.dx !== -1) {
                    // 向右滑动
                    game.dx = 1;
                    game.dy = 0;
                } else if (deltaX < 0 && game.dx !== 1) {
                    // 向左滑动
                    game.dx = -1;
                    game.dy = 0;
                }
            }
        } else {
            // 垂直滑动
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && game.dy !== -1) {
                    // 向下滑动
                    game.dx = 0;
                    game.dy = 1;
                } else if (deltaY < 0 && game.dy !== 1) {
                    // 向上滑动
                    game.dx = 0;
                    game.dy = -1;
                }
            }
        }
    });
    
    // 防止默认的触摸行为
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
});