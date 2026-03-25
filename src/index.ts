import { createInitialState, getCanvas, getContext2D, resizeCanvas } from "./state.js";
import { draw } from "./render.js";
import { resetGame, update } from "./update.js";

const canvas = getCanvas();
const ctx = getContext2D(canvas);
const game = createInitialState(canvas);

function loop(time: number): void {
  update(game, canvas, time);
  draw(ctx, canvas, game);
  requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
  resizeCanvas(canvas, game);
});

window.addEventListener("keydown", (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  if (event.key === "ArrowLeft" || key === "a") {
    game.input.left = true;
  } else if (event.key === "ArrowRight" || key === "d") {
    game.input.right = true;
  } else if (key === "r" && game.phase === "gameover") {
    resetGame(game, canvas);
  }
});

window.addEventListener("keyup", (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  if (event.key === "ArrowLeft" || key === "a") {
    game.input.left = false;
  } else if (event.key === "ArrowRight" || key === "d") {
    game.input.right = false;
  }
});

resizeCanvas(canvas, game);
resetGame(game, canvas);
requestAnimationFrame(loop);
