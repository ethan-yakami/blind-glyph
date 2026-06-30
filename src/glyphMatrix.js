export function getMatrixBounds(matrix) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < (matrix[y]?.length ?? 0); x += 1) {
      if (!matrix[y][x]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (!Number.isFinite(minX)) {
    return null;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function fitBoundsIntoBox({ bounds, boardSize, targetRatio = 0.72 }) {
  const targetSize = boardSize * targetRatio;
  const scale = Math.min(targetSize / bounds.width, targetSize / bounds.height);
  const destWidth = bounds.width * scale;
  const destHeight = bounds.height * scale;

  return {
    sourceX: bounds.minX,
    sourceY: bounds.minY,
    sourceWidth: bounds.width,
    sourceHeight: bounds.height,
    destX: (boardSize - destWidth) / 2,
    destY: (boardSize - destHeight) / 2,
    destWidth,
    destHeight,
  };
}

function createMatrixFromCanvas(canvas, threshold = 12) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const matrix = Array.from({ length: canvas.height }, () => Array(canvas.width).fill(false));
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      matrix[y][x] = image[(y * canvas.width + x) * 4 + 3] > threshold;
    }
  }
  return matrix;
}

function drawRawGlyph(char, boardSize) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = boardSize;
  canvas.height = boardSize;

  ctx.clearRect(0, 0, boardSize, boardSize);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(boardSize * 0.98)}px "SimHei", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`;
  ctx.fillText(char, boardSize / 2, boardSize / 2);
  return canvas;
}

export function createGlyphMatrix({ char, boardSize, targetRatio = 0.82 }) {
  if (char === '象剪影') {
    return createElephantMatrix({ boardSize });
  }

  const rawCanvas = drawRawGlyph(char, boardSize);
  const rawMatrix = createMatrixFromCanvas(rawCanvas);
  const bounds = getMatrixBounds(rawMatrix);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = boardSize;
  canvas.height = boardSize;

  if (bounds) {
    const fit = fitBoundsIntoBox({ bounds, boardSize, targetRatio });
    ctx.drawImage(
      rawCanvas,
      fit.sourceX,
      fit.sourceY,
      fit.sourceWidth,
      fit.sourceHeight,
      fit.destX,
      fit.destY,
      fit.destWidth,
      fit.destHeight,
    );
  }

  return {
    matrix: createMatrixFromCanvas(canvas),
    canvas,
  };
}

function createElephantMatrix({ boardSize }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = boardSize;
  canvas.height = boardSize;

  const scale = boardSize / 500;

  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(8, 18);
  ctx.scale(0.92, 0.94);
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 26;

  ctx.beginPath();
  ctx.moveTo(18, 188);
  ctx.bezierCurveTo(42, 68, 150, 18, 275, 35);
  ctx.bezierCurveTo(326, -18, 460, 8, 492, 118);
  ctx.bezierCurveTo(530, 246, 425, 272, 432, 306);
  ctx.bezierCurveTo(436, 326, 472, 320, 454, 351);
  ctx.bezierCurveTo(430, 392, 356, 354, 378, 292);
  ctx.bezierCurveTo(385, 273, 416, 249, 413, 245);
  ctx.bezierCurveTo(398, 250, 354, 275, 354, 330);
  ctx.lineTo(354, 438);
  ctx.lineTo(274, 438);
  ctx.bezierCurveTo(260, 438, 252, 428, 252, 414);
  ctx.lineTo(252, 300);
  ctx.bezierCurveTo(226, 316, 185, 316, 162, 300);
  ctx.lineTo(186, 438);
  ctx.lineTo(110, 438);
  ctx.bezierCurveTo(92, 438, 82, 428, 82, 410);
  ctx.lineTo(93, 302);
  ctx.bezierCurveTo(71, 283, 56, 258, 50, 226);
  ctx.lineTo(24, 252);
  ctx.bezierCurveTo(8, 247, 6, 223, 18, 188);
  ctx.stroke();

  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(276, 36);
  ctx.bezierCurveTo(248, 104, 270, 180, 326, 198);
  ctx.bezierCurveTo(363, 211, 383, 185, 391, 149);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(445, 142, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 32;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(187, 282);
  ctx.bezierCurveTo(205, 300, 232, 300, 252, 286);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(252, 404);
  ctx.lineTo(252, 310);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(356, 406);
  ctx.lineTo(356, 330);
  ctx.stroke();
  ctx.restore();

  return {
    matrix: createMatrixFromCanvas(canvas),
    canvas,
  };
}
