import math
import random
import sys

import pygame


WIDTH, HEIGHT = 800, 600
FPS = 60

PADDLE_WIDTH, PADDLE_HEIGHT = 120, 16
PADDLE_SPEED = 8

BALL_RADIUS = 8
BALL_SPEED = 5

BRICK_ROWS = 6
BRICK_COLS = 10
BRICK_PADDING = 4
BRICK_OFFSET_TOP = 60
BRICK_OFFSET_LEFT = 20

BG_COLOR = (12, 12, 22)
PADDLE_COLOR = (0, 245, 212)
BALL_COLOR = (0, 245, 212)
TEXT_COLOR = (230, 230, 230)

BRICK_COLORS = [
    (255, 107, 107),
    (78, 205, 196),
    (255, 230, 109),
    (149, 225, 211),
    (221, 160, 221),
    (152, 216, 200),
]


class Paddle:
    def __init__(self):
        self.rect = pygame.Rect(
            WIDTH // 2 - PADDLE_WIDTH // 2,
            HEIGHT - 40,
            PADDLE_WIDTH,
            PADDLE_HEIGHT,
        )
        self.speed = PADDLE_SPEED

    def update_keyboard(self, keys):
        dx = 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            dx -= self.speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            dx += self.speed
        self.rect.x += dx
        if self.rect.left < 0:
            self.rect.left = 0
        if self.rect.right > WIDTH:
            self.rect.right = WIDTH

    def update_mouse(self):
        x, _ = pygame.mouse.get_pos()
        self.rect.centerx = x
        if self.rect.left < 0:
            self.rect.left = 0
        if self.rect.right > WIDTH:
            self.rect.right = WIDTH

    def reset(self):
        self.rect.x = WIDTH // 2 - PADDLE_WIDTH // 2

    def draw(self, surface):
        pygame.draw.rect(surface, PADDLE_COLOR, self.rect, border_radius=8)


class Ball:
    def __init__(self):
        self.radius = BALL_RADIUS
        self.speed = BALL_SPEED
        self.x = WIDTH // 2
        self.y = HEIGHT - 60
        self.dx = 0
        self.dy = 0
        self.reset()

    def reset(self):
        self.x = WIDTH // 2
        self.y = HEIGHT - 60
        angle = (random.random() * 0.6 - 0.3) * math.pi
        self.dx = self.speed * math.sin(angle)
        self.dy = -self.speed * math.cos(angle)

    @property
    def rect(self):
        return pygame.Rect(
            int(self.x - self.radius),
            int(self.y - self.radius),
            self.radius * 2,
            self.radius * 2,
        )

    def update(self):
        self.x += self.dx
        self.y += self.dy

        if self.x - self.radius < 0:
            self.x = self.radius
            self.dx = -self.dx
        if self.x + self.radius > WIDTH:
            self.x = WIDTH - self.radius
            self.dx = -self.dx
        if self.y - self.radius < 0:
            self.y = self.radius
            self.dy = -self.dy

    def draw(self, surface):
        pygame.draw.circle(surface, BALL_COLOR, (int(self.x), int(self.y)), self.radius)


class Brick:
    def __init__(self, x, y, w, h, color):
        self.rect = pygame.Rect(x, y, w, h)
        self.color = color
        self.alive = True

    def hit(self):
        self.alive = False

    def draw(self, surface):
        if not self.alive:
            return
        pygame.draw.rect(surface, self.color, self.rect)
        highlight = pygame.Rect(self.rect.x + 2, self.rect.y + 2, self.rect.w - 4, 4)
        pygame.draw.rect(surface, (255, 255, 255, 30), highlight)


def create_bricks():
    bricks = []
    brick_width = (
        WIDTH - BRICK_OFFSET_LEFT * 2 - BRICK_PADDING * (BRICK_COLS - 1)
    ) / BRICK_COLS
    brick_height = 22
    for row in range(BRICK_ROWS):
        for col in range(BRICK_COLS):
            x = BRICK_OFFSET_LEFT + col * (brick_width + BRICK_PADDING)
            y = BRICK_OFFSET_TOP + row * (brick_height + BRICK_PADDING)
            color = BRICK_COLORS[row % len(BRICK_COLORS)]
            bricks.append(Brick(x, y, brick_width, brick_height, color))
    return bricks


def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("벽돌깨기 - Python")
    clock = pygame.time.Clock()
    # 폰트: 한글 폰트가 없으면 기본 폰트 사용
    try:
        font = pygame.font.SysFont("malgungothic", 20)
    except Exception:
        font = pygame.font.SysFont(None, 20)

    paddle = Paddle()
    ball = Ball()
    bricks = create_bricks()

    score = 0
    lives = 3
    running = True
    game_over = False

    while running:
        clock.tick(FPS)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and game_over:
                if event.key == pygame.K_SPACE:
                    score = 0
                    lives = 3
                    game_over = False
                    bricks = create_bricks()
                    paddle.reset()
                    ball.reset()

        keys = pygame.key.get_pressed()
        if not game_over:
            paddle.update_keyboard(keys)
            if pygame.mouse.get_focused():
                paddle.update_mouse()

            ball.update()

            # 패들 충돌
            if ball.rect.colliderect(paddle.rect) and ball.dy > 0:
                hit_pos = (ball.x - paddle.rect.left) / paddle.rect.width
                angle = (hit_pos - 0.5) * 1.2
                speed = BALL_SPEED
                ball.dx = speed * math.sin(angle)
                ball.dy = -speed * math.cos(angle)
                ball.y = paddle.rect.top - ball.radius

            # 벽돌 충돌
            for brick in bricks:
                if not brick.alive:
                    continue
                if ball.rect.colliderect(brick.rect):
                    brick.hit()
                    score += 10
                    overlap_left = ball.rect.right - brick.rect.left
                    overlap_right = brick.rect.right - ball.rect.left
                    overlap_top = ball.rect.bottom - brick.rect.top
                    overlap_bottom = brick.rect.bottom - ball.rect.top
                    min_overlap = min(
                        overlap_left, overlap_right, overlap_top, overlap_bottom
                    )
                    if min_overlap in (overlap_left, overlap_right):
                        ball.dx = -ball.dx
                    if min_overlap in (overlap_top, overlap_bottom):
                        ball.dy = -ball.dy
                    break

            # 바닥 아래로 떨어짐 → 생명 감소
            if ball.y - ball.radius > HEIGHT:
                lives -= 1
                if lives <= 0:
                    game_over = True
                ball.reset()
                paddle.reset()

            # 모든 벽돌 파괴 → 새 라운드 (속도 약간 증가)
            if all(not b.alive for b in bricks):
                bricks = create_bricks()
                ball.speed += 0.5
                ball.reset()

        # 그리기
        screen.fill(BG_COLOR)

        for brick in bricks:
            brick.draw(screen)
        paddle.draw(screen)
        ball.draw(screen)

        score_surf = font.render(f"점수: {score}", True, TEXT_COLOR)
        lives_surf = font.render(f"생명: {lives}", True, TEXT_COLOR)
        screen.blit(score_surf, (20, 20))
        screen.blit(lives_surf, (WIDTH - lives_surf.get_width() - 20, 20))

        if game_over:
            msg = "게임 오버 - 스페이스바로 다시 시작"
            title = font.render(msg, True, TEXT_COLOR)
            screen.blit(
                title,
                (
                    WIDTH // 2 - title.get_width() // 2,
                    HEIGHT // 2 - title.get_height() // 2,
                ),
            )

        pygame.display.flip()

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()