import { Line, Cell, get_memory_buffer } from "wasm-elementary-cellular-automaton";

const memoryView = get_memory_buffer();

const line = Line.new();

const ruleTiles = document.querySelectorAll(".rule-tile");
const ruleNumberInput = document.getElementById("rule-number-input");
const preset = document.getElementById("presets");
const gridSizeInput = document.getElementById("grid-size");
const generateButton = document.getElementById("generate-button");
const canvas = document.getElementById("automaton-canvas");

let ruleValue = 30;
let cellSize = 10;
let length = line.length();
let row = 0;
let animationId = null;
const ticksPerFrame = 5;

const DEAD_COLOR = "#fafafa";
const ALIVE_COLOR = "#333333";

canvas.width = 1000;
canvas.height = 1000;
const ctx = canvas.getContext("2d");

function convertTilesToRule() {
  let newRule = 0;
  ruleTiles.forEach(tile => {
    const index = parseInt(tile.getAttribute("data-index"));
    const bottomCell = tile.querySelector(".bot-row .cell.toggle");
    const isAlive = bottomCell.classList.contains("alive"); 
    if (isAlive) {
      const bitPos = 7 - index;
      newRule |= (1 << bitPos);
    }
  });
  ruleValue = newRule;
}

function handleTileClick(event) {
  const bottomCell = event.currentTarget;
  bottomCell.classList.toggle("alive");
  bottomCell.classList.toggle("dead");

  convertTilesToRule();

  updateRuleNumber(ruleValue);
  updatePreset(ruleValue);
}

function updateTiles(ruleValue) {
  ruleTiles.forEach(tile => {
    const index = parseInt(tile.getAttribute("data-index"));
    const bottomCell = tile.querySelector(".bot-row .cell.toggle");
    
    const bitPos = 7 - index;
    const mask = 1 << bitPos;
    
    const isAlive = (ruleValue & mask) !== 0;
    
    if (isAlive) {
      bottomCell.classList.add("alive");
      bottomCell.classList.remove("dead");
    } else {
      bottomCell.classList.add("dead");
      bottomCell.classList.remove("alive");
    }
  });
}

function updateRuleNumber(ruleValue) {
  ruleNumberInput.value = ruleValue;
}

function updatePreset(ruleValue) {
  const ruleStr = ruleValue.toString();
  let presetFound = false;

  for (let i = 0; i < preset.options.length; i++) {
    if (preset.options[i].value === ruleStr) {
      preset.selectedIndex = i;
      presetFound = true;
      break;
    }
  }
  
  if (!presetFound) {
    preset.selectedIndex = -1;
  }
}

function resetCells() {
  const cellsPtr = line.cells();
  const cells = new Uint8Array(memoryView.buffer, cellsPtr, length);

  for (let i = 0; i < length; i++) {
    cells[i] = Cell.Dead;
  }

  let middle = Math.floor(length / 2);
  cells[middle] = Cell.Alive;
}

function randomizeCells() {
  const cellsPtr = line.cells();
  const cells = new Uint8Array(memoryView.buffer, cellsPtr, length);

  for (let i = 0; i < length; i++) {
    let randomNum = Math.random();

    if (randomNum < 0.5) {
        cells[i] = Cell.Alive;
    } else {
        cells[i] = Cell.Dead;
    }
  }
}

function resizeGrid() {
  const new_length = gridSizeInput.value;

  if (!isNaN(new_length) && 1 <= new_length && new_length <= 1000) {
    line.set_length(new_length);
    length = new_length;
    cellSize = canvas.width / new_length;
    return true;
  } else {
    return false;
  }
}

ruleTiles.forEach(tile => {
  const bottomCell = tile.querySelector(".bot-row .cell.toggle");

  bottomCell.addEventListener("click", handleTileClick);
});

preset.addEventListener("change", (event) => {
  ruleValue = event.target.value;

  updateTiles(ruleValue);
  updateRuleNumber(ruleValue);
});

ruleNumberInput.addEventListener("change", (event) => {
  ruleValue = event.target.value;

  if (!isNaN(ruleValue) && 0 <= ruleValue && ruleValue <= 255) {
    updateTiles(ruleValue);
  } else {
    updateTiles(0);
  }

  updatePreset(ruleValue);
});

generateButton.addEventListener("click", function(event) {
  let startingCond = document.getElementById("starting-condition").value;
  let valid_grid_size = resizeGrid();

  if (valid_grid_size) {
    if (!isNaN(ruleValue) && 0 <= ruleValue && ruleValue <= 255) {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }

      row = 0;
      const rule = ruleValue;
      line.change_rule(rule);

      if (startingCond === "singleCell") {
          resetCells();
      } else {
          randomizeCells();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCells();
      animationId = requestAnimationFrame(renderLoop);
    } else {
      alert("Invalid rule (value must be between 0 and 255).");  
    }
  } else {
    alert("Invalid grid size (value must be between 1 and 1000).");
  }
});

const drawCells = () => {
  const cellsPtr = line.cells();
  const cells = new Uint8Array(memoryView.buffer, cellsPtr, length);

  ctx.beginPath();

  for (let i = 0; i < length; i++) {  
    ctx.fillStyle = cells[i] === Cell.Dead
      ? DEAD_COLOR
      : ALIVE_COLOR;

    ctx.fillRect(
      i * cellSize,
      row,
      cellSize,
      cellSize
    );
  }

  ctx.stroke();
};

const renderLoop = () => {
  for (let i = 0; i < ticksPerFrame; i++) {
    line.tick();
    row += cellSize;

    if (row >= canvas.height) {
      cancelAnimationFrame(animationId);
      return;
    }

    drawCells();
  }

  animationId = requestAnimationFrame(renderLoop);
};