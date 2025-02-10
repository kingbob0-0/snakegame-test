let cellSize = 20;            // 격자 셀 크기
let snake;                    // 뱀의 몸통 (p5.Vector 배열)
let food;                     // 음식의 위치 (p5.Vector)
let obstacles = [];           // 장애물 목록 (Obstacle 객체들)
let direction;                // 이동 방향 ("LEFT", "UP", "RIGHT", "DOWN")
let gameOver = false;         // 게임 오버 상태 여부
let score = 0;                // 스코어 (먹은 음식 수에 따라 100점씩)
let startTime;                // 게임 시작 시각 (millis)
let snakeColor, foodColor, obstacleColor; // 색상 변수
let baseObstacleCount = 5;    // 기본 장애물 갯수
let currentSpeed = 10;        // 시작 프레임 속도
let movingObstacleChance = 0.05; // 움직이는 장애물 확률 (5%)
let stars = [];               // 별 정보 배열

let leaderboard = [];         // 리더보드 (메모리 상 저장)
let leaderboardUpdated = false;  // 게임 오버 후 리더보드 업데이트 여부
let leaderboardDiv;           // HTML 리더보드 표시 div

// 게임 시작 전 화면을 위한 DOM 요소들
let gameStarted = false;
let startButton;
let titleElem;

function setup() {
  // 캔버스 생성 및 중앙 배치 (600x600)
  let cnv = createCanvas(600, 600);
  cnv.position((windowWidth - width) / 2, 50);
  
  // 리더보드 div 생성 및 캔버스 아래에 배치
  leaderboardDiv = createDiv('');
  leaderboardDiv.id('leaderboard');
  leaderboardDiv.style('text-align', 'center');
  leaderboardDiv.style('font-size', '20px');
  leaderboardDiv.style('color', 'white');
  leaderboardDiv.position((windowWidth - width) / 2, height + 60);
  
  // 배경 별 생성
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3)
    });
  }
  
  frameRate(currentSpeed);
  
  // 게임 시작 전, 캔버스 중앙에 제목과 시작 버튼 생성
  titleElem = createElement('h1', 'SNAKE GAME');
  titleElem.style('font-family', 'Arial, sans-serif');
  titleElem.style('font-size', '50px');
  titleElem.style('color', 'white');
  // 캔버스 너비와 동일한 폭, 중앙 정렬
  titleElem.style('width', width + 'px');
  titleElem.style('text-align', 'center');
  // 캔버스 중앙보다 약간 위쪽에 제목 배치
  titleElem.position(cnv.position().x, cnv.position().y + height / 2 - 150);
  
  startButton = createButton("GAME START");
  startButton.style('font-family', 'Arial, sans-serif');
  startButton.style('font-size', '30px');
  startButton.style('padding', '10px 20px');
  // 버튼의 고정 폭 200px, 중앙 정렬 효과를 위해 계산
  startButton.style('width', '200px');
  // 버튼은 제목보다 약간 아래쪽에 배치하여 충분한 간격 확보
  startButton.position(cnv.position().x + (width - 200) / 2, cnv.position().y + height / 2 + 10);
  startButton.mousePressed(startGame);
}

function draw() {
  // 게임 시작 전에는 배경만 그리고 DOM 요소(제목, 버튼)는 그대로 보임
  if (!gameStarted) {
    background(0);
    return;
  }
  
  // 게임이 시작된 후의 실행 부분
  background(0);
  noStroke();
  fill(255);
  for (let star of stars) {
    ellipse(star.x, star.y, star.size, star.size);
  }
  
  if (!gameOver) {
    // 시간과 스코어 표시 (기본 좌측 상단)
    let elapsedTime = floor((millis() - startTime) / 1000);
    textAlign(LEFT, TOP);
    textSize(20);
    fill(255);
    text("Time: " + elapsedTime + "s", 10, 10);
    text("Score: " + score, 10, 35);
    
    updateFood();
    moveSnake();
    updateObstacles();
    checkSelfCollision();
    checkObstacleCollision();
    
    // 음식 그리기 (별 모양)
    fill(foodColor);
    // 음식의 중심에 별을 그림: 내측 반지름 = cellSize/4, 외측 반지름 = cellSize/2, 포인트 5개
    drawStar(food.x + cellSize / 2, food.y + cellSize / 2, cellSize / 4, cellSize / 2, 5);
    
    // 장애물 그리기
    fill(obstacleColor);
    for (let obs of obstacles) {
      rect(obs.pos.x, obs.pos.y, cellSize, cellSize);
    }
    
    // 뱀 그리기
    fill(snakeColor);
    for (let segment of snake) {
      rect(segment.x, segment.y, cellSize, cellSize);
    }
    
    // 게임 중일 때는 리더보드 div 비워두기
    leaderboardDiv.html("");
    
  } else {
    // 게임 오버 시, 중앙에 GAME OVER 메시지 표시 (Arial 폰트)
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(30);
    text("GAME OVER!\nPress SPACE to restart", width / 2, height / 2 - 40);
    
    if (!leaderboardUpdated) {
      updateLeaderboard();
      leaderboardUpdated = true;
      updateLeaderboardDiv();
    }
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW && direction !== "DOWN") direction = "UP";
  else if (keyCode === DOWN_ARROW && direction !== "UP") direction = "DOWN";
  else if (keyCode === LEFT_ARROW && direction !== "RIGHT") direction = "LEFT";
  else if (keyCode === RIGHT_ARROW && direction !== "LEFT") direction = "RIGHT";
  
  if (key === ' ' && gameOver) {
    resetGame();
  }
}

function startGame() {
  gameStarted = true;
  startButton.hide();
  titleElem.hide();
  resetGame();
}

function resetGame() {
  snake = [createVector(width / 2, height / 2)];
  direction = "DOWN";
  score = 0;
  startTime = millis();
  currentSpeed = 10;
  frameRate(currentSpeed);
  
  // 고정된 색상 지정 (사용자에게 보기 편한 색상)
  snakeColor = color(50, 205, 50);      // LimeGreen
  foodColor = color(220, 20, 60);         // Crimson
  obstacleColor = color(255, 140, 0);     // DarkOrange
  
  spawnFood();
  spawnObstacles(baseObstacleCount);
  gameOver = false;
  leaderboardUpdated = false;
}

function moveSnake() {
  let head = snake[0].copy();
  switch (direction) {
    case "LEFT":  head.x -= cellSize; break;
    case "UP":    head.y -= cellSize; break;
    case "RIGHT": head.x += cellSize; break;
    case "DOWN":  head.y += cellSize; break;
  }
  head.x = (head.x + width) % width;
  head.y = (head.y + height) % height;
  snake.unshift(head);
  
  // 음식(별)을 먹었을 때는 꼬리를 제거하지 않아 뱀의 길이가 1칸 늘어남.
  // (원래는 growSnake(1)을 호출하여 추가로 늘어나던 부분을 제거함)
  if (head.x === food.x && head.y === food.y) {
    score += 100;
    spawnFood();
    // 장애물 갯수는 기본 장애물 수 + (먹은 음식 개수)로 계산 (score/100)
    spawnObstacles(baseObstacleCount + floor(score / 100));
    currentSpeed += 0.5;
    frameRate(currentSpeed);
  } else {
    snake.pop();
  }
}

function updateObstacles() {
  for (let obs of obstacles) {
    obs.update();
  }
}

function updateFood() {
  if (frameCount % 30 === 0) {
    let dirs = [
      createVector(-cellSize, 0),
      createVector(cellSize, 0),
      createVector(0, -cellSize),
      createVector(0, cellSize),
      createVector(0, 0)  // 가만히 있을 확률 포함
    ];
    let d = random(dirs);
    food.add(d);
    food.x = (food.x + width) % width;
    food.y = (food.y + height) % height;
  }
}

function spawnFood() {
  food = createVector(floor(random(width / cellSize)) * cellSize,
                      floor(random(height / cellSize)) * cellSize);
}

function spawnObstacles(count) {
  obstacles = [];
  for (let i = 0; i < count; i++) {
    let ox = floor(random(width / cellSize)) * cellSize;
    let oy = floor(random(height / cellSize)) * cellSize;
    
    if (snake.some(seg => seg.x === ox && seg.y === oy) ||
        (food.x === ox && food.y === oy)) {
      i--;
      continue;
    }
    
    let moving = random() < movingObstacleChance;
    let dir = floor(random(4)); // 0:LEFT, 1:UP, 2:RIGHT, 3:DOWN
    obstacles.push(new Obstacle(ox, oy, moving, dir));
  }
}

function checkSelfCollision() {
  let head = snake[0];
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver = true;
      break;
    }
  }
}

function checkObstacleCollision() {
  let head = snake[0];
  for (let obs of obstacles) {
    if (head.x === obs.pos.x && head.y === obs.pos.y) {
      gameOver = true;
      break;
    }
  }
}

// 기존 growSnake 함수는 더 이상 사용하지 않으므로 남겨두거나 제거할 수 있습니다.
function growSnake(n) {
  for (let i = 0; i < n; i++) {
    snake.push(snake[snake.length - 1].copy());
  }
}

class Obstacle {
  constructor(x, y, moving, direction) {
    this.pos = createVector(x, y);
    this.isMoving = moving;
    this.direction = direction;
  }
  
  update() {
    if (!this.isMoving) return;
    
    switch (this.direction) {
      case 0: this.pos.x -= cellSize; break;
      case 1: this.pos.y -= cellSize; break;
      case 2: this.pos.x += cellSize; break;
      case 3: this.pos.y += cellSize; break;
    }
    
    this.pos.x = (this.pos.x + width) % width;
    this.pos.y = (this.pos.y + height) % height;
  }
}

function pickRandomColor() {
  return color(random(255), random(255), random(255));
}

function pickRandomDistinctColor(c1, c2 = null) {
  let c;
  do {
    c = pickRandomColor();
  } while (c === c1 || c === c2);
  return c;
}

function updateLeaderboard() {
  leaderboard.push(score);
  leaderboard.sort((a, b) => b - a);
  if (leaderboard.length > 3) {
    leaderboard = leaderboard.slice(0, 3);
  }
  localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard));
}

function updateLeaderboardDiv() {
  let leaderboardHTML = "<h3>Leaderboard</h3>";
  leaderboardHTML += "<p>1등: " + (leaderboard[0] !== undefined ? leaderboard[0] : 0) + "</p>";
  leaderboardHTML += "<p>2등: " + (leaderboard[1] !== undefined ? leaderboard[1] : 0) + "</p>";
  leaderboardHTML += "<p>3등: " + (leaderboard[2] !== undefined ? leaderboard[2] : 0) + "</p>";
  leaderboardDiv.html(leaderboardHTML);
}

function drawStar(x, y, innerRadius, outerRadius, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * outerRadius;
    let sy = y + sin(a) * outerRadius;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * innerRadius;
    sy = y + sin(a + halfAngle) * innerRadius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}
