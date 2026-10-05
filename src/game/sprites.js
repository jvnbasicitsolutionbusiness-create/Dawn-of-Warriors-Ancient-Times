export function createSpriteSheet(kind = "guardian", palette = ["#416d7b", "#d3b98a"], frames = 4, size = 128) {
  const canvas =
    typeof document !== "undefined"
      ? document.createElement("canvas")
      : typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(size, size)
        : null;
  const frameWidth = Math.ceil(size / frames);
  const frameHeight = size;
  const sheet = {
    canvas,
    frames,
    width: size,
    height: size,
    frameWidth,
    frameHeight,
    kind,
    palette,
  };

  if (!canvas) return sheet;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sheet;

  ctx.clearRect(0, 0, size, size);
  const body = palette[0];
  const accent = palette[1];

  for (let frame = 0; frame < frames; frame++) {
    const x = frame * frameWidth;
    const offset = (frame % 2) * 4 - 2;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x + 28, size - 12, 22, 8);
    ctx.fillStyle = body;
    ctx.fillRect(x + 28 + offset, 36, 24, 38);
    ctx.fillStyle = accent;
    ctx.fillRect(x + 26 + offset, 24, 28, 12);
    ctx.fillStyle = "#f0d9b6";
    ctx.beginPath();
    ctx.arc(x + 40 + offset, 18, 8, 0, Math.PI * 2);
    ctx.fill();

    if (kind === "archer") {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 48 + offset, 44);
      ctx.lineTo(x + 62 + offset, 36);
      ctx.stroke();
    }

    if (kind === "cavalry") {
      ctx.fillStyle = body;
      ctx.fillRect(x + 20 + offset, 52, 36, 10);
      ctx.fillStyle = accent;
      ctx.fillRect(x + 52 + offset, 56, 10, 18);
    }

    if (kind === "guardian") {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 32 + offset, 76);
      ctx.lineTo(x + 48 + offset, 62);
      ctx.lineTo(x + 58 + offset, 76);
      ctx.stroke();
    }
  }

  return sheet;
}
