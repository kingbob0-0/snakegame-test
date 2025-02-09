let cellSize = 20;            // 격자 셀 크기
let snake;                    // 뱀(지렁이)의 몸통(각 세그먼트는 p5.Vector)
let food;                     // 음식의 위치 (p5.Vector)
let obstacles = [];           // 장애물 목록 (Obstacle 클래스 객체들)

let direction;                // 이동 방향 ("LEFT", "UP", "RIGHT", "DOWN")
let gameOver = false;         // 게임 오버 상태 여부
let score = 0;                // 스코어 (먹은 음식 수)
let startTime;                // 게임 시작 시각 (millis)

let snakeColor, foodColor, obstacleColor; // 각 객체의 색상

let baseObstacleCount = 5;    // 기본 장애물 갯수 (스코어에 따라 증가)
let currentSpeed = 10;        // 시작 프레임 속도
let movingObstacleChance = 0.05; // 움직이는 장애물 확률 (5%)

let stars = [];               // 우주 배경의 별 정보 배열

function setup() {
  createCanvas(600, 600);
  // 별 생성 (우주 배경)
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3)
    });
  }
  frameRate(currentSpeed);
  resetGame();
}

function draw() {
  // 우주 느낌의 배경: 검은색에 별들 그리기
  background(0);
  noStroke();
  fill(255);
  for (let star of stars) {
    ellipse(star.x, star.y, star.size, star.size);
  }
  
  if (!gameOver) {
    // 좌측 상단에 시간과 스코어 표시 (텍스트가 모두 보이도록)
    let elapsedTime = floor((millis() - startTime) / 1000);
    textAlign(LEFT, TOP);
    textSize(20);
    fill(255);
    text("Time: " + elapsedTime + "s", 10, 10);
    text("Score: " + score, 10, 35);
    
    // 음식이 랜덤하게 움직이도록 업데이트
    updateFood();

    // 뱀 이동 및 업데이트
    moveSnake();
    
    // 움직이는 장애물이 있다면 업데이트
    updateObstacles();

    // 자기 자신과의 충돌 검사
    checkSelfCollision();

    // 장애물과의 충돌 검사
    checkObstacleCollision();

    // 음식 그리기 (음식 색상)
    fill(foodColor);
    rect(food.x, food.y, cellSize, cellSize);

    // 장애물 그리기 (장애물 색상)
    fill(obstacleColor);
    for (let obs of obstacles) {
      rect(obs.pos.x, obs.pos.y, cellSize, cellSize);
    }

    // 뱀 그리기 (뱀 색상)
    fill(snakeColor);
    for (let segment of snake) {
      rect(segment.x, segment.y, cellSize, cellSize);
    }
    
  } else {
    // 게임 오버 화면
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(30);
    text("GAME OVER!\nPress SPACE to restart", width / 2, height / 2);
  }
}

function keyPressed() {
  // 방향키로 이동 방향 전환 (반대 방향으로의 회귀 방지)
  if (keyCode === UP_ARROW && direction !== "DOWN") direction = "UP";
  else if (keyCode === DOWN_ARROW && direction !== "UP") direction = "DOWN";
  else if (keyCode === LEFT_ARROW && direction !== "RIGHT") direction = "LEFT";
  else if (keyCode === RIGHT_ARROW && direction !== "LEFT") direction = "RIGHT";

  // 게임 오버 시 SPACE 키로 게임 재시작
  if (key === ' ' && gameOver) {
    resetGame();
  }
}

// 게임 초기화 함수
function resetGame() {
  // 뱀 초기화: 시작은 캔버스 중앙에 한 개의 세그먼트로 시작
  snake = [createVector(width / 2, height / 2)];
  direction = "DOWN";
  score = 0;
  startTime = millis();
  
  // 장애물과 속도 초기화
  currentSpeed = 10;
  frameRate(currentSpeed);
  
  // 색상 무작위 지정 (서로 겹치지 않도록)
  snakeColor = pickRandomColor();
  foodColor = pickRandomDistinctColor(snakeColor);
  obstacleColor = pickRandomDistinctColor(snakeColor, foodColor);
  
  spawnFood();
  spawnObstacles(baseObstacleCount);
  gameOver = false;
}

// 뱀 이동 함수
function moveSnake() {
  let head = snake[0].copy();

  // 현재 방향에 따라 머리 위치 변경
  switch (direction) {
    case "LEFT":  head.x -= cellSize; break;
    case "UP":    head.y -= cellSize; break;
    case "RIGHT": head.x += cellSize; break;
    case "DOWN":  head.y += cellSize; break;
  }

  // 랩 어라운드: 캔버스 밖으로 나가면 반대쪽에서 나타남
  head.x = (head.x + width) % width;
  head.y = (head.y + height) % height;

  // 새 머리를 뱀 배열 앞에 추가
  snake.unshift(head);

  // 음식 먹었는지 확인 (좌표가 일치하면)
  if (head.x === food.x && head.y === food.y) {
    // 먹으면 길이 1 증가
    growSnake(1);
    score++;
    spawnFood();
    
    // 점수가 늘어날수록 장애물 갯수를 증가 (기본갯수 + 스코어)
    spawnObstacles(baseObstacleCount + score);
    
    // 게임 속도 증가
    currentSpeed += 0.5;
    frameRate(currentSpeed);
  } else {
    // 음식 먹지 않았다면 꼬리 제거 (움직임 효과)
    snake.pop();
  }
}

// 장애물 업데이트: 움직이는 장애물이 있다면 위치 업데이트
function updateObstacles() {
  for (let obs of obstacles) {
    obs.update();
  }
}

// 음식이 일정 주기로 랜덤하게 움직이도록 업데이트 (30 프레임마다)
function updateFood() {
  if (frameCount % 30 === 0) {
    let dirs = [
      createVector(-cellSize, 0),
      createVector(cellSize, 0),
      createVector(0, -cellSize),
      createVector(0, cellSize),
      createVector(0, 0)  // 가만히 있을 확률도 포함
    ];
    let d = random(dirs);
    food.add(d);
    // 랩 어라운드 적용
    food.x = (food.x + width) % width;
    food.y = (food.y + height) % height;
  }
}

// 음식을 랜덤한 격자 위치에 생성
function spawnFood() {
  food = createVector(floor(random(width / cellSize)) * cellSize,
                      floor(random(height / cellSize)) * cellSize);
}

// 장애물 생성: count 매개변수에 따라 count개의 장애물 생성
function spawnObstacles(count) {
  obstacles = [];
  for (let i = 0; i < count; i++) {
    let ox = floor(random(width / cellSize)) * cellSize;
    let oy = floor(random(height / cellSize)) * cellSize;
    
    // 뱀의 몸이나 음식 위치와 겹치면 재생성
    if (snake.some(seg => seg.x === ox && seg.y === oy) ||
        (food.x === ox && food.y === oy)) {
      i--;
      continue;
    }
    
    // 5% 확률로 움직이는 장애물, 나머지는 정지 장애물
    let moving = random() < movingObstacleChance;
    let dir = floor(random(4)); // 0:LEFT, 1:UP, 2:RIGHT, 3:DOWN
    obstacles.push(new Obstacle(ox, oy, moving, dir));
  }
}

// 뱀의 머리가 자신의 몸과 충돌하는지 검사
function checkSelfCollision() {
  let head = snake[0];
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver = true;
      break;
    }
  }
}

// 뱀의 머리가 장애물과 충돌하는지 검사
function checkObstacleCollision() {
  let head = snake[0];
  for (let obs of obstacles) {
    if (head.x === obs.pos.x && head.y === obs.pos.y) {
      gameOver = true;
      break;
    }
  }
}

// 뱀을 n세그먼트 만큼 늘림 (여기서는 항상 n=1)
function growSnake(n) {
  for (let i = 0; i < n; i++) {
    // 뱀의 마지막 세그먼트를 복사하여 추가
    snake.push(snake[snake.length - 1].copy());
  }
}

//
// 장애물 클래스 (정지형 및 움직이는 장애물 지원)
//
class Obstacle {
  constructor(x, y, moving, direction) {
    this.pos = createVector(x, y);
    this.isMoving = moving;
    this.direction = direction; // 0:LEFT, 1:UP, 2:RIGHT, 3:DOWN
  }
  
  update() {
    if (!this.isMoving) return;
    
    switch (this.direction) {
      case 0: this.pos.x -= cellSize; break;
      case 1: this.pos.y -= cellSize; break;
      case 2: this.pos.x += cellSize; break;
      case 3: this.pos.y += cellSize; break;
    }
    
    // 랩 어라운드 적용
    this.pos.x = (this.pos.x + width) % width;
    this.pos.y = (this.pos.y + height) % height;
  }
}

//
// 유틸리티: 서로 겹치지 않는 무작위 색상 선택
//
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
