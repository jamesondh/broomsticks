import { DIMENSIONS } from "../constants";
import type { Team, Score, GoalEvent, GameConfig } from "../types";
import type { Person } from "../entities/Person";
import type { Ball } from "../entities/Ball";

/**
 * Check if a ball has been scored in a goal.
 * Returns the scoring team or null if no goal.
 */
export function checkGoal(
  ball: Ball,
  holder: Person | null,
  config: GameConfig
): Team | null {
  // Ball must be caught and alive
  if (!ball.caught || !ball.alive || !holder) {
    return null;
  }

  const goalY = DIMENSIONS.BASKET_Y;
  const goalRadius = config.goalDetectionRadius;

  // Check if ball is at goal height
  const dy = ball.y - goalY;
  if (Math.abs(dy) >= goalRadius) {
    return null;
  }

  // Left basket (team 1 scores here)
  const leftBasketX = DIMENSIONS.BASKET_LEFT_X;
  if (holder.x < leftBasketX && holder.team === 1) {
    return 1; // Right team scored
  }

  // Right basket (team 0 scores here)
  const rightBasketX = config.fieldWidth - DIMENSIONS.BASKET_RIGHT_X_OFFSET;
  if (holder.x > rightBasketX - holder.width && holder.team === 0) {
    return 0; // Left team scored
  }

  return null;
}

/**
 * Check all balls for goals and return goal events.
 */
export function checkAllGoals(
  players: Person[],
  balls: Ball[],
  config: GameConfig
): GoalEvent[] {
  const events: GoalEvent[] = [];

  for (const ball of balls) {
    if (!ball.caught || ball.caughtByIndex === null || !ball.alive) continue;

    const holder = players[ball.caughtByIndex];
    if (!holder) continue;

    const scoringTeam = checkGoal(ball, holder, config);
    if (scoringTeam !== null) {
      events.push({
        team: scoringTeam,
        points: ball.getPointValue(config),
        ballType: ball.type,
      });
    }
  }

  return events;
}

/**
 * Apply goal events to score and reset balls.
 */
export function applyGoals(
  events: GoalEvent[],
  score: Score,
  balls: Ball[],
  players: Person[]
): Score {
  const newScore = { ...score };

  for (const event of events) {
    // Add points to scoring team
    if (event.team === 0) {
      newScore.left += event.points;
    } else {
      newScore.right += event.points;
    }

    // Reset scored balls
    for (const ball of balls) {
      if (ball.type === event.ballType && ball.caught) {
        // Clear holder's ball reference
        if (ball.caughtByIndex !== null) {
          players[ball.caughtByIndex].heldBallIndex = null;
        }
        ball.reset();
      }
    }
  }

  return newScore;
}

/**
 * Check if a team has won.
 */
export function checkWinCondition(
  score: Score,
  config: GameConfig
): Team | null {
  if (score.left >= config.winScore) {
    return 0; // Left team wins
  }
  if (score.right >= config.winScore) {
    return 1; // Right team wins
  }
  return null;
}

/**
 * Create initial score state.
 */
export function createScore(): Score {
  return { left: 0, right: 0 };
}

/**
 * Get which team currently has possession (for basket highlighting).
 * Returns 0 for left team, 1 for right team, null for no possession.
 */
export function getTeamWithPossession(
  players: Person[],
  balls: Ball[]
): Team | null {
  // Find the red ball (main scoring ball)
  const redBall = balls.find((b) => b.type === "red" && b.caught);
  if (!redBall || redBall.caughtByIndex === null) {
    return null;
  }

  const holder = players[redBall.caughtByIndex];
  return holder?.team ?? null;
}
